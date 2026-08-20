const express = require('express');
const router = express.Router();
const locationHoursController = require('../controllers/locationHourController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Location Hours
 *     description: Operations related to location operating hours
 */

/**
 * @swagger
 * /api/locationhours/{locationId}/weekly:
 *   put:
 *     summary: Update weekly hours for a location
 *     description: Updates the full weekly schedule for a location
 *     tags:
 *       - Location Hours
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monday:
 *                 $ref: '#/components/schemas/LocationHour'
 *               tuesday:
 *                 $ref: '#/components/schemas/LocationHour'
 *               wednesday:
 *                 $ref: '#/components/schemas/LocationHour'
 *               thursday:
 *                 $ref: '#/components/schemas/LocationHour'
 *               friday:
 *                 $ref: '#/components/schemas/LocationHour'
 *               saturday:
 *                 $ref: '#/components/schemas/LocationHour'
 *               sunday:
 *                 $ref: '#/components/schemas/LocationHour'
 *     responses:
 *       200:
 *         description: Weekly hours updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.put('/:locationId/weekly', checkJwt, locationHoursController.updateWeeklyHours);

/**
 * @swagger
 * /api/locationhours/{locationId}/overrides:
 *   post:
 *     summary: Create hour override (holiday or emergency)
 *     description: Adds a one-off holiday or emergency override for location hours
 *     tags:
 *       - Location Hours
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - openTime
 *               - closeTime
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               openTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               closeTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Override created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.post('/:locationId/overrides', checkJwt, locationHoursController.createOverride);

/**
 * @swagger
 * /api/locationhours/overrides/{overrideId}:
 *   delete:
 *     summary: Delete hour override
 *     description: Removes a specific hour override
 *     tags:
 *       - Location Hours
 *     parameters:
 *       - name: overrideId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Override ID
 *     responses:
 *       204:
 *         description: Override deleted successfully
 *       404:
 *         description: Override not found
 *       500:
 *         description: Server error
 */
router.delete('/overrides/:overrideId', checkJwt, locationHoursController.deleteOverride);

/**
 * @swagger
 * /api/locationhours/{locationId}:
 *   get:
 *     summary: Get location hours
 *     description: Retrieves operating hours for a specific location
 *     tags:
 *       - Location Hours
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location hours retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LocationHour'
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.get('/:locationId', locationHoursController.getHoursByLocationId);

module.exports = router;