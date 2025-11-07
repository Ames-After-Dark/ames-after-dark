const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// CRUD routes
router.get('/', userController.getUsers);         // Read all
router.get('/:id', userController.getUserById);  // Read one

module.exports = router;
