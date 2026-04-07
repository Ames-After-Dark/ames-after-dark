const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { checkJwt } = require('../middleware/authMiddleware');

router.get('/active', eventController.getActiveEvents);
router.get('/location/:locationId', eventController.getEventsByLocationId);
router.post('/recurring', checkJwt, eventController.createRecurringEvent);

// CRUD routes
router.get('/', eventController.getEvents);           // Read all
router.get('/:id', eventController.getEventById);     // Read one
router.post('/', checkJwt, eventController.createEvent);        // Create
router.put('/:id', checkJwt, eventController.updateEvent);      // Update
router.delete('/:id', checkJwt, eventController.deleteEvent);   // Delete

module.exports = router;