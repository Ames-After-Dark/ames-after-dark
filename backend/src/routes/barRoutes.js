// src/routes/barRoutes.js
const express = require('express');
const router = express.Router();
const barController = require('../controllers/barController');

// GET /api/bars
router.get('/', barController.getBars);

module.exports = router;
