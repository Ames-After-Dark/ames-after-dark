const mockPrisma = {
  locations: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const locationService = require('../locationService');

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getLocations returns list from prisma', async () => {
    const sample = [{ id: 1, name: 'Loc A' }];
    mockPrisma.locations.findMany.mockResolvedValue(sample);

    const res = await locationService.getLocations();
    expect(mockPrisma.locations.findMany).toHaveBeenCalled();
    expect(res).toBe(sample);
  });

  test('getLocationById returns single location', async () => {
    const sample = { id: 2, name: 'Loc B' };
    mockPrisma.locations.findUnique.mockResolvedValue(sample);

    const res = await locationService.getLocationById(2);
    expect(mockPrisma.locations.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } })
    );
    expect(res).toBe(sample);
  });
});
