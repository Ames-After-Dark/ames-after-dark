require('dotenv').config();
const express = require("express");
const app = express();
const cors = require('cors');
const { Pool } = require('pg');
//To use checkJwt, simply insert it into your app.get()'s //Example: app.get('/status', checkJwt, async (req, res) => { const checkJwt = require('./src/middleware/authMiddleware')

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure CORS for your public domain TODO: add for security, commented our for dev
// const corsOptions = {
  // origin: [
    // 'http://localhost:3000',
    // 'http://localhost:8081',
    // 'http://10.0.2.2:3000',
    // 'http://sdmay26-42e.ece.iastate.edu',
    // 'http://sdmay26-42.ece.iastate.edu',
  // ],
  // credentials: true,
// };

// Middleware
app.use(express.json());

// Dev only
app.use(cors());

// Example API Endpoint: Check database connection
app.get('/status', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.status(200).send({
      message: 'Ames After Dark API is running!',
      databaseTime: result.rows[0].now
    });
  } catch (err) {
    console.error('Database connection error:', err.stack);
    res.status(500).send({
      message: 'API is running, but database connection failed.',
      error: err.message
    });
  }
});

const locationRoutes = require('./src/routes/locationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const userSettingRoutes = require('./src/routes/userSettingRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const dealRoutes = require('./src/routes/dealRoutes');

app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/usersettings', userSettingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/deals', dealRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Start server and bind to all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});
