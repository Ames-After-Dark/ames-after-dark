const bannerService = require('../services/bannerService');

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
