
const userService = require('../services/userService');
const validationService = require('../services/validationService');

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


/**
 * GET /api/users/auth/status
 * Check if authenticated user exists in DB and has completed registration  
 * Uses optionalJwt middleware - validates token if present, allows through if not
 * Returns registration status and whether user needs to complete profile
 */
exports.checkUserStatus = async (req, res) => {
  try {
    // Get Auth0 user ID from JWT token (populated by optionalJwt middleware)
    // Will be undefined if no token or invalid token
    const auth0Id = req.auth?.sub;
    
    if (!auth0Id) {
      // No token or invalid token - user is not authenticated
      return res.json({
        registered: false,
        profileComplete: false,
        requiresRegistration: true
      });
    }

    // Check if user exists in database
    const user = await userService.getUserByAuth0Id(auth0Id);
    
    if (!user) {
      // User doesn't exist in DB yet
      return res.json({
        registered: false,
        profileComplete: false,
        requiresRegistration: true
      });
    }

    // User exists - check if they have completed profile (phone number and birthday)
    const hasPhoneNumber = user.phone_number !== null && user.phone_number !== undefined;
    const hasBirthday = user.birthday !== null && user.birthday !== undefined;
    const profileComplete = hasPhoneNumber && hasBirthday;

    return res.json({
      registered: true,
      profileComplete: profileComplete,
      requiresRegistration: !profileComplete,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPhoneNumber: hasPhoneNumber,
        hasBirthday: hasBirthday
      }
    });

  } catch (err) {
    console.error('Error checking user status:', err);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * POST /api/users/auth/register
 * Complete user registration with phone number and birthday
 * Requires Auth0 JWT authentication
 * Body: { phoneNumber: string, birthday: string (YYYY-MM-DD) }
 */
exports.completeUserRegistration = async (req, res) => {
  try {
    // DEBUG: Log what we received
    console.log('== REGISTRATION DEBUG ==');
    console.log('Headers:', req.headers.authorization ? 'Bearer token present' : 'NO TOKEN');
    console.log('req.auth:', req.auth);
    console.log('req.auth?.sub:', req.auth?.sub);
    
    // Get Auth0 user ID from the JWT token (guaranteed by middleware)
    const auth0Id = req.auth?.sub;
    
    if (!auth0Id) {
      console.log('Returning 401 - no auth0Id found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { phoneNumber, birthday } = req.body;

    // Validate required fields
    if (!phoneNumber || !birthday) {
      return res.status(400).json({
        message: 'Phone number and birthday are required',
        errors: {
          phoneNumber: !phoneNumber ? 'Phone number is required' : undefined,
          birthday: !birthday ? 'Birthday is required' : undefined
        }
      });
    }

    // Validate phone number and birthday
    const validation = validationService.validateUserRegistrationData(phoneNumber, birthday);
    
    if (!validation.valid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByAuth0Id(auth0Id);
    
    if (existingUser) {
      return res.status(409).json({
        message: 'User already registered',
        userId: existingUser.id
      });
    }

    // Get additional user info from JWT token if available
    const email = req.auth?.email || null;
    const name = req.auth?.name || null;

    // Create new user
    const newUser = await userService.createUserWithAuth0({
      auth0Id: auth0Id,
      phoneNumber: phoneNumber,
      birthday: birthday,
      email: email,
      name: name
    });

    return res.status(201).json({
      message: 'Registration completed successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phoneNumber: newUser.phone_number,
        birthday: newUser.birthday
      }
    });

  } catch (err) {
    console.error('Error completing user registration:', err);
    
    // Handle unique constraint violations (e.g., duplicate email)
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'User with this information already exists',
        field: err.meta?.target
      });
    }
    
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
