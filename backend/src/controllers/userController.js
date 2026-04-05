const userService = require('../services/userService');
const validationService = require('../services/validationService');
const authService = require('../services/authService');

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
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const friends = await userService.getUserFriends(userId);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/users/:id - update username, email, bio only
exports.updateUserLimited = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const id = user.id;

    // Only allow username, email, and bio, favorite_drink_id , profile_photo_id, and favorite_profile_location_id to be updated through this endpoint
    const { username, email, bio, favorite_drink_id, profile_photo_id, favorite_profile_location_id } = req.body;
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (favorite_drink_id !== undefined) updateData.favorite_drink_id = favorite_drink_id;
    if (profile_photo_id !== undefined) updateData.profile_photo_id = profile_photo_id;
    if (favorite_profile_location_id !== undefined) updateData.favorite_profile_location_id = favorite_profile_location_id;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

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
    const hasName = user.name !== null && user.name !== undefined && user.name.trim() !== '';
    const profileComplete = hasPhoneNumber && hasBirthday && hasUsername && hasName;

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
        hasUsername: hasUsername,
        hasName: hasName
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

    const { phoneNumber, birthday, username, name } = req.body || {};

    // Load existing user right away
    const existingUser = await userService.getUserByAuth0Id(auth0Id);
    const isUpdating = existingUser !== null;

    // Validate required fields explicitly only if not updating
    if (!isUpdating && (!phoneNumber || !birthday || !username || !name)) {
      return res.status(400).json({
        message: 'Phone number, birthday, username, and name are required',
        errors: {
          phoneNumber: !phoneNumber ? 'Phone number is required' : undefined,
          birthday: !birthday ? 'Birthday is required' : undefined,
          username: !username ? 'Username is required' : undefined,
          name: !name ? 'Name is required' : undefined
        }
      });
    }

    // Pass the isUpdating flag. Fields not sent won't be validated.
    // Validate phone number, birthday, and username format
    const validation = validationService.validateUserRegistrationData(phoneNumber, birthday, username, name, isUpdating);

    if (!validation.valid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if username is already taken (only if they actually sent one)
    if (username) {
      const usernameAvailable = await userService.isUsernameAvailable(username);
      if (!usernameAvailable) {
        return res.status(409).json({
          message: 'Username already taken',
          errors: {
            username: 'This username is already taken'
          }
        });
      }
    }

    // Check if user already exists
    if (isUpdating) {
      // Rather than returning a 409 conflict, we want to allow existing users to update their missing profile fields
      // Ensure we don't try to change the Auth0 ID, and update only the missing pieces.

      // Update only the missing pieces sent by the frontend, fall back to DB data if they didn't send it.
      const fieldsToUpdate = {
        phone_number: phoneNumber || existingUser.phone_number,
        birthday: birthday ? new Date(birthday) : existingUser.birthday,
        username: username || existingUser.username,
        name: name || existingUser.name
      };

      const updatedUser = await userService.updateUser(existingUser.id, fieldsToUpdate);

      return res.status(200).json({
        message: 'Profile completed successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          username: updatedUser.username,
          phoneNumber: updatedUser.phone_number,
          birthday: updatedUser.birthday
        }
      });
    }

    // Get additional user info from JWT token if available
    // Note: express-oauth2-jwt-bearer puts claims in req.auth.payload
    const email = req.auth?.payload?.email || req.auth?.email || null;
    // We already have `name` from req.body now


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
 * GET /api/users/auth/roles
 * Get the roles and admin properties for the authenticated user
 * Requires Auth0 JWT authentication
 */
exports.getUserRolesByAuth = async (req, res) => {
  try {
    // Get Auth0 user ID from the JWT token
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const roleData = await userService.getUserRolesByAuth0Id(auth0Id);

    if (!roleData) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    return res.json(roleData);

  } catch (err) {
    console.error('Error getting user roles:', err);
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

// GET /api/users/profile/favorite-drinks/:id - get a specific favorite drink option for user profile
exports.getUserProfileFavoriteDrinkOptionsById = async (req, res) => {
  try {
    const { id } = req.params;
    const favoriteDrink = await userService.getUserProfileFavoriteDrinkOptionsById(id);
    if (!favoriteDrink) {
      return res.status(404).json({ message: 'Favorite drink not found' });
    }
    res.json(favoriteDrink);
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

// GET /api/users/profile/photo-options/:id - get a specific photo option for user profile
exports.getUserProfilePhotoOptionsById = async (req, res) => {
  try {
    const { id } = req.params;
    const photoOption = await userService.getUserProfilePhotoOptionsById(id);
    if (!photoOption) {
      return res.status(404).json({ message: 'Photo option not found' });
    }
    res.json(photoOption);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/users/auth/account
// Delete a user from both our DB and Auth0. Protected endpoint (requires Auth0 JWT)
exports.deleteAccount = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Authentication required' });

    // Delete from Auth0 first to immediately revoke access, then remove from our DB.
    // Both operations are treated idempotently where possible.
    try {
      await authService.deleteAuth0User(auth0Id);
    } catch (err) {
      // If Auth0 deletion fails, log and return 502 to indicate upstream failure
      console.error('Auth0 deletion failed:', err);
      return res.status(502).json({ message: 'Failed to delete user from Auth0' });
    }

    try {
      await userService.deleteUserByAuthID(auth0Id);
    } catch (err) {
      // Prisma will throw if record not found; treat as success for idempotency
      const isNotFound = err.code === 'P2025';
      if (!isNotFound) {
        console.error('DB deletion failed:', err);
        return res.status(500).json({ message: 'Failed to delete user from database' });
      }
    }

    // Successful deletion (or idempotent)
    return res.status(204).send();
  } catch (err) {
    console.error('Unexpected error deleting account:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * DELETE /api/users/auth/cancel-registration
 * Deletes an Auth0 account that hasn't finished registration in our DB yet
 * Requires valid JWT
 */
exports.cancelRegistration = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Unauthorized: No Auth0 ID in token' });
    }

    // Try deleting from Auth0
    try {
      await authService.deleteAuth0User(auth0Id);
      return res.status(200).json({ message: 'Registration cancelled successfully' });
    } catch (auth0Err) {
      console.error('Error deleting from Auth0:', auth0Err);
      return res.status(502).json({
        message: 'Failed to delete Auth0 account',
        error: auth0Err.message
      });
    }
  } catch (err) {
    console.error('Error cancelling registration:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = exports;