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
