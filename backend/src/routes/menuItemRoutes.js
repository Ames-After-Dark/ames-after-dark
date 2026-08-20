const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');
const { checkJwt } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/menuitems/location/{locationId}:
 *   get:
 *     summary: Get menu items for a location
 *     description: Retrieves all menu items (drinks, food) for a specific location
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Menu items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   type:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.get('/location/:locationId', menuItemController.getMenuItemsByLocationId);

/**
 * @swagger
 * /api/menuitems/types:
 *   get:
 *     summary: Get all menu item types
 *     description: Retrieves all available menu item types (drink categories, food categories)
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: Menu item types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create menu item type
 *     description: Creates a new menu item type (category)
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
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Menu item type created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.get('/types', menuItemController.getMenuItemTypes);
router.post('/types', checkJwt, menuItemController.createMenuItemType);

/**
 * @swagger
 * /api/menuitems/{id}:
 *   get:
 *     summary: Get menu item by ID
 *     description: Retrieves a specific menu item
 *     tags:
 *       - Locations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item retrieved successfully
 *       404:
 *         description: Menu item not found
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create menu item
 *     description: Creates a new menu item at a location
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
 *               - location_id
 *               - name
 *               - menu_item_type_id
 *             properties:
 *               location_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               menu_item_type_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               is_available:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update menu item
 *     description: Updates an existing menu item
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
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               menu_item_type_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               is_available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Menu item not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete menu item
 *     description: Deletes a specific menu item
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
 *         description: Menu item ID
 *     responses:
 *       204:
 *         description: Menu item deleted successfully
 *       404:
 *         description: Menu item not found
 *       500:
 *         description: Server error
 */
router.get('/:id', menuItemController.getMenuItemById);
router.post('/', checkJwt, menuItemController.createMenuItem);
router.put('/:id', checkJwt, menuItemController.updateMenuItem);
router.delete('/:id', checkJwt, menuItemController.deleteMenuItem);

module.exports = router;