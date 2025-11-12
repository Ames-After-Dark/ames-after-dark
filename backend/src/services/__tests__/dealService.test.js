const mockPrisma = {
  deals: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Require the service after mocking Prisma
const dealService = require('../dealService');

describe('dealService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDeals returns list from prisma', async () => {
    const sample = [{ id: 1, name: 'Deal A' }];
    mockPrisma.deals.findMany.mockResolvedValue(sample);

    const res = await dealService.getDeals();
    expect(mockPrisma.deals.findMany).toHaveBeenCalled();
    expect(res).toBe(sample);
  });

  test('getDealById returns single deal', async () => {
    const sample = { id: 2, name: 'Deal B' };
    mockPrisma.deals.findUnique.mockResolvedValue(sample);

    const res = await dealService.getDealById(2);
    expect(mockPrisma.deals.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } })
    );
    expect(res).toBe(sample);
  });
});
