const express = require("express");
const app = express();
const cors = require('cors');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: 'amesdb_admin',
  host: 'localhost', // Since it's on the same server
  database: 'amesdb',
  password: 'l1quorSTORE_$$',
  port: 5432,
});

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

const barRoutes = require('./src/routes/barRoutes');

app.use('/api/bars', barRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
