const dealService = require('../services/dealService');

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
    const deal = await dealService.createDeal(req.body);
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
    const deal = await dealService.updateDeal(id, req.body);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
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