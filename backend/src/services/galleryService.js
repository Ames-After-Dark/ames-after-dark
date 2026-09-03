const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');
const { s3, CLOUDFLARE_R2_BUCKET, signedUrlForKey, objectExists } = require('../lib/r2Storage');

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

  const ext = filename.toLowerCase().split('.').pop();
  return ALLOWED_EXTENSIONS.includes(ext);
};

exports.getOrCreatePreviewUrl = async (key) => {
  const thumbKey = deriveThumbKey(key);

  if (await objectExists(thumbKey)) {
    return signedUrlForKey(thumbKey);
  }

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
