const photographerService = require('../services/photographerService');
const userService = require('../services/userService');
const {
  signedUrlForKey,
  listR2Objects,
  parseFolderName,
  parseDateStr,
  formatDateStr,
  ALLOWED_UPLOAD_CONTENT_TYPES,
  sanitizeFilename,
  s3,
  CLOUDFLARE_R2_BUCKET,
} = require('../lib/r2Storage');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function coverUrlForFolder(folderName) {
  const objects = await listR2Objects(`${folderName}/`);
  const images = objects.filter((o) => {
    const key = o?.Key || '';
    if (key.includes('hidden_')) return false;
    const ext = key.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });
  if (images.length === 0) return null;
  const cover = images.reduce((a, b) => (new Date(b.LastModified) > new Date(a.LastModified) ? b : a));
  return signedUrlForKey(cover.Key);
}

// GET /api/photographers/:username
exports.getPublicProfile = async (req, res) => {
  try {
    const profile = await photographerService.getPublicProfileByUsername(req.params.username);
    if (!profile) return res.status(404).json({ error: 'Photographer not found' });

    const albums = (await Promise.all(profile.albums.map(async (a) => {
      const { dateStr } = parseFolderName(a.folderName);
      return {
        folder: a.folderName,
        barName: a.barName,
        date: formatDateStr(dateStr),
        sortDate: parseDateStr(dateStr)?.getTime() ?? 0,
        coverUrl: await coverUrlForFolder(a.folderName),
      };
    })))
      .filter((a) => a.coverUrl)
      .sort((a, b) => b.sortDate - a.sortDate)
      .map(({ sortDate, ...rest }) => rest);

    res.json({
      name: profile.name,
      bio: profile.bio,
      photoUrl: profile.photoKey ? await signedUrlForKey(profile.photoKey) : null,
      links: profile.links,
      albums,
    });
  } catch (err) {
    console.error('Error fetching photographer profile:', err);
    res.status(500).json({ error: 'Failed to fetch photographer profile' });
  }
};

async function requirePhotographer(req, res) {
  const authId = req.auth?.payload?.sub;
  if (!authId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const userRoles = await userService.getUserRolesByAuth0Id(authId);
  const roleName = userRoles?.roles?.name?.toLowerCase();
  if (roleName !== 'photographer' && !userRoles?.isDeveloper) {
    res.status(403).json({ error: 'Forbidden: requires photographer role' });
    return null;
  }
  return userRoles;
}

// GET /api/photographers/me
exports.getMyProfile = async (req, res) => {
  try {
    const userRoles = await requirePhotographer(req, res);
    if (!userRoles) return;

    const profile = await photographerService.getMyProfile(userRoles.id);
    res.json({
      bio: profile.bio,
      photoUrl: profile.photoKey ? await signedUrlForKey(profile.photoKey) : null,
      links: profile.links,
    });
  } catch (err) {
    console.error('Error fetching my photographer profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const MAX_LINKS = 20;
const MAX_LABEL_LENGTH = 100;
const MAX_URL_LENGTH = 512;
const URL_SCHEME_RE = /^https?:\/\//i;

/**
 * Validate the shape of the `links` array from a profile update request.
 * Returns an error message string if invalid, or null if valid.
 */
function validateLinks(links) {
  if (!Array.isArray(links)) return 'links must be an array';
  if (links.length > MAX_LINKS) return `links must contain at most ${MAX_LINKS} entries`;

  for (const link of links) {
    if (!link || typeof link !== 'object') return 'each link must be an object with label and url';
    const label = typeof link.label === 'string' ? link.label.trim() : '';
    const url = typeof link.url === 'string' ? link.url.trim() : '';
    if (!label) return 'each link must have a non-empty label';
    if (!url) return 'each link must have a non-empty url';
    if (!URL_SCHEME_RE.test(url)) return 'each link url must start with http:// or https://';
    if (label.length > MAX_LABEL_LENGTH) return `link label must be at most ${MAX_LABEL_LENGTH} characters`;
    if (url.length > MAX_URL_LENGTH) return `link url must be at most ${MAX_URL_LENGTH} characters`;
  }
  return null;
}

// PATCH /api/photographers/me
exports.updateMyProfile = async (req, res) => {
  try {
    const userRoles = await requirePhotographer(req, res);
    if (!userRoles) return;

    const { bio, links, photoKey } = req.body || {};

    let trimmedLinks;
    if (links !== undefined) {
      const linksError = validateLinks(links);
      if (linksError) {
        return res.status(400).json({ error: linksError });
      }
      trimmedLinks = links.map((link) => ({ label: link.label.trim(), url: link.url.trim() }));
    }

    if (photoKey !== undefined) {
      const expectedPhotoKeyRe = new RegExp(`^photographer-photos/${userRoles.id}\\.(jpg|jpeg|png|webp|gif)$`);
      if (!expectedPhotoKeyRe.test(photoKey)) {
        return res.status(400).json({ error: 'Invalid photoKey' });
      }
    }

    await photographerService.updateMyProfile(userRoles.id, { bio, links: trimmedLinks, photoKey });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating photographer profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// POST /api/photographers/me/photo
exports.getPhotoUploadUrl = async (req, res) => {
  try {
    const userRoles = await requirePhotographer(req, res);
    if (!userRoles) return;

    const { filename, contentType } = req.body || {};
    const safeFilename = sanitizeFilename(filename, contentType);
    if (!safeFilename) {
      return res.status(400).json({ error: `Invalid filename or content type: ${filename}` });
    }

    const ext = ALLOWED_UPLOAD_CONTENT_TYPES[contentType];
    const key = `photographer-photos/${userRoles.id}.${ext}`;
    const command = new PutObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    res.json({ uploadUrl, key });
  } catch (err) {
    console.error('Error generating photo upload URL:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};
