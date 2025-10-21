const express = require('express');
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'amesdb_admin',
  host: 'localhost', // Since it's on the same server
  database: 'amesdb',
  password: 'l1quorSTORE_$$',
  port: 5432,
});

const app = express();
const port = 3000;

app.use(express.json());

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

app.listen(port, () => {
  console.log(`Ames After Dark API listening at http://localhost:${port}`);
});
