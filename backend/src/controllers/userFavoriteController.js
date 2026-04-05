const userFavoriteService = require('../services/userFavoriteService');
const userService = require('../services/userService');
const validationService = require('../services/validationService');

// GET /api/userfavorites/
exports.getUserFavoritesByUserId = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    const favoriteLocations = await userFavoriteService.getUserFavoritesByUserId(userId);
    res.json(favoriteLocations);
  } catch (err) {
    console.error(`Error fetching favorites for user:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/userfavorites/toggle
exports.toggleFavorite = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is empty' });
  }

  const { locationId } = req.body;

  if (locationId === undefined) {
    return res.status(400).json({ message: 'locationId is required' });
  }

  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const uId = user.id;

    const lId = parseInt(locationId, 10);

    if (isNaN(uId) || isNaN(lId)) {
      return res.status(400).json({ message: 'Invalid User ID or Location ID' });
    }

    const result = await userFavoriteService.toggleFavorite(uId, lId);
    // Returns { favorited: true } or { favorited: false }
    res.json(result);
  } catch (err) {
    console.error(`Error toggling favorite for user:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};