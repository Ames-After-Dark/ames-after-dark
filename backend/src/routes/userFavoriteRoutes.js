const express = require('express');
const router = express.Router();
const userFavoriteController = require('../controllers/userFavoriteController');

router.get('/:userId', userFavoriteController.getUserFavoritesByUserId);         // Read all
router.post('/toggle', userFavoriteController.toggleFavorite); 

module.exports = router;
