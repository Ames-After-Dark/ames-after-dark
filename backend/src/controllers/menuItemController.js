const menuItemService = require('../services/menuItemService');

// GET /api/menuitems/:id
exports.getMenuItemById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const menuItem = await menuItemService.getMenuItemById(id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menuItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/menuitems
exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = await menuItemService.createMenuItem(req.body);
    res.status(201).json(menuItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/menuitems/:id
exports.updateMenuItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const menuItem = await menuItemService.updateMenuItem(id, req.body);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menuItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/menuitems/:id
exports.deleteMenuItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    await menuItemService.deleteMenuItem(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMenuItemsByLocationId = async (req, res) => {
  const locationId = req.params.locationId;
  try {
    const menuItems = await menuItemService.getMenuItemsByLocationId(locationId);
    res.json(menuItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};