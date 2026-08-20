const mockPrisma = {
  deals: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  deal_occurrences: {
    findMany: jest.fn(),
    createMany: jest.fn(),
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

  test('createDeal creates occurrences when provided', async () => {
    const created = { id: 1 };
    mockPrisma.deals.create.mockResolvedValue(created);

    const dealData = {
      name: 'Happy Hour',
      location_id: '3',
      occurrences: [
        { start_time_utc: '2026-01-01T00:00:00.000Z', end_time_utc: '2026-01-01T01:00:00.000Z' },
      ],
    };

    const res = await dealService.createDeal(dealData);

    const callArgs = mockPrisma.deals.create.mock.calls[0][0];
    expect(callArgs.data.location_id).toBe(3);
    expect(callArgs.data.deal_occurrences).toEqual({
      create: [
        {
          start_time_utc: new Date('2026-01-01T00:00:00.000Z'),
          end_time_utc: new Date('2026-01-01T01:00:00.000Z'),
        },
      ],
    });
    expect(res).toBe(created);
  });

  test('createDeal does not include deal_occurrences when occurrences empty', async () => {
    mockPrisma.deals.create.mockResolvedValue({ id: 2 });

    await dealService.createDeal({ name: 'No Occ', location_id: 1, occurrences: [] });

    const callArgs = mockPrisma.deals.create.mock.calls[0][0];
    expect(callArgs.data.deal_occurrences).toBeUndefined();
  });

  test('updateDeal replaces occurrences when provided', async () => {
    mockPrisma.deals.update.mockResolvedValue({ id: 5 });

    await dealService.updateDeal('5', {
      name: 'Updated',
      location_id: '2',
      occurrences: [
        { start_time_utc: '2026-02-01T00:00:00.000Z', end_time_utc: '2026-02-01T01:00:00.000Z' },
      ],
    });

    const callArgs = mockPrisma.deals.update.mock.calls[0][0];
    expect(callArgs.where).toEqual({ id: 5 });
    expect(callArgs.data.location_id).toBe(2);
    expect(callArgs.data.deal_occurrences).toEqual({
      deleteMany: {},
      create: [
        {
          start_time_utc: new Date('2026-02-01T00:00:00.000Z'),
          end_time_utc: new Date('2026-02-01T01:00:00.000Z'),
        },
      ],
    });
  });

  test('deleteDeal deletes by numeric id', async () => {
    mockPrisma.deals.delete.mockResolvedValue({ id: 9 });

    const res = await dealService.deleteDeal('9');

    expect(mockPrisma.deals.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(res).toEqual({ id: 9 });
  });

  test('getActiveDeals queries occurrences with now window', async () => {
    const sample = [{ id: 1, deals: { id: 1 } }];
    mockPrisma.deal_occurrences.findMany.mockResolvedValue(sample);

    const res = await dealService.getActiveDeals();

    expect(mockPrisma.deal_occurrences.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          start_time_utc: expect.any(Object),
          end_time_utc: expect.any(Object),
        },
        include: expect.any(Object),
      })
    );
    expect(res).toBe(sample);
  });

  test('getDealsByLocationId filters by numeric location id', async () => {
    const sample = [{ id: 1, location_id: 4 }];
    mockPrisma.deals.findMany.mockResolvedValue(sample);

    const res = await dealService.getDealsByLocationId('4');

    expect(mockPrisma.deals.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { location_id: 4 } })
    );
    expect(res).toBe(sample);
  });

  test('createRecurringDeal creates deal template and occurrences for matching weekdays', async () => {
    mockPrisma.deals.create.mockResolvedValue({ id: 123 });
    mockPrisma.deal_occurrences.createMany.mockResolvedValue({ count: 1 });

    const res = await dealService.createRecurringDeal({
      name: 'Recurring',
      location_id: '10',
      start_time: '18:00:00',
      end_time: '19:00:00',
      start_date: '2026-01-05T00:00:00.000Z', // Monday
      end_date: '2026-01-05T00:00:00.000Z',
      weekdays: [2], // Monday mapped (Mon=2)
    });

    expect(mockPrisma.deals.create).toHaveBeenCalledWith({
      data: { name: 'Recurring', location_id: 10 },
    });
    expect(mockPrisma.deal_occurrences.createMany).toHaveBeenCalledWith({
      data: expect.any(Array),
    });
    expect(res.deal).toEqual({ id: 123 });
    expect(res.occurrences).toHaveLength(1);
    expect(res.occurrences[0].deal_id).toBe(123);
  });

  test('searchDeals with id only returns array with deal or empty', async () => {
    mockPrisma.deals.findUnique.mockResolvedValue({ id: 55, deal_occurrences: [] });
    const res = await dealService.searchDeals({ id: '55' });
    expect(res).toHaveLength(1);

    mockPrisma.deals.findUnique.mockResolvedValue(null);
    const res2 = await dealService.searchDeals({ id: '999' });
    expect(res2).toEqual([]);
  });

  test('searchDeals with date filters de-dupes deals and groups occurrences', async () => {
    const occurrences = [
      {
        id: 1,
        deal_id: 10,
        start_time_utc: new Date('2026-03-01T00:00:00.000Z'),
        end_time_utc: new Date('2026-03-01T01:00:00.000Z'),
        deals: { id: 10, location_id: 2, name: 'D', locations: {} },
      },
      {
        id: 2,
        deal_id: 10,
        start_time_utc: new Date('2026-03-02T00:00:00.000Z'),
        end_time_utc: new Date('2026-03-02T01:00:00.000Z'),
        deals: { id: 10, location_id: 2, name: 'D', locations: {} },
      },
    ];
    mockPrisma.deal_occurrences.findMany.mockResolvedValue(occurrences);

    const res = await dealService.searchDeals({ startDateTime: '2026-03-01T00:00:00.000Z' });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe(10);
    expect(res[0].deal_occurrences).toHaveLength(2);
  });

  test('searchDeals with date filters and locationId filters occurrences', async () => {
    mockPrisma.deal_occurrences.findMany.mockResolvedValue([
      { id: 1, deal_id: 10, start_time_utc: new Date(), end_time_utc: new Date(), deals: { id: 10, location_id: 2 } },
      { id: 2, deal_id: 11, start_time_utc: new Date(), end_time_utc: new Date(), deals: { id: 11, location_id: 3 } },
    ]);

    const res = await dealService.searchDeals({
      startDateTime: '2026-03-01T00:00:00.000Z',
      locationId: '3',
    });

    expect(res).toHaveLength(1);
    expect(res[0].id).toBe(11);
  });
});
