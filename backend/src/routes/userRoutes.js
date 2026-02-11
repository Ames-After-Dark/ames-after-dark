const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:userId/friends', userController.getUserFriends);

// CRUD routes
router.get('/', userController.getUsers);         // Read all
router.get('/:id', userController.getUserById);  // Read one

// TEMP_AUTH_START - Remove when re-enabling Auth0
router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);
// TEMP_AUTH_END

module.exports = router;
