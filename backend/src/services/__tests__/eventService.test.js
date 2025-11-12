const mockPrisma = {
  events: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const eventService = require('../eventService');

describe('eventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getEvents returns list from prisma', async () => {
    const sample = [{ id: 1, title: 'Event A' }];
    mockPrisma.events.findMany.mockResolvedValue(sample);

    const res = await eventService.getEvents();
    expect(mockPrisma.events.findMany).toHaveBeenCalled();
    expect(res).toBe(sample);
  });

  test('getEventById returns single event', async () => {
    const sample = { id: 2, title: 'Event B' };
    mockPrisma.events.findUnique.mockResolvedValue(sample);

    const res = await eventService.getEventById(2);
    expect(mockPrisma.events.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } })
    );
    expect(res).toBe(sample);
  });
});
