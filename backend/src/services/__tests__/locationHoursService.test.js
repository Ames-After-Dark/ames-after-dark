const mockTx = {
    location_hours: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
    },
};

const mockPrisma = {
    locations: {
        findUnique: jest.fn(),
    },
    location_hours_overrides: {
        create: jest.fn(),
        delete: jest.fn(),
    },
    $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const locationHoursService = require('../locationHoursService');

describe('locationHoursService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getHoursByLocationId selects hours and future overrides ordered', async () => {
        const sample = { id: 1, name: 'Loc' };
        mockPrisma.locations.findUnique.mockResolvedValue(sample);

        const res = await locationHoursService.getHoursByLocationId(1);

        expect(mockPrisma.locations.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            select: expect.objectContaining({
                id: true,
                name: true,
                timezone: true,
                location_hours: { orderBy: { weekday_id: 'asc' } },
                location_hours_overrides: expect.objectContaining({
                    where: { end_time_utc: { gte: expect.any(Date) } },
                    orderBy: { start_time_utc: 'asc' },
                }),
            }),
        });
        expect(res).toBe(sample);
    });

    test('updateWeeklyHours deletes existing and creates many in a transaction', async () => {
        mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockTx));
        mockTx.location_hours.deleteMany.mockResolvedValue({ count: 2 });
        mockTx.location_hours.createMany.mockResolvedValue({ count: 3 });

        const hours = [
            { weekday_id: 2, open_time: '10:00', close_time: '18:00' },
            { weekday_id: 3, open_time: '10:00', close_time: '18:00' },
        ];

        const res = await locationHoursService.updateWeeklyHours(5, hours);

        expect(mockTx.location_hours.deleteMany).toHaveBeenCalledWith({ where: { location_id: 5 } });
        expect(mockTx.location_hours.createMany).toHaveBeenCalledWith({
            data: [
                { location_id: 5, weekday_id: 2, open_time: '10:00', close_time: '18:00' },
                { location_id: 5, weekday_id: 3, open_time: '10:00', close_time: '18:00' },
            ],
        });
        expect(res).toEqual({ count: 3 });
    });

    test('createOverride converts start/end into Date objects', async () => {
        mockPrisma.location_hours_overrides.create.mockResolvedValue({ id: 1 });

        await locationHoursService.createOverride(9, {
            start_time_utc: '2026-01-01T00:00:00.000Z',
            end_time_utc: '2026-01-01T02:00:00.000Z',
            is_open: false,
            reason: 'Holiday',
        });

        const callArgs = mockPrisma.location_hours_overrides.create.mock.calls[0][0];
        expect(callArgs.data.location_id).toBe(9);
        expect(callArgs.data.start_time_utc).toBeInstanceOf(Date);
        expect(callArgs.data.end_time_utc).toBeInstanceOf(Date);
        expect(callArgs.data.is_open).toBe(false);
        expect(callArgs.data.reason).toBe('Holiday');
    });

    test('deleteOverride deletes by id', async () => {
        mockPrisma.location_hours_overrides.delete.mockResolvedValue({ id: 5 });

        const res = await locationHoursService.deleteOverride(5);

        expect(mockPrisma.location_hours_overrides.delete).toHaveBeenCalledWith({ where: { id: 5 } });
        expect(res).toEqual({ id: 5 });
    });
});
