const mockPrisma = {
  users: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  friendships: {
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const userService = require('../userService');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUsers returns list from prisma', async () => {
    const sample = [{ id: 1, username: 'alice' }];
    mockPrisma.users.findMany.mockResolvedValue(sample);

    const res = await userService.getUsers();
    expect(mockPrisma.users.findMany).toHaveBeenCalled();
    expect(res).toBe(sample);
  });

  test('getUserById returns single user', async () => {
    const sample = { id: 2, username: 'bob' };
    mockPrisma.users.findUnique.mockResolvedValue(sample);

    const res = await userService.getUserById(2);
    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } })
    );
    expect(res).toBe(sample);
  });

  describe('Auth0 methods', () => {
    test('getUserByAuth0Id returns user by uid', async () => {
      const auth0Id = 'auth0|123456789';
      const sample = { 
        id: 3, 
        uid: auth0Id, 
        username: 'charlie',
        roles: { id: 1, name: 'user' } 
      };
      mockPrisma.users.findUnique.mockResolvedValue(sample);

      const res = await userService.getUserByAuth0Id(auth0Id);
      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ 
          where: { uid: auth0Id },
          include: { roles: true }
        })
      );
      expect(res).toBe(sample);
    });

    test('getUserByAuth0Id returns null when user not found', async () => {
      const auth0Id = 'auth0|nonexistent';
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const res = await userService.getUserByAuth0Id(auth0Id);
      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { uid: auth0Id } })
      );
      expect(res).toBeNull();
    });

    test('createUserWithAuth0 creates user with all data', async () => {
      const userData = {
        auth0Id: 'auth0|123456789',
        phoneNumber: '123-456-7890',
        birthday: '2000-01-15',
        email: 'test@example.com',
        name: 'Test User'
      };

      const createdUser = {
        id: 10,
        uid: userData.auth0Id,
        phone_number: userData.phoneNumber,
        birthday: new Date(userData.birthday),
        email: userData.email,
        name: userData.name,
        role_id: null,
        roles: null
      };

      mockPrisma.users.create.mockResolvedValue(createdUser);

      const res = await userService.createUserWithAuth0(userData);
      
      expect(mockPrisma.users.create).toHaveBeenCalledWith({
        data: {
          uid: userData.auth0Id,
          phone_number: userData.phoneNumber,
          birthday: new Date(userData.birthday),
          email: userData.email,
          name: userData.name,
          role_id: null
        },
        include: { roles: true }
      });
      expect(res).toBe(createdUser);
    });

    test('createUserWithAuth0 creates user with minimal data', async () => {
      const userData = {
        auth0Id: 'auth0|987654321',
        phoneNumber: '555-123-4567',
        birthday: '1995-06-20'
      };

      const createdUser = {
        id: 11,
        uid: userData.auth0Id,
        phone_number: userData.phoneNumber,
        birthday: new Date(userData.birthday),
        email: null,
        name: null,
        role_id: null,
        roles: null
      };

      mockPrisma.users.create.mockResolvedValue(createdUser);

      const res = await userService.createUserWithAuth0(userData);
      
      expect(mockPrisma.users.create).toHaveBeenCalledWith({
        data: {
          uid: userData.auth0Id,
          phone_number: userData.phoneNumber,
          birthday: new Date(userData.birthday),
          email: null,
          name: null,
          role_id: null
        },
        include: { roles: true }
      });
      expect(res).toBe(createdUser);
    });

    test('createUserWithAuth0 converts birthday string to Date object', async () => {
      const userData = {
        auth0Id: 'auth0|date-test',
        phoneNumber: '555-999-8888',
        birthday: '1998-12-31'
      };

      mockPrisma.users.create.mockResolvedValue({ id: 12 });

      await userService.createUserWithAuth0(userData);
      
      const callArgs = mockPrisma.users.create.mock.calls[0][0];
      expect(callArgs.data.birthday).toBeInstanceOf(Date);
      expect(callArgs.data.birthday.toISOString()).toContain('1998-12-31');
    });
  });

  describe('getUserFriends', () => {
    test('returns friends when user is user_id_1', async () => {
      const userId = 1;
      const friendships = [
        {
          user_id_1: 1,
          user_id_2: 2,
          users_friendships_user_id_1Tousers: { id: 1, username: 'alice' },
          users_friendships_user_id_2Tousers: { id: 2, username: 'bob' }
        }
      ];

      mockPrisma.friendships.findMany.mockResolvedValue(friendships);

      const res = await userService.getUserFriends(userId);
      
      expect(mockPrisma.friendships.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { user_id_1: userId },
            { user_id_2: userId }
          ]
        },
        include: {
          users_friendships_user_id_1Tousers: true,
          users_friendships_user_id_2Tousers: true
        }
      });
      expect(res).toEqual([{ id: 2, username: 'bob' }]);
    });

    test('returns friends when user is user_id_2', async () => {
      const userId = 2;
      const friendships = [
        {
          user_id_1: 1,
          user_id_2: 2,
          users_friendships_user_id_1Tousers: { id: 1, username: 'alice' },
          users_friendships_user_id_2Tousers: { id: 2, username: 'bob' }
        }
      ];

      mockPrisma.friendships.findMany.mockResolvedValue(friendships);

      const res = await userService.getUserFriends(userId);
      expect(res).toEqual([{ id: 1, username: 'alice' }]);
    });

    test('returns empty array when no friends', async () => {
      mockPrisma.friendships.findMany.mockResolvedValue([]);

      const res = await userService.getUserFriends(999);
      expect(res).toEqual([]);
    });
  });
});
