const barService = require('../services/barService');

exports.getBars = (req, res) => {
  try {
    const bars = barService.getBars();
    res.json(bars);
  } catch (error) {
    console.error("Error getting bars:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
