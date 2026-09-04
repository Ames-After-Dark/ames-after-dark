const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');
const { s3, CLOUDFLARE_R2_BUCKET, signedUrlForKey, objectExists, parseFolderName, parseDateStr } = require('../lib/r2Storage');

const PREVIEW_MAX_WIDTH = 700;
const PREVIEW_JPEG_QUALITY = 70;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

function deriveThumbKey(key) {
  const parts = key.split('/');
  const filename = parts.pop();
  const folder = parts.join('/');
  return `${folder}/thumb_${filename}`;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

exports.isValidPhotoKey = (key) => {
  if (typeof key !== 'string' || key.includes('..')) return false;

  const parts = key.split('/');
  if (parts.length !== 2) return false;

  const [folder, filename] = parts;
  if (!folder || !filename) return false;
  if (filename.startsWith('thumb_') || filename.startsWith('hidden_')) return false;

  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) return false;
  const ext = filename.slice(dotIndex + 1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return false;

  const { dateStr } = parseFolderName(folder);
  return parseDateStr(dateStr) != null;
};

const MAX_CONCURRENT_GENERATIONS = 3;
let activeGenerations = 0;
const pendingGenerations = [];
const inFlightByThumbKey = new Map();

function acquireGenerationSlot() {
  if (activeGenerations < MAX_CONCURRENT_GENERATIONS) {
    activeGenerations++;
    return Promise.resolve();
  }
  return new Promise((resolve) => pendingGenerations.push(resolve));
}

function releaseGenerationSlot() {
  const next = pendingGenerations.shift();
  if (next) {
    next();
  } else {
    activeGenerations--;
  }
}

async function generateAndCacheThumb(key, thumbKey) {
  if (inFlightByThumbKey.has(thumbKey)) {
    return inFlightByThumbKey.get(thumbKey);
  }

  const promise = (async () => {
    await acquireGenerationSlot();
    try {
      const original = await s3.send(new GetObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key }));
      const buffer = await streamToBuffer(original.Body);
      const resized = await sharp(buffer)
        .resize({ width: PREVIEW_MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: PREVIEW_JPEG_QUALITY })
        .toBuffer();

      await s3.send(new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET,
        Key: thumbKey,
        Body: resized,
        ContentType: 'image/jpeg',
      }));
    } finally {
      releaseGenerationSlot();
    }
  })();

  inFlightByThumbKey.set(thumbKey, promise);
  try {
    await promise;
  } finally {
    inFlightByThumbKey.delete(thumbKey);
  }
}

exports.getOrCreatePreviewUrl = async (key) => {
  const thumbKey = deriveThumbKey(key);

  if (!(await objectExists(thumbKey))) {
    await generateAndCacheThumb(key, thumbKey);
  }

  return signedUrlForKey(thumbKey);
};

exports.getDownloadUrl = async (key) => {
  const filename = key.split('/').pop();
  const command = new GetObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
};
