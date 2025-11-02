const barService = require('../services/barService');

// GET /api/bars
exports.getBars = async (req, res) => {
  try {
    const bars = await barService.getBars();
    res.json(bars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/bars/:id
exports.getBarById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const bar = await barService.getBarById(id);
    if (!bar) return res.status(404).json({ message: 'Bar not found' });
    res.json(bar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/bars
exports.createBar = async (req, res) => {
  try {
    const newBar = await barService.createBar(req.body);
    res.status(201).json(newBar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/bars/:id
exports.updateBar = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const updatedBar = await barService.updateBar(id, req.body);
    if (!updatedBar) return res.status(404).json({ message: 'Bar not found' });
    res.json(updatedBar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/bars/:id
exports.deleteBar = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const deletedBar = await barService.deleteBar(id);
    if (!deletedBar) return res.status(404).json({ message: 'Bar not found' });
    res.json(deletedBar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
