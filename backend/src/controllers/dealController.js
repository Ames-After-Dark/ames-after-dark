const dealService = require('../services/dealService');
const userService = require('../services/userService');

// GET /api/deals
exports.getDeals = async (req, res) => {
  try {
    const deals = await dealService.getDeals();
    res.json(deals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/deals/:id
exports.getDealById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const deal = await dealService.getDealById(id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.json(deal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/deals
exports.createDeal = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { location_id } = req.body;
    if (!location_id) {
       return res.status(400).json({ error: "location_id is required" });
    }

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const { name, location_id: bodyLocationId, description, banner_id, occurrences } = req.body || {};
    const createData = {
      ...(name !== undefined ? { name } : {}),
      ...(bodyLocationId !== undefined ? { location_id: bodyLocationId } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(banner_id !== undefined ? { banner_id } : {}),
      ...(occurrences !== undefined ? { occurrences } : {}),
    };

    const deal = await dealService.createDeal(createData);
    res.status(201).json(deal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/deals/:id
exports.updateDeal = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // We need to fetch the existing deal to know its location_id if location_id isn't in req.body
    const existingDeal = await dealService.getDealById(id);
    if (!existingDeal) return res.status(404).json({ message: 'Deal not found' });
    
    const location_id = req.body.location_id || existingDeal.location_id;

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const { name, location_id: body_location_id, description, banner_id, occurrences } = req.body || {};
    const updateData = {
      ...(name !== undefined ? { name } : {}),
      ...(body_location_id !== undefined ? { location_id: body_location_id } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(banner_id !== undefined ? { banner_id } : {}),
      ...(occurrences !== undefined ? { occurrences } : {}),
    };

    const deal = await dealService.updateDeal(id, updateData);
    res.json(deal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/deals/:id
exports.deleteDeal = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingDeal = await dealService.getDealById(id);
    if (!existingDeal) return res.status(404).json({ message: 'Deal not found' });

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(existingDeal.location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    await dealService.deleteDeal(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getActiveDeals = async (req, res) => {
  try {
    const deals = await dealService.getActiveDeals();
    res.json(deals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getDealsByLocationId = async (req, res) => {
  const locationId = req.params.locationId;
  try {
    const deals = await dealService.getDealsByLocationId(locationId);
    res.json(deals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createRecurringDeal = async (req, res) => {
  try {
    const authId = req.auth?.payload?.sub;
    if (!authId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dealData = req.body;

    const userRoles = await userService.getUserRolesByAuth0Id(authId);
    if (!userRoles) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    const isDeveloper = userRoles.roles?.name?.toLowerCase() === 'developer';
    const isLocationAdmin = userRoles.location_admins?.some(la => la.location_id === Number(dealData.location_id));

    if (!isDeveloper && (!userRoles.isAdmin || !isLocationAdmin)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    // Validate required fields
    const requiredFields = ['name', 'location_id', 'start_time', 'end_time', 'start_date', 'end_date', 'weekdays'];
    for (const field of requiredFields) {
      if (!dealData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Call service to create deal + occurrences
    const result = await dealService.createRecurringDeal(dealData);

    return res.status(201).json({
      message: 'Recurring deal created successfully',
      deal: result.deal,
      occurrences: result.occurrences
    });

  } catch (error) {
    console.error('Error creating recurring deal:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};