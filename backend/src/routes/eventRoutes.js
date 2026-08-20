const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Operations related to events at locations
 */

/**
 * @swagger
 * /api/events/search:
 *   post:
 *     summary: Search events
 *     description: Search for events with optional filters. All parameters are optional. Empty body returns all events.
 *     tags:
 *       - Events
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: Event ID to search for
 *               locationId:
 *                 type: number
 *                 description: Location ID to search for
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Filter events with occurrences starting at or after this datetime (ISO 8601)
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Filter events with occurrences ending at or before this datetime (ISO 8601)
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid datetime format
 *       500:
 *         description: Server error
 */
router.post('/search', eventController.searchEvents);

/**
 * @swagger
 * /api/events/active:
 *   get:
 *     summary: Get active events
 *     description: Retrieves all currently active events
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: Active events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Server error
 */
router.get('/active', eventController.getActiveEvents);

/**
 * @swagger
 * /api/events/location/{locationId}:
 *   get:
 *     summary: Get events by location
 *     description: Retrieves all events for a specific location
 *     tags:
 *       - Events
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.get('/location/:locationId', eventController.getEventsByLocationId);

/**
 * @swagger
 * /api/events/recurring:
 *   post:
 *     summary: Create recurring event
 *     description: Creates a recurring event at a location
 *     tags:
 *       - Events
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationId
 *               - title
 *               - startTime
 *               - endTime
 *               - recurrence
 *             properties:
 *               locationId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               recurrence:
 *                 type: string
 *                 description: Recurrence pattern (daily, weekly, monthly)
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recurring event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/recurring', checkJwt, eventController.createRecurringEvent);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieves all events
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: All events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create event
 *     description: Creates a new event
 *     tags:
 *       - Events
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationId
 *               - title
 *               - startTime
 *               - endTime
 *             properties:
 *               locationId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', eventController.getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieves a specific event by ID
 *     tags:
 *       - Events
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update event
 *     description: Updates an existing event
 *     tags:
 *       - Events
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete event
 *     description: Deletes a specific event
 *     tags:
 *       - Events
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get('/:id', eventController.getEventById);
router.post('/', checkJwt, eventController.createEvent);
router.put('/:id', checkJwt, eventController.updateEvent);
router.delete('/:id', checkJwt, eventController.deleteEvent);

module.exports = router;