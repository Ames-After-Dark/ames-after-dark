const menuItemService = require('../services/menuItemService');
const userService = require('../services/userService');

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
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { location_id } = req.body || {};
    if (!location_id) {
      return res.status(400).json({ error: 'location_id is required' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

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
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch existing item so we can authorize against its location when location_id isn't provided
    const existingMenuItem = await menuItemService.getMenuItemById(id);
    if (!existingMenuItem) return res.status(404).json({ message: 'Menu item not found' });

    const location_id = req.body?.location_id || existingMenuItem.location_id;
    if (!location_id) {
      return res.status(400).json({ error: 'location_id is required' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const menuItem = await menuItemService.updateMenuItem(id, req.body);
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
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingMenuItem = await menuItemService.getMenuItemById(id);
    if (!existingMenuItem) return res.status(404).json({ message: 'Menu item not found' });

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(existingMenuItem.location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

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

exports.getMenuItemTypes = async (req, res) => {
  try {
    const menuItemTypes = await menuItemService.getMenuItemTypes();
    res.json(menuItemTypes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createMenuItemType = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    const isDeveloper = userRoles?.roles?.name?.toLowerCase() === 'developer';
    if (!isDeveloper) {
      return res.status(403).json({ error: 'Forbidden: Only developers can create menu item types' });
    }

    const menuItemType = await menuItemService.createMenuItemType(req.body);
    res.status(201).json(menuItemType);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};