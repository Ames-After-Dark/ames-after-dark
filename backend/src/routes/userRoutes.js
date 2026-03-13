const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkJwt, optionalJwt } = require('../middleware/authMiddleware');

// Auth0 protected routes - MUST come before /:id routes
// Note: /auth/status uses optionalJwt to validate token if present but allow through if not
router.get('/auth/status', optionalJwt, userController.checkUserStatus); // Check user status (validates token if present)
router.post('/auth/register', checkJwt, userController.completeUserRegistration); // Complete registration (requires auth)
router.get('/auth/check-username', userController.checkUsernameAvailability); // Check username availability (public)
router.get('/auth/username', checkJwt, userController.getUsernameByAuth); // Get username by auth (requires auth)
router.put('/auth/username', checkJwt, userController.updateUsernameByAuth); // Update username by auth (requires auth)
router.get('/auth/profile', checkJwt, userController.getUserProfileByAuth); // Get user profile by auth (requires auth)
router.put('/auth/bio', checkJwt, userController.updateBioByAuth); // Update bio by auth (requires auth)

// CRUD routes
router.get('/', userController.getUsers);         // Read all
router.get('/:userId/friends', userController.getUserFriends);
router.get('/:id', userController.getUserById);  // Read one
router.put('/:id', userController.updateUserLimited);   // Update

router.get('/profile/favorite-drinks', userController.getUserProfileFavoriteDrinkOptions);
router.get('/profile/favorite-drinks/:id', userController.getUserProfileFavoriteDrinkOptionsById);
router.get('/profile/photo-options', userController.getUserProfilePhotoOptions);
router.get('/profile/photo-options/:id', userController.getUserProfilePhotoOptionsById);

module.exports = router;
