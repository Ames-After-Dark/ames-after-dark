const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// CRUD routes
router.get('/', eventController.getEvents);           // Read all
router.get('/:id', eventController.getEventById);     // Read one
router.post('/', eventController.createEvent);        // Create
router.put('/:id', eventController.updateEvent);      // Update
router.delete('/:id', eventController.deleteEvent);   // Delete

module.exports = router;