/**
 * Domain Service - Album Management (Photos/Gallery)
 * Extracts business logic from r2Routes.js
 * Manages photo albums stored in R2 (Cloudflare)
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class AlbumService {
  constructor(r2Config) {
    this.bucketName = r2Config.bucket;
    this.endpoint = r2Config.endpoint;
    
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });
  }

  /**
   * Query: GetRecentAlbums
   * Returns albums from the most recent weekend
   */
  async getRecentAlbums() {
    try {
      const allObjects = await this.listR2Objects('', 5000);
      
      if (!allObjects || allObjects.length === 0) {
        return [];
      }

      // Group photos by bar folder (aggregate)
      const photosByFolder = this.groupPhotosByFolder(allObjects);
      
      // Parse folder metadata
      const folderMeta = this.parseFolderMetadata(Object.keys(photosByFolder));
      
      // Find most recent date
      const latestDate = this.findLatestDate(folderMeta);
      if (!latestDate) {
        return [];
      }

      // Build albums for folders matching latest date
      const albums = await this.buildAlbumsForDate(
        photosByFolder,
        folderMeta,
        latestDate
      );

      // Sort by bar name for consistent ordering
      albums.sort((a, b) => a.barName.localeCompare(b.barName));
      return albums;
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw new Error('Failed to fetch albums from storage');
    }
  }

  /**
   * Query: GetAlbumPhotos
   * Returns all photos for a specific album
   */
  async getAlbumPhotos(albumPrefix) {
    try {
      if (!albumPrefix) {
        throw new Error('Album prefix is required');
      }

      let normalizedPrefix = albumPrefix.replace(/^\//, '');
      if (!normalizedPrefix.endsWith('/')) {
        normalizedPrefix = `${normalizedPrefix}/`;
      }

      const objects = await this.listR2Objects(normalizedPrefix, 5000);
      
      if (!objects || objects.length === 0) {
        return [];
      }

      // Filter to image files only
      const imageObjects = this.filterImageFiles(objects);

      // Generate signed URLs for each image
      const photos = await Promise.all(
        imageObjects.map(async (obj) => ({
          id: obj.Key,
          uri: await this.generateSignedUrl(obj.Key),
        }))
      );

      return photos;
    } catch (error) {
      console.error('Error fetching album photos:', error);
      throw new Error('Failed to fetch photos from storage');
    }
  }

  /**
   * Helper: List objects in R2 with prefix and limit
   */
  async listR2Objects(prefix = '', limit = 1000) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: limit,
      });
      
      const response = await this.s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.warn('R2 list error:', error);
      return [];
    }
  }

  /**
   * Helper: Generate signed URL for R2 object
   */
  async generateSignedUrl(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  /**
   * Helper: Group photos by folder
   */
  groupPhotosByFolder(objects) {
    const photosByFolder = {};

    for (const obj of objects) {
      const key = obj?.Key || '';
      const folderName = key.split('/')[0];
      const ext = key.toLowerCase().split('.').pop();

      // Skip if no folder or not an image
      if (!folderName || !this.isImageFile(ext)) continue;

      if (!photosByFolder[folderName]) {
        photosByFolder[folderName] = [];
      }
      photosByFolder[folderName].push(obj);
    }

    return photosByFolder;
  }

  /**
   * Helper: Check if file is an image
   */
  isImageFile(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  }

  /**
   * Helper: Parse folder names into display name and date
   * Format: "Bar Name 03-12"
   */
  parseFolderMetadata(folderNames) {
    const folderMeta = {};

    for (const folderName of folderNames) {
      const { displayName, dateStr } = this.parseFolderName(folderName);
      const date = this.parseDateString(dateStr);
      
      folderMeta[folderName] = {
        displayName,
        dateStr,
        date,
      };
    }

    return folderMeta;
  }

  /**
   * Helper: Parse folder name like "Bar Name 09-23"
   */
  parseFolderName(folderName) {
    const match = folderName.trim().match(/^(.+?)\s+(\d{1,2}-\d{1,2})$/);
    
    if (match) {
      return {
        displayName: match[1],
        dateStr: match[2],
      };
    }

    return {
      displayName: folderName.trim(),
      dateStr: null,
    };
  }

  /**
   * Helper: Parse date string "03-12" to Date object
   * If future date, roll back to previous year
   */
  parseDateString(dateStr) {
    if (!dateStr) return null;

    const parts = dateStr.split('-');
    if (parts.length !== 2) return null;

    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);

    if (isNaN(month) || isNaN(day)) return null;

    const now = new Date();
    let candidate = new Date(now.getFullYear(), month, day);

    // If date is in future, use previous year
    if (candidate > now) {
      candidate = new Date(now.getFullYear() - 1, month, day);
    }

    return candidate;
  }

  /**
   * Helper: Find the latest date among all folders
   */
  findLatestDate(folderMeta) {
    const allDates = Object.values(folderMeta)
      .map(m => m.date)
      .filter(Boolean)
      .map(d => d.getTime());

    if (!allDates.length) return null;

    return Math.max(...allDates);
  }

  /**
   * Helper: Build albums for a specific date
   */
  async buildAlbumsForDate(photosByFolder, folderMeta, latestTime) {
    const albums = await Promise.all(
      Object.entries(photosByFolder)
        .filter(([folderName]) => {
          const meta = folderMeta[folderName];
          return meta.date && meta.date.getTime() === latestTime;
        })
        .map(async ([folderName, objects]) => {
          const meta = folderMeta[folderName];
          
          // Find most recently modified photo as cover
          const cover = objects.reduce((a, b) =>
            new Date(b.LastModified) > new Date(a.LastModified) ? b : a
          );

          const coverUrl = await this.generateSignedUrl(cover.Key);

          return {
            id: folderName,
            name: meta.displayName,
            barName: meta.displayName,
            date: this.formatDateString(meta.dateStr),
            coverUrl,
            albumUri: `${folderName}/`,
          };
        })
    );

    return albums;
  }

  /**
   * Helper: Format date string "3-12" to "03/12"
   */
  formatDateString(dateStr) {
    if (!dateStr) return null;

    const [m, d] = dateStr.split('-');
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
  }

  /**
   * Helper: Filter to image files only
   */
  filterImageFiles(objects) {
    return objects.filter(o =>
      this.isImageFile((o?.Key || '').toLowerCase().split('.').pop())
    );
  }
}

module.exports = AlbumService;
