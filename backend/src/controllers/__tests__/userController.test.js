jest.mock('../../services/userService', () => ({
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserByAuth0Id: jest.fn(),
  createUserWithAuth0: jest.fn(),
  getUserFriends: jest.fn(),
  isUsernameAvailable: jest.fn(),
  getUsernameByAuth0Id: jest.fn(),
  getUserRolesByAuth0Id: jest.fn(),
}));

jest.mock('../../services/validationService', () => ({
  validateUserRegistrationData: jest.fn(),
  validateUsername: jest.fn(),
}));

jest.mock('../../services/userSettingService');

const userController = require('../userController');
const userService = require('../../services/userService');
const userSettingService = require('../../services/userSettingService');
const validationService = require('../../services/validationService');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('userController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getUsers returns JSON list for developer', async () => {
    const sample = [{ id: 1 }];
    userService.getUsers.mockResolvedValue(sample);
    userService.getUserRolesByAuth0Id.mockResolvedValue({ roles: { name: 'developer' } });

    const req = { auth: { payload: { sub: 'auth0|dev1' } } };
    const res = createRes();
    await userController.getUsers(req, res);

    expect(userService.getUsers).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(sample);
  });

  test('getUsers returns 403 for non-developer', async () => {
    userService.getUserRolesByAuth0Id.mockResolvedValue({ roles: { name: 'user' } });

    const req = { auth: { payload: { sub: 'auth0|user1' } } };
    const res = createRes();
    await userController.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
  });

  test('getUserById handles invalid id with 400', async () => {
    const req = { params: { id: 'bad' } };
    const res = createRes();

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
  });

  test('getUserById returns 404 when not found', async () => {
    userService.getUserByAuth0Id.mockResolvedValue({ id: 3 });
    userService.getUserById.mockResolvedValue(null);
    const req = {
      params: { id: '3' },
      auth: { payload: { sub: 'auth0|test' } }
    };
    const res = createRes();

    await userController.getUserById(req, res);

    expect(userService.getUserById).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  describe('updateUserLimited', () => {
    test('updates user with valid fields', async () => {
      const updatedUser = { id: 1, username: 'newname', email: 'new@email.com', bio: 'new bio' };
      userService.updateUserLimited = jest.fn().mockResolvedValue(updatedUser);

      const req = {
        params: { id: '1' },
        body: { username: 'newname', email: 'new@email.com', bio: 'new bio' }
      };
      const res = createRes();

      await userController.updateUserLimited(req, res);

      expect(userService.updateUserLimited).toHaveBeenCalledWith(1, {
        username: 'newname',
        email: 'new@email.com',
        bio: 'new bio'
      });
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    test('returns 400 when no valid fields provided', async () => {
      const req = {
        params: { id: '1' },
        body: { invalidField: 'value' }
      };
      const res = createRes();

      await userController.updateUserLimited(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No valid fields to update' });
    });

    test('returns 400 for invalid id', async () => {
      const req = {
        params: { id: 'invalid' },
        body: { username: 'test' }
      };
      const res = createRes();

      await userController.updateUserLimited(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
    });
  });

  describe('getUserFriends', () => {
    test('returns friends list', async () => {
      const friends = [{ id: 2, username: 'friend1' }, { id: 3, username: 'friend2' }];
      userService.getUserFriends = jest.fn().mockResolvedValue(friends);

      const req = { params: { userId: '1' } };
      const res = createRes();

      await userController.getUserFriends(req, res);

      expect(userService.getUserFriends).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(friends);
    });

    test('handles service errors', async () => {
      userService.getUserFriends = jest.fn().mockRejectedValue(new Error('DB Error'));

      const req = { params: { userId: '1' } };
      const res = createRes();

      await userController.getUserFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});

describe('userController - Auth0 endpoints', () => {
  beforeEach(() => jest.clearAllMocks());

  const createRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.send = jest.fn(() => res);
    return res;
  };

  describe('checkUserStatus', () => {
    test('returns not registered when no auth0 ID in request', async () => {
      const req = { auth: {} };
      const res = createRes();

      await userController.checkUserStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        registered: false,
        profileComplete: false,
        requiresRegistration: true
      });
    });

    test('returns requiresRegistration when user not in DB', async () => {
      userService.getUserByAuth0Id.mockResolvedValue(null);

      const req = { auth: { sub: 'auth0|123456' } };
      const res = createRes();

      await userController.checkUserStatus(req, res);

      expect(userService.getUserByAuth0Id).toHaveBeenCalledWith('auth0|123456');
      expect(res.json).toHaveBeenCalledWith({
        registered: false,
        profileComplete: false,
        requiresRegistration: true
      });
    });

    test('returns profileComplete true when user has all data', async () => {
      const user = {
        id: 1,
        uid: 'auth0|123456',
        phone_number: '123-456-7890',
        birthday: new Date('2000-01-15'),
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      };
      userService.getUserByAuth0Id.mockResolvedValue(user);

      const req = { auth: { sub: 'auth0|123456' } };
      const res = createRes();

      await userController.checkUserStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        registered: true,
        profileComplete: true,
        requiresRegistration: false,
        userId: 1,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          hasPhoneNumber: true,
          hasBirthday: true,
          hasUsername: true,
          hasName: true
        }
      });
    });

    test('returns profileComplete false when missing phone number', async () => {
      const user = {
        id: 1,
        uid: 'auth0|123456',
        phone_number: null,
        birthday: new Date('2000-01-15'),
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      };
      userService.getUserByAuth0Id.mockResolvedValue(user);

      const req = { auth: { sub: 'auth0|123456' } };
      const res = createRes();

      await userController.checkUserStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        registered: true,
        profileComplete: false,
        requiresRegistration: true,
        userId: 1,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          hasPhoneNumber: false,
          hasBirthday: true,
          hasUsername: true,
          hasName: true
        }
      });
    });

    test('returns profileComplete false when missing birthday', async () => {
      const user = {
        id: 1,
        uid: 'auth0|123456',
        phone_number: '123-456-7890',
        birthday: null,
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      };
      userService.getUserByAuth0Id.mockResolvedValue(user);

      const req = { auth: { sub: 'auth0|123456' } };
      const res = createRes();

      await userController.checkUserStatus(req, res);

      const call = res.json.mock.calls[0][0];
      expect(call.profileComplete).toBe(false);
      expect(call.requiresRegistration).toBe(true);
      expect(call.user.hasBirthday).toBe(false);
    });

    test('handles service errors gracefully', async () => {
      userService.getUserByAuth0Id.mockRejectedValue(new Error('DB Error'));

      const req = { auth: { sub: 'auth0|123456' } };
      const res = createRes();

      await userController.checkUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Internal server error' })
      );
    });
  });

  describe('completeUserRegistration', () => {
    test('returns 401 when no auth0 ID', async () => {
      const req = { auth: {}, body: {} };
      const res = createRes();

      await userController.completeUserRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    test('returns 400 when missing phone number', async () => {
      const req = {
        auth: { sub: 'auth0|123456' },
        body: { birthday: '2000-01-15', username: 'testuser', name: 'Test' }
      };
      const res = createRes();

      userService.getUserByAuth0Id.mockResolvedValue(null);

      await userController.completeUserRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Phone number, birthday, username, and name are required',
        errors: {
          phoneNumber: 'Phone number is required',
          birthday: undefined,
          username: undefined,
          name: undefined
        }
      });
    });

    test('returns 400 when missing birthday', async () => {
      const req = {
        auth: { sub: 'auth0|123456' },
        body: { phoneNumber: '123-456-7890', username: 'testuser', name: 'Test' }
      };
      const res = createRes();

      userService.getUserByAuth0Id.mockResolvedValue(null);

      await userController.completeUserRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Phone number, birthday, username, and name are required',
        errors: {
          phoneNumber: undefined,
          birthday: 'Birthday is required',
          username: undefined,
          name: undefined
        }
      });
    });

    test('returns 400 when validation fails', async () => {
      validationService.validateUserRegistrationData.mockReturnValue({
        valid: false,
        errors: {
          phoneNumber: 'Phone number must be 10-11 digits',
          birthday: 'You must be at least 21 years old to register'
        }
      });

      userService.getUserByAuth0Id.mockResolvedValue(null);

      const req = {
        auth: { sub: 'auth0|123456' },
        body: { phoneNumber: '123', birthday: '2010-01-01', username: 'test', name: 'Test' }
      };
      const res = createRes();

      await userController.completeUserRegistration(req, res);

      expect(validationService.validateUserRegistrationData).toHaveBeenCalledWith('123', '2010-01-01', 'test', 'Test', false);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: {
          phoneNumber: 'Phone number must be 10-11 digits',
          birthday: 'You must be at least 21 years old to register'
        }
      });
    });

    test('returns 409 when user already exists', async () => {
      validationService.validateUserRegistrationData.mockReturnValue({
        valid: true,
        errors: null
      });
      userService.isUsernameAvailable.mockResolvedValue(true);
      const existingUser = {
        id: 1,
        uid: 'auth0|123456',
        phone_number: '123-456-7890',
        birthday: new Date('2000-01-15'),
        username: 'testuser',
        email: 'test@example.com'
      }
      userService.getUserByAuth0Id.mockResolvedValue(existingUser);

      userService.updateUser.mockResolvedValue({
        ...existingUser,
        name: 'Updated Name',
      });

      const req = {
        auth: { sub: 'auth0|123456' },
        body: { phoneNumber: '123-456-7890', birthday: '2000-01-15', username: 'testuser', name: 'Updated Name' }
      };
      const res = createRes();

      await userController.completeUserRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile completed successfully',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Updated Name',
          phoneNumber: '123-456-7890',
          birthday: existingUser.birthday,
          username: 'testuser'
        }
      });
    });

    test('successfully creates user with all data', async () => {
      validationService.validateUserRegistrationData.mockReturnValue({
        valid: true,
        errors: null
      });
      userService.isUsernameAvailable.mockResolvedValue(true);
      userService.getUserByAuth0Id.mockResolvedValue(null);

      const newUser = {
        id: 10,
        auth0_id: 'auth0|123456',
        username: 'testuser',
        phone_number: '123-456-7890',
        birthday: new Date('2000-01-15'),
        email: 'test@example.com',
        name: 'Test User'
      };
      userService.createUserWithAuth0.mockResolvedValue(newUser);
      userSettingService.createUserSettings.mockResolvedValue({});

      const req = {
        auth: {
          sub: 'auth0|123456',
          email: 'test@example.com',
          name: 'Test Token Name'
        },
        body: { phoneNumber: '123-456-7890', birthday: '2000-01-15', username: 'testuser', name: 'Test User' }
      };
      const res = createRes();

      await userController.completeUserRegistration(req, res);

      expect(userService.createUserWithAuth0).toHaveBeenCalledWith({
        auth0Id: 'auth0|123456',
        phoneNumber: '123-456-7890',
        birthday: '2000-01-15',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registration completed successfully',
        user: {
          id: 10,
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
          phoneNumber: '123-456-7890',
          birthday: newUser.birthday
        }
      });
    });

    test('successfully creates user with minimal data', async () => {
      validationService.validateUserRegistrationData.mockReturnValue({
        valid: true,
        errors: null
      });
      userService.isUsernameAvailable.mockResolvedValue(true);
      userService.getUserByAuth0Id.mockResolvedValue(null);

      const newUser = {
        id: 11,
        auth0_id: 'auth0|789012',
        email: null,
        phone_number: '555-123-4567',
        birthday: '1995-06-20',
        username: 'minimaluser',
        name: 'minimal'
      };
      userService.createUserWithAuth0.mockResolvedValue(newUser);
      userSettingService.createUserSettings.mockResolvedValue({});

      const req = {
        auth: { sub: 'auth0|789012' },
        body: { phoneNumber: '555-123-4567', birthday: '1995-06-20', username: 'minimaluser', name: 'minimal' }
      };
      const res = createRes();

      await userController.completeUserRegistration(req, res);

      expect(userService.createUserWithAuth0).toHaveBeenCalledWith({
        auth0Id: 'auth0|789012',
        phoneNumber: '555-123-4567',
        birthday: '1995-06-20',
        username: 'minimaluser',
        email: null,
        name: 'minimal'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('handles duplicate email error (P2002)', async () => {
      validationService.validateUserRegistrationData.mockReturnValue({
        valid: true,
        errors: null
      });
      validationService.validateUsername.mockReturnValue({
        valid: true,
        errors: null
      });
      userService.getUserByAuth0Id.mockResolvedValue(null);
      userService.isUsernameAvailable.mockResolvedValue(true);

      const duplicateError = new Error('Unique constraint failed');
      duplicateError.code = 'P2002';
      duplicateError.meta = { target: ['email'] };
      userService.createUserWithAuth0.mockRejectedValue(duplicateError);

      const req = {
        auth: { sub: 'auth0|123456', email: 'duplicate@example.com' },
        body: { phoneNumber: '123-456-7890', birthday: '2000-01-15', username: 'testuser', name: 'Test User' }
      };
      const res = createRes();

      await userController.completeUserRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User with this information already exists',
        field: ['email']
      });
    });

    test('handles general service errors', async () => {
      validationService.validateUserRegistrationData.mockReturnValue({
        valid: true,
        errors: null
      });
      userService.isUsernameAvailable.mockResolvedValue(true);
      userService.getUserByAuth0Id.mockResolvedValue(null);
      userService.createUserWithAuth0.mockRejectedValue(new Error('DB Connection Failed'));

      const req = {
        auth: { sub: 'auth0|123456' },
        body: { phoneNumber: '123-456-7890', birthday: '2000-01-15', username: 'testuser', name: 'Test User' }
      };
      const res = createRes();

      await userController.completeUserRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Internal server error' })
      );
    });
  });
});
