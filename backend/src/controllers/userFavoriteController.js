
const userFavoriteService = require('../services/userFavoriteService');
const validationService = require('../services/validationService');

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
  const { userId, locationId } = req.body;

  const uId = parseInt(userId, 10);
  const lId = parseInt(locationId, 10);

  if (isNaN(uId) || isNaN(lId)) {
    return res.status(400).json({ message: 'Invalid User ID or Location ID' });
  }

  try {
    const result = await userFavoriteService.toggleFavorite(uId, lId);
    // Returns { favorited: true } or { favorited: false }
    res.json(result);
  } catch (err) {
    console.error(`Error toggling favorite for user ${uId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};