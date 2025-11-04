const { pool } = require('../db');

// Get all locations
exports.getLocations = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM locations ORDER BY id');
    return result.rows;
  } finally {
    client.release();
  }
};

// Get location by ID
exports.getLocationById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM locations WHERE id = $1', [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

// Create a new location
exports.createLocation = async (location) => {
  const client = await pool.connect();
  const query = `
    INSERT INTO locations (name, address, latitude, longitude, description, open, tags, views, nickname)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;
  const values = [
    location.name,
    location.address || null,
    location.latitude || null,
    location.longitude || null,
    location.description || null,
    location.open ?? null,
    location.tags || null,
    location.views ?? 0,
    location.nickname || null
  ];

  try {
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
};

// Update a location by ID
exports.updateLocation = async (id, location) => {
  const client = await pool.connect();
  const query = `
    UPDATE locations SET
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
    location.name,
    location.address || null,
    location.latitude || null,
    location.longitude || null,
    location.description || null,
    location.open ?? null,
    location.tags || null,
    location.views ?? 0,
    location.nickname || null,
    id
  ];

  try {
    const result = await client.query(query, values);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

// Delete a location by ID
exports.deleteLocation = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM locations WHERE id=$1 RETURNING *', [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};
