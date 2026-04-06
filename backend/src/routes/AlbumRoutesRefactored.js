/**
 * Refactored Album Routes (previously r2Routes.js)
 * Extracts photo gallery/album management
 * 
 * Business logic moved to AlbumService domain service
 * Routes now just handle HTTP concerns
 */

const express = require('express');
const router = express.Router();

module.exports = (albumService) => {
  /**
   * Query: Get recent albums
   * GET /api/albums
   * 
   * Returns albums from the most recent weekend
   * Each album contains bar metadata and cover image
   */
  router.get('/', async (req, res) => {
    try {
      const albums = await albumService.getRecentAlbums();
      return res.json(albums);
    } catch (error) {
      console.error('Error fetching albums:', error);
      return res.status(500).json({ error: 'Failed to fetch albums' });
    }
  });

  /**
   * Query: Get all photos for an album
   * GET /api/albums/:albumId/photos
   * 
   * Parameters:
   *   - albumId or prefix: folder prefix in R2 (e.g., "Bar Name 03-12")
   * 
   * Returns array of photo objects with signed URLs
   */
  router.get('/:albumId/photos', async (req, res) => {
    try {
      const prefix = req.params.albumId || req.query.prefix;
      if (!prefix) {
        return res.status(400).json({ error: 'Album ID (prefix) required' });
      }

      const photos = await albumService.getAlbumPhotos(prefix);
      return res.json(photos);
    } catch (error) {
      console.error('Error fetching photos:', error);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
  });

  return router;
};
