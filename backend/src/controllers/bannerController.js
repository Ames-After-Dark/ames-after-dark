const bannerService = require('../services/bannerService');
const userService = require('../services/userService');

// GET /api/banners
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