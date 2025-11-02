const { pool } = require('../db');

// Get all bars
exports.getBars = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM bars ORDER BY id');
    return result.rows;
  } finally {
    client.release();
  }
};

// Get bar by ID
exports.getBarById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM bars WHERE id = $1', [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

// Create a new bar
exports.createBar = async (bar) => {
  const client = await pool.connect();
  const query = `
    INSERT INTO bars (name, address, latitude, longitude, description, open, tags, views, nickname)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;
  const values = [
    bar.name,
    bar.address || null,
    bar.latitude || null,
    bar.longitude || null,
    bar.description || null,
    bar.open ?? null,
    bar.tags || null,
    bar.views ?? 0,
    bar.nickname || null
  ];

  try {
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
};

// Update a bar by ID
exports.updateBar = async (id, bar) => {
  const client = await pool.connect();
  const query = `
    UPDATE bars SET
      name=$1,
      address=$2,
      latitude=$3,
      longitude=$4,
      description=$5,
      open=$6,
      tags=$7,
      views=$8,
      nickname=$9
    WHERE id=$10
    RETURNING *
  `;
  const values = [
    bar.name,
    bar.address || null,
    bar.latitude || null,
    bar.longitude || null,
    bar.description || null,
    bar.open ?? null,
    bar.tags || null,
    bar.views ?? 0,
    bar.nickname || null,
    id
  ];

  try {
    const result = await client.query(query, values);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

// Delete a bar by ID
exports.deleteBar = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM bars WHERE id=$1 RETURNING *', [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};
