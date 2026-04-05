const express = require('express');
const router = express.Router();
const userFavoriteController = require('../controllers/userFavoriteController');
const { checkJwt } = require('../middleware/authMiddleware');

router.get('/', checkJwt, userFavoriteController.getUserFavoritesByUserId);         // Read all
router.post('/toggle', checkJwt, userFavoriteController.toggleFavorite);

module.exports = router;
