const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const checkJwt = require('../middleware/authMiddleware');

router.get('/:userId/friends', userController.getUserFriends);

// CRUD routes
router.get('/', userController.getUsers);         // Read all
router.get('/:id', userController.getUserById);  // Read one
router.put('/:id', userController.updateUserLimited);   // Update

// Auth0 protected routes
router.get('/auth/status', checkJwt, userController.checkUserStatus); // Check user status
router.post('/auth/register', checkJwt, userController.completeUserRegistration); // Complete registration

// TEMP_AUTH_START - Remove when re-enabling Auth0
router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);
// TEMP_AUTH_END

module.exports = router;
