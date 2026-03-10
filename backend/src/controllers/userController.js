
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
    // Note: express-oauth2-jwt-bearer puts claims in req.auth.payload
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

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
    const hasUsername = user.username !== null && user.username !== undefined;
    const profileComplete = hasPhoneNumber && hasBirthday && hasUsername;

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
        hasBirthday: hasBirthday,
        hasUsername: hasUsername
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
 * Complete user registration with phone number, birthday, and username
 * Requires Auth0 JWT authentication
 * Body: { phoneNumber: string, birthday: string (YYYY-MM-DD), username: string }
 */
exports.completeUserRegistration = async (req, res) => {
  try {
    // Get Auth0 user ID from the JWT token (guaranteed by middleware)
    // Note: express-oauth2-jwt-bearer puts claims in req.auth.payload
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { phoneNumber, birthday, username } = req.body || {};

    // Validate required fields
    if (!phoneNumber || !birthday || !username) {
      return res.status(400).json({
        message: 'Phone number, birthday, and username are required',
        errors: {
          phoneNumber: !phoneNumber ? 'Phone number is required' : undefined,
          birthday: !birthday ? 'Birthday is required' : undefined,
          username: !username ? 'Username is required' : undefined
        }
      });
    }

    // Validate phone number, birthday, and username format
    const validation = validationService.validateUserRegistrationData(phoneNumber, birthday, username);

    if (!validation.valid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if username is already taken
    const usernameAvailable = await userService.isUsernameAvailable(username);
    if (!usernameAvailable) {
      return res.status(409).json({
        message: 'Username already taken',
        errors: {
          username: 'This username is already taken'
        }
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
    // Note: express-oauth2-jwt-bearer puts claims in req.auth.payload
    const email = req.auth?.payload?.email || req.auth?.email || null;
    const name = req.auth?.payload?.name || req.auth?.name || null;

    // Create new user
    const newUser = await userService.createUserWithAuth0({
      auth0Id: auth0Id,
      phoneNumber: phoneNumber,
      birthday: birthday,
      username: username,
      email: email,
      name: name
    });

    return res.status(201).json({
      message: 'Registration completed successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
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

/**
 * GET /api/users/auth/check-username?username=xxx
 * Check if a username is available
 * Public endpoint - no authentication required
 * Query param: username
 */
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        message: 'Username is required',
        available: false
      });
    }

    // Validate username format
    const validation = validationService.validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({
        message: validation.error,
        available: false
      });
    }

    // Check if username is available
    const available = await userService.isUsernameAvailable(username);

    return res.json({
      available: available,
      username: username
    });

  } catch (err) {
    console.error('Error checking username availability:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * GET /api/users/auth/username
 * Get username for the authenticated user
 * Requires Auth0 JWT authentication
 */
exports.getUsernameByAuth = async (req, res) => {
  try {
    // Get Auth0 user ID from the JWT token
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get username by Auth0 ID
    const username = await userService.getUsernameByAuth0Id(auth0Id);

    // Return null if user hasn't set a username yet (during registration flow)
    return res.json({
      hasUsername: username !== null,
      username: username
    });

  } catch (err) {
    console.error('Error getting username:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * PUT /api/users/auth/username
 * Update username for the authenticated user
 * Requires Auth0 JWT authentication
 * Body: { username: string }
 */
exports.updateUsernameByAuth = async (req, res) => {
  try {
    // Get Auth0 user ID from the JWT token
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      });
    }

    // Validate username format
    const validation = validationService.validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({
        message: validation.error
      });
    }

    // Check if username is already taken
    const usernameAvailable = await userService.isUsernameAvailable(username);
    if (!usernameAvailable) {
      return res.status(409).json({
        message: 'Username already taken'
      });
    }

    // Get user by Auth0 ID
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Update username
    const updatedUser = await userService.updateUserLimited(user.id, { username });

    return res.json({
      message: 'Username updated successfully',
      username: updatedUser.username
    });

  } catch (err) {
    console.error('Error updating username:', err);

    // Handle unique constraint violations
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Username already taken'
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * GET /api/users/auth/profile
 * Get profile information for the authenticated user
 * Requires Auth0 JWT authentication
 * Returns user profile including bio, username, etc.
 */
exports.getUserProfileByAuth = async (req, res) => {
  try {
    // Get Auth0 user ID from the JWT token
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user by Auth0 ID
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      bio: user.bio,
      phoneNumber: user.phone_number,
      birthday: user.birthday,
      createdAt: user.created_at
    });

  } catch (err) {
    console.error('Error getting user profile:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * PUT /api/users/auth/bio
 * Update bio for the authenticated user
 * Requires Auth0 JWT authentication
 * Body: { bio: string }
 */
exports.updateBioByAuth = async (req, res) => {
  try {
    // Get Auth0 user ID from the JWT token
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { bio } = req.body;

    // Bio can be empty string or null (to clear it)
    if (bio === undefined) {
      return res.status(400).json({
        message: 'Bio field is required'
      });
    }

    // Validate bio length (max 150 characters)
    if (bio && bio.length > 150) {
      return res.status(400).json({
        message: 'Bio must be 150 characters or less'
      });
    }

    // Get user by Auth0 ID
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Update bio
    const updatedUser = await userService.updateUserLimited(user.id, { bio: bio || null });

    return res.json({
      message: 'Bio updated successfully',
      bio: updatedUser.bio
    });

  } catch (err) {
    console.error('Error updating bio:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /api/users/profile/favorite-drinks - get favorite drink options for user profile
exports.getUserProfileFavoriteDrinkOptions = async (req, res) => {
  try {
    const favoriteDrinks = await userService.getUserProfileFavoriteDrinkOptions();
    res.json(favoriteDrinks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/users/profile/photo-options - get photo options for user profile
exports.getUserProfilePhotoOptions = async (req, res) => {
  try {
    const photoOptions = await userService.getUserProfilePhotoOptions();
    res.json(photoOptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
