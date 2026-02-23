const express = require('express');
const router = express.Router();
const locationHoursController = require('../controllers/locationHourController');

// Update the full weekly schedule for a bar
router.put('/:locationId/weekly', locationHoursController.updateWeeklyHours);

// Add a one-off holiday or emergency override
router.post('/:locationId/overrides', locationHoursController.createOverride);

// Delete an override
router.delete('/overrides/:overrideId', locationHoursController.deleteOverride);

// GET /api/locationhours/:locationId
router.get('/:locationId', locationHoursController.getHoursByLocationId);

module.exports = router;