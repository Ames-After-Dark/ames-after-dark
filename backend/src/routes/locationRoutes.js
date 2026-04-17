const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { checkJwt, optionalJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Locations
 *     description: Operations related to bar/venue locations
 */

/**
 * @swagger
 * /api/locations/open:
 *   get:
 *     summary: Get currently open locations
 *     description: Retrieves all locations that are currently open, optionally filtered by UTC time
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: utc
 *         in: query
 *         schema:
 *           type: string
 *         description: UTC timestamp for time-based filtering
 *     responses:
 *       200:
 *         description: Open locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       500:
 *         description: Server error
 */
router.get('/open', locationController.getOpenLocations);

/**
 * @swagger
 * /api/locations/with-hours:
 *     get:
 *       summary: Get locations with operating hours
 *       description: Retrieves all locations with their operating hours included
 *       tags:
 *         - Locations
 *       responses:
 *         200:
 *           description: Locations with hours retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     location:
 *                       $ref: '#/components/schemas/Location'
 *                     hours:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LocationHour'
 *         500:
 *           description: Server error
 */
router.get('/with-hours', locationController.getLocationsWithHours);

/**
 * @swagger
 * /api/locations/admin/{id}:
 *   get:
 *     summary: Get locations by admin ID
 *     description: Retrieves locations managed by a specific admin
 *     tags:
 *       - Locations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Admin locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.get('/admin/:id', checkJwt, locationController.getLocationsByAdminId);

/**
 * @swagger
 * /api/locations/developer/{id}:
 *   get:
 *     summary: Get locations by developer ID
 *     description: Retrieves locations associated with a specific developer
 *     tags:
 *       - Locations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Developer user ID
 *     responses:
 *       200:
 *         description: Developer locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Developer not found
 *       500:
 *         description: Server error
 */
router.get('/developer/:id', checkJwt, locationController.getLocationsByDeveloperId);

/**
 * @swagger
 * /api/locations/views/{id}:
 *   get:
 *     summary: Get total location views
 *     description: Retrieves the total number of views for a specific location
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: View count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 views:
 *                   type: integer
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.get('/views/:id', locationController.getTotalLocationViewsById);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations
 *     description: Retrieves all locations
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: All locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new location
 *     description: Creates a new location/venue
 *     tags:
 *       - Locations
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               phoneNumber:
 *                 type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', locationController.getLocations);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     description: Retrieves a specific location by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a location
 *     description: Updates an existing location
 *     tags:
 *       - Locations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
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
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               phoneNumber:
 *                 type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a location
 *     description: Deletes a specific location
 *     tags:
 *       - Locations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       204:
 *         description: Location deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.get('/:id', locationController.getLocationById);
router.post('/', locationController.createLocation);
router.put('/:id', locationController.updateLocation);
router.delete('/:id', locationController.deleteLocation);

/**
 * @swagger
 * /api/locations/{locationId}/admins/{userId}:
 *   post:
 *     summary: Add an admin to a location
 *     description: Adds a user as an admin to a specific location. Only developers can perform this action.
 *     tags:
 *       - Locations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Admin added to location successfully
 *       400:
 *         description: Invalid location ID or user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only developers can add admins
 *       404:
 *         description: Location or user not found
 *       409:
 *         description: User is already an admin for this location
 *       500:
 *         description: Server error
 */
router.post('/:locationId/admins/:userId', checkJwt, locationController.addLocationAdmin);

/**
 * @swagger
 * /api/locations/{locationId}/admins/{userId}:
 *   delete:
 *     summary: Remove an admin from a location
 *     description: Removes a user from being an admin of a specific location. Only developers can perform this action.
 *     tags:
 *       - Locations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin removed from location successfully
 *       400:
 *         description: Invalid location ID or user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only developers can remove admins
 *       404:
 *         description: Location admin relationship not found
 *       500:
 *         description: Server error
 */
router.delete('/:locationId/admins/:userId', checkJwt, locationController.removeLocationAdmin);

module.exports = router;
