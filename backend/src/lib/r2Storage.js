const { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ALLOWED_UPLOAD_CONTENT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const {
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET,
  CLOUDFLARE_R2_S3_ENDPOINT,
} = process.env;

const s3 = new S3Client({
  region: 'auto',
  endpoint: CLOUDFLARE_R2_S3_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a signed URL for an R2 object key, valid for 1 hour.
 */
async function signedUrlForKey(key) {
  const command = new GetObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

/**
 * Check whether an object already exists at the given key.
 */
async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return false;
    throw err;
  }
}

/**
 * List objects in R2 with pagination to bypass 1000 object limit
 */
async function listR2Objects(prefix = '') {
  let isTruncated = true;
  let continuationToken = undefined;
  const allContents = [];

  try {
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: CLOUDFLARE_R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3.send(command);

      if (response.Contents) {
        allContents.push(...response.Contents);
      }

      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }

    return allContents;
  } catch (err) {
    console.warn('R2 list error:', err);
    return [];
  }
}

/**
 * Parse a folder name into display name and date string.
 * If no date found, returns display name as-is and dateStr as null.
 */
function parseFolderName(folderName) {
  const cleaned = folderName.trim();
  const match = cleaned.match(/^(.+?)[\s_]+(\d{1,2}[-\/]\d{1,2}(?:[-\/]\d{2,4})?)$/);

  if (match) {
    const displayName = match[1].replace(/_+$/, '').trim();
    return { displayName, dateStr: match[2] };
  }

  return { displayName: cleaned, dateStr: null };
}

/**
 * Parse a date string like "03-12" into a Date object.
 * If date is in the future, roll back to previous year.
 */
function parseDateStr(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-\/]/);
  if (parts.length < 2) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const now = new Date();
  let year = now.getFullYear();

  if (parts.length === 3) {
    const providedYear = parseInt(parts[2].trim(), 10);
    year = providedYear < 100 ? 2000 + providedYear : providedYear;
  }

  let candidate = new Date(year, month, day);
  if (candidate > now && parts.length !== 3) candidate = new Date(year - 1, month, day);

  return candidate;
}

/**
 * Format date string like "3-12" into "03/12" for display.
 */
function formatDateStr(dateStr) {
  if (!dateStr) return null;
  const [m, d] = dateStr.split('-');
  return `${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
}

/**
 * Validate an uploaded filename: basename only (no path separators),
 * and its extension must match the declared content type.
 */
function sanitizeFilename(filename, contentType) {
  const base = String(filename || '').split(/[\\/]/).pop().trim();
  if (!base || base.includes('..')) return null;

  const expectedExt = ALLOWED_UPLOAD_CONTENT_TYPES[contentType];
  if (!expectedExt) return null;

  const actualExt = base.toLowerCase().split('.').pop();
  const jpgAliases = expectedExt === 'jpg' ? ['jpg', 'jpeg'] : [expectedExt];
  if (!jpgAliases.includes(actualExt)) return null;

  return base;
}

module.exports = {
  s3,
  CLOUDFLARE_R2_BUCKET,
  ALLOWED_UPLOAD_CONTENT_TYPES,
  signedUrlForKey,
  objectExists,
  listR2Objects,
  parseFolderName,
  parseDateStr,
  formatDateStr,
  sanitizeFilename,
};
