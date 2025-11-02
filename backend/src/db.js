const { Pool } = require('pg');

const pool = new Pool({
  user: 'amesdb_admin',
  host: 'localhost', // because of SSH tunnel
  database: 'amesdb',
  password: 'l1quorSTORE_$$',
  port: 5432,
  options: '-c search_path=app',
});

module.exports = { pool };
