const userService = require('../services/userService');

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Function to adjust user's metadata in auth0 so redirects work properly on frontend
async function updateAuth0UserMetadata(auth0Id, metadata) {
  const axios = require('axios');

  // Get Auth0 Management API token
  const tokenResponse = await axios.post(
    `${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    }
  );

  const accessToken = tokenResponse.data.access_token;

  // Update user's app_metadata
  await axios.patch(
    `${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,
    {
      app_metadata: metadata
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

//Will need to add phone #, birthday, email, auth0 token/id, at least. 
// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { auth0Id, email, phoneNumber, birthday } = req.body;

    // Validate required fields
    if (!auth0Id || !email) {
      return res.status(400).json({
        message: 'Missing required fields: auth0Id and email are required'
      });
    }

    // Validate phone number format
    if (phoneNumber && !/^\+?[\d\s\-()]+$/.test(phoneNumber)) {
      return res.status(400).json({
        message: 'Invalid phone number format'
      });
    }

    // Validate birthday format (YYYY-MM-DD)
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return res.status(400).json({
        message: 'Invalid birthday format. Use YYYY-MM-DD'
      });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByAuth0Id(auth0Id);
    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists',
        user: existingUser
      });
    }

    // Create user
    const userData = {
      auth0Id,
      email,
      phoneNumber: phoneNumber || null,
      birthday: birthday || null
    };

    const newUser = await userService.createUser(userData);

    // Update Auth0 to mark user as synced
    try {
      await updateAuth0UserMetadata(auth0Id, { backend_synced: true });
    } catch (auth0Error) {
      console.error('Failed to update Auth0 metadata:', auth0Error);
      // Don't fail the request if Auth0 update fails
    }

    res.status(201).json(newUser);

  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/users/:id
exports.updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const { phoneNumber, birthday } = req.body;

    // Validate phone number if provided
    if (phoneNumber && !/^\+?[\d\s\-()]+$/.test(phoneNumber)) {
      return res.status(400).json({
        message: 'Invalid phone number format'
      });
    }

    // Validate birthday if provided
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return res.status(400).json({
        message: 'Invalid birthday format. Use YYYY-MM-DD'
      });
    }

    const updatedUser = await userService.updateUser(id, { phoneNumber, birthday });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


