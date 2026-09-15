const bannerService = require('../services/bannerService');
const userService = require('../services/userService');
const { s3, sanitizeFilename, ALLOWED_UPLOAD_CONTENT_TYPES } = require('../lib/r2Storage');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { CLOUDFLARE_R2_BANNERS_BUCKET, CLOUDFLARE_R2_BANNERS_PUBLIC_BASE_URL } = process.env;

// Shared permission check for every banner-management endpoint: only bar
// admins and the developer can manage banners today (same gate createBanner
// already used) - there is no per-location scoping since a banner isn't
// owned by a single bar the way a deal/event is.
async function requireBannerAdmin(req, res) {
  const authId = req.auth?.payload?.sub;
  if (!authId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const userRoles = await userService.getUserRolesByAuth0Id(authId);
  if (!userRoles || (!userRoles.isAdmin && !userRoles.isDeveloper)) {
    res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    return null;
  }

  return userRoles;
}

// GET /api/banners
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners();
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/banners/upload-url
exports.getBannerUploadUrl = async (req, res) => {
  try {
    const userRoles = await requireBannerAdmin(req, res);
    if (!userRoles) return;

    const { filename, contentType } = req.body || {};
    const safeFilename = sanitizeFilename(filename, contentType);
    if (!safeFilename) {
      return res.status(400).json({ error: `Invalid filename or content type: ${filename}` });
    }

    const ext = ALLOWED_UPLOAD_CONTENT_TYPES[contentType];
    const key = `${Date.now()}-${safeFilename.replace(/\.[^.]+$/, '')}.${ext}`;
    const command = new PutObjectCommand({ Bucket: CLOUDFLARE_R2_BANNERS_BUCKET, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    const publicUrl = `${CLOUDFLARE_R2_BANNERS_PUBLIC_BASE_URL}/${key}`;

    res.json({ uploadUrl, key, publicUrl });
  } catch (err) {
    console.error('Error generating banner upload URL:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

// GET /api/banners/active
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await bannerService.getActiveBanners();
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/banners/:id
exports.getBannerById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const banner = await bannerService.getBannerById(id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    //Unsure on the role names but not super important right now
    if (!userRoles || (!userRoles.isAdmin && userRoles.roles?.name?.toLowerCase() !== 'developer')) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const { name, image_url } = req.body;

    if (!name || !image_url) {
      return res.status(400).json({ error: "Name and image_url are required." });
    }

    const newBanner = await bannerService.createBanner({ name, image_url });

    res.status(201).json(newBanner);
  } catch (error) {
    // Check for Prisma unique constraint violation (P2002)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "A banner with this name already exists." });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/banners/:id
exports.updateBanner = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const userRoles = await requireBannerAdmin(req, res);
    if (!userRoles) return;

    const { name, image_url } = req.body || {};
    const updated = await bannerService.updateBanner(id, { name, image_url });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A banner with this name already exists.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Banner not found' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/banners/:id
exports.deleteBanner = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const userRoles = await requireBannerAdmin(req, res);
    if (!userRoles) return;

    const existing = await bannerService.getBannerById(id);
    if (!existing) return res.status(404).json({ message: 'Banner not found' });

    await bannerService.deleteBanner(id);

    // Best-effort cleanup of the R2 object - the banner row is already
    // gone either way, so a storage-side failure here shouldn't surface
    // as an error to the admin.
    const key = existing.image_url?.startsWith(`${CLOUDFLARE_R2_BANNERS_PUBLIC_BASE_URL}/`)
      ? existing.image_url.slice(`${CLOUDFLARE_R2_BANNERS_PUBLIC_BASE_URL}/`.length)
      : null;
    if (key) {
      s3.send(new DeleteObjectCommand({ Bucket: CLOUDFLARE_R2_BANNERS_BUCKET, Key: key })).catch((err) => {
        console.warn(`Failed to delete R2 object for banner ${id}:`, err);
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBannersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required in the request body' });
    }

    const banners = await bannerService.getBannersByDateRange(new Date(startDate), new Date(endDate));
    res.json(banners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};