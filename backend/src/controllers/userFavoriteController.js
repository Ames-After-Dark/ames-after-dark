const userFavoriteService = require('../services/userFavoriteService');
const validationService = require('../services/validationService');
const userService = require('../services/userService');

// GET /api/userfavorites/:userId
exports.getUserFavoritesByUserId = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  try {
    const favoriteLocations = await userFavoriteService.getUserFavoritesByUserId(userId);
    res.json(favoriteLocations);
  } catch (err) {
    console.error(`Error fetching favorites for user ${userId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/userfavorites/toggle
exports.toggleFavorite = async (req, res) => {
  const { locationId } = req.body;

  const lId = parseInt(locationId, 10);

  if (isNaN(lId)) {
    return res.status(400).json({ message: 'Invalid Location ID' });
  }

  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    const user = await userService.getUserByAuth0Id(authId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await userFavoriteService.toggleFavorite(user.id, lId);
    // Returns { favorited: true } or { favorited: false }
    res.json(result);
  } catch (err) {
    console.error(`Error toggling favorite for user:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};