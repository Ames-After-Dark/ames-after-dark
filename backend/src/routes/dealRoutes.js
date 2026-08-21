const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Deals
 *     description: Operations related to special deals and promotions
 */

/**
 * @swagger
 * /api/deals/active:
 *   get:
 *     summary: Get active deals
 *     description: Retrieves all currently active deals and promotions
 *     tags:
 *       - Deals
 *     responses:
 *       200:
 *         description: Active deals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deal'
 *       500:
 *         description: Server error
 */
router.get('/active', dealController.getActiveDeals);

/**
 * @swagger
 * /api/deals/location/{locationId}:
 *   get:
 *     summary: Get deals by location
 *     description: Retrieves deals for a specific location. By default only returns deals with at least one current or upcoming occurrence, and only includes those occurrences (fully expired deals/occurrences are omitted). Pass includeHistory=true to get everything, including fully expired deals.
 *     tags:
 *       - Deals
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *       - name: includeHistory
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: If true, includes fully expired deals and past occurrences
 *     responses:
 *       200:
 *         description: Location deals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deal'
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.get('/location/:locationId', dealController.getDealsByLocationId);

/**
 * @swagger
 * /api/deals/recurring:
 *   post:
 *     summary: Create recurring deal
 *     description: Creates a recurring deal at a location
 *     tags:
 *       - Deals
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
 *               - discount
 *               - startDate
 *               - endDate
 *               - recurrence
 *             properties:
 *               locationId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               recurrence:
 *                 type: string
 *                 description: Recurrence pattern (daily, weekly, monthly)
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recurring deal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/recurring', checkJwt, dealController.createRecurringDeal);

/**
 * @swagger
 * /api/deals/search:
 *   post:
 *     summary: Search deals
 *     description: Search for deals with optional filters. All parameters are optional. Empty body returns all deals.
 *     tags:
 *       - Deals
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: Deal ID to search for
 *               locationId:
 *                 type: number
 *                 description: Location ID to search for
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Filter deals with occurrences starting at or after this datetime (ISO 8601)
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Filter deals with occurrences ending at or before this datetime (ISO 8601)
 *     responses:
 *       200:
 *         description: Deals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deal'
 *       400:
 *         description: Invalid datetime format
 *       500:
 *         description: Server error
 */
router.post('/search', dealController.searchDeals);

/**
 * @swagger
 * /api/deals:
 *   get:
 *     summary: Get all deals
 *     description: Retrieves all deals
 *     tags:
 *       - Deals
 *     responses:
 *       200:
 *         description: All deals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deal'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create deal
 *     description: Creates a new deal
 *     tags:
 *       - Deals
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
 *               - discount
 *               - startDate
 *               - endDate
 *             properties:
 *               locationId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', dealController.getDeals);

/**
 * @swagger
 * /api/deals/{id}:
 *   get:
 *     summary: Get deal by ID
 *     description: Retrieves a specific deal by ID
 *     tags:
 *       - Deals
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     responses:
 *       200:
 *         description: Deal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update deal
 *     description: Updates an existing deal
 *     tags:
 *       - Deals
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
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
 *               discount:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete deal
 *     description: Deletes a specific deal
 *     tags:
 *       - Deals
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     responses:
 *       204:
 *         description: Deal deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Server error
 */
router.get('/:id', dealController.getDealById);
router.post('/', checkJwt, dealController.createDeal);
router.put('/:id', checkJwt, dealController.updateDeal);
router.delete('/:id', checkJwt, dealController.deleteDeal);

module.exports = router;