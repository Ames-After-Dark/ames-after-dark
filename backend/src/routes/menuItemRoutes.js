const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');

router.get('/location/:locationId', menuItemController.getMenuItemsByLocationId);

// CRUD routes
//router.get('/', menuItemController.getMenuItems);           // Read all
router.get('/:id', menuItemController.getMenuItemById);     // Read one
router.post('/', menuItemController.createMenuItem);        // Create
router.put('/:id', menuItemController.updateMenuItem);      // Update
router.delete('/:id', menuItemController.deleteMenuItem);   // Delete

module.exports = router;