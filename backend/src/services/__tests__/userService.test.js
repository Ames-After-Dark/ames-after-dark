const mockPrisma = {
  users: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
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
});
