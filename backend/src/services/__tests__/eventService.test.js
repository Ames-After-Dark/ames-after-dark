const mockPrisma = {
  events: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  event_occurrences: {
    findMany: jest.fn(),
    createMany: jest.fn(),
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

  test('createEvent creates occurrences when provided', async () => {
    mockPrisma.events.create.mockResolvedValue({ id: 1 });

    await eventService.createEvent({
      name: 'Trivia',
      location_id: '2',
      occurrences: [
        { start_time_utc: '2026-01-01T00:00:00.000Z', end_time_utc: '2026-01-01T01:00:00.000Z' },
      ],
    });

    const callArgs = mockPrisma.events.create.mock.calls[0][0];
    expect(callArgs.data.location_id).toBe(2);
    expect(callArgs.data.event_occurrences).toEqual({
      create: [
        {
          start_time_utc: new Date('2026-01-01T00:00:00.000Z'),
          end_time_utc: new Date('2026-01-01T01:00:00.000Z'),
        },
      ],
    });
  });

  test('updateEvent replaces occurrences when provided', async () => {
    mockPrisma.events.update.mockResolvedValue({ id: 2 });

    await eventService.updateEvent('2', {
      name: 'Updated',
      location_id: '9',
      occurrences: [
        { start_time_utc: '2026-02-01T00:00:00.000Z', end_time_utc: '2026-02-01T01:00:00.000Z' },
      ],
    });

    const callArgs = mockPrisma.events.update.mock.calls[0][0];
    expect(callArgs.where).toEqual({ id: 2 });
    expect(callArgs.data.location_id).toBe(9);
    expect(callArgs.data.event_occurrences).toEqual({
      deleteMany: {},
      create: [
        {
          start_time_utc: new Date('2026-02-01T00:00:00.000Z'),
          end_time_utc: new Date('2026-02-01T01:00:00.000Z'),
        },
      ],
    });
  });

  test('deleteEvent deletes by numeric id', async () => {
    mockPrisma.events.delete.mockResolvedValue({ id: 9 });

    const res = await eventService.deleteEvent('9');

    expect(mockPrisma.events.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(res).toEqual({ id: 9 });
  });

  test('getActiveEvents queries occurrences with now window', async () => {
    mockPrisma.event_occurrences.findMany.mockResolvedValue([{ id: 1 }]);

    await eventService.getActiveEvents();

    expect(mockPrisma.event_occurrences.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          start_time_utc: expect.any(Object),
          end_time_utc: expect.any(Object),
        },
      })
    );
  });

  test('getEventsByLocationId filters by numeric location id and excludes fully expired events by default', async () => {
    mockPrisma.events.findMany.mockResolvedValue([{ id: 1 }]);

    await eventService.getEventsByLocationId('4');

    expect(mockPrisma.events.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          location_id: 4,
          event_occurrences: { some: { end_time_utc: expect.any(Object) } },
        }),
      })
    );
  });

  test('getEventsByLocationId includes expired events when includeHistory is true', async () => {
    mockPrisma.events.findMany.mockResolvedValue([{ id: 1 }]);

    await eventService.getEventsByLocationId('4', true);

    expect(mockPrisma.events.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { location_id: 4 } })
    );
  });

  test('createRecurringEvent creates event template and occurrences for matching weekdays', async () => {
    mockPrisma.events.create.mockResolvedValue({ id: 777 });
    mockPrisma.event_occurrences.createMany.mockResolvedValue({ count: 1 });

    const res = await eventService.createRecurringEvent({
      name: 'Recurring',
      location_id: '10',
      start_time: '18:00:00',
      end_time: '19:00:00',
      start_date: '2026-01-05T00:00:00.000Z', // Monday
      end_date: '2026-01-05T00:00:00.000Z',
      weekdays: [2],
    });

    expect(mockPrisma.events.create).toHaveBeenCalledWith({
      data: { name: 'Recurring', location_id: 10 },
    });
    expect(mockPrisma.event_occurrences.createMany).toHaveBeenCalledWith({
      data: expect.any(Array),
    });
    expect(res.event).toEqual({ id: 777 });
    expect(res.occurrences).toHaveLength(1);
  });

  test('searchEvents with id only returns array with event or empty', async () => {
    mockPrisma.events.findUnique.mockResolvedValue({ id: 55, event_occurrences: [] });
    const res = await eventService.searchEvents({ id: '55' });
    expect(res).toHaveLength(1);

    mockPrisma.events.findUnique.mockResolvedValue(null);
    const res2 = await eventService.searchEvents({ id: '999' });
    expect(res2).toEqual([]);
  });

  test('searchEvents with date filters de-dupes events and groups occurrences', async () => {
    mockPrisma.event_occurrences.findMany.mockResolvedValue([
      {
        id: 1,
        event_id: 10,
        start_time_utc: new Date('2026-03-01T00:00:00.000Z'),
        end_time_utc: new Date('2026-03-01T01:00:00.000Z'),
        events: { id: 10, location_id: 2, name: 'E', locations: {} },
      },
      {
        id: 2,
        event_id: 10,
        start_time_utc: new Date('2026-03-02T00:00:00.000Z'),
        end_time_utc: new Date('2026-03-02T01:00:00.000Z'),
        events: { id: 10, location_id: 2, name: 'E', locations: {} },
      },
    ]);

    const res = await eventService.searchEvents({ startDateTime: '2026-03-01T00:00:00.000Z' });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe(10);
    expect(res[0].event_occurrences).toHaveLength(2);
  });

  test('searchEvents with date filters and locationId filters occurrences', async () => {
    mockPrisma.event_occurrences.findMany.mockResolvedValue([
      { id: 1, event_id: 10, start_time_utc: new Date(), end_time_utc: new Date(), events: { id: 10, location_id: 2 } },
      { id: 2, event_id: 11, start_time_utc: new Date(), end_time_utc: new Date(), events: { id: 11, location_id: 3 } },
    ]);

    const res = await eventService.searchEvents({
      startDateTime: '2026-03-01T00:00:00.000Z',
      locationId: '3',
    });

    expect(res).toHaveLength(1);
    expect(res[0].id).toBe(11);
  });
});
