
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

exports.getUserFriends = async (req, res) => {
  const userId = req.params.userId;
  try {
    const friends = await userService.getUserFriends(userId);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/users/:id - update username, email, bio only
exports.updateUserLimited = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  // Only allow username, email, and bio
  const { username, email, bio } = req.body;
  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (bio !== undefined) updateData.bio = bio;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  try {
    const updatedUser = await userService.updateUserLimited(id, updateData);
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// TEMP_AUTH_START - Remove when re-enabling Auth0
// POST /api/users/signup
exports.createUser = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Check if user already exists
    const existingUser = await userService.loginUser(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    const user = await userService.createUser({ username });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/users/login
exports.loginUser = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    const user = await userService.loginUser(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// TEMP_AUTH_END
