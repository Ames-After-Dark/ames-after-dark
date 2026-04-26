const mockPrisma = {
    banners: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const bannerService = require('../bannerService');

describe('bannerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getBannerById queries prisma with numeric id and includes deal/event ids', async () => {
        const sample = { id: 1 };
        mockPrisma.banners.findUnique.mockResolvedValue(sample);

        const res = await bannerService.getBannerById('1');

        expect(mockPrisma.banners.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            include: {
                deals: { select: { id: true } },
                events: { select: { id: true } },
            },
        });
        expect(res).toBe(sample);
    });

    test('getActiveBanners maps active event as EVENT target_type', async () => {
        mockPrisma.banners.findMany.mockResolvedValue([
            {
                id: 1,
                name: 'B1',
                image_url: 'http://x',
                events: [{ id: 99 }],
                deals: [{ id: 11 }],
            },
        ]);

        const res = await bannerService.getActiveBanners();

        expect(mockPrisma.banners.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ include: expect.any(Object) })
        );
        expect(res).toEqual([
            {
                id: 1,
                name: 'B1',
                image_url: 'http://x',
                target_type: 'EVENT',
                target_id: 99,
            },
        ]);
    });

    test('getActiveBanners maps active deal as DEAL when no active events', async () => {
        mockPrisma.banners.findMany.mockResolvedValue([
            {
                id: 2,
                name: 'B2',
                image_url: 'http://y',
                events: [],
                deals: [{ id: 12 }],
            },
        ]);

        const res = await bannerService.getActiveBanners();

        expect(res[0].target_type).toBe('DEAL');
        expect(res[0].target_id).toBe(12);
    });

    test('getActiveBanners filters out banners with NONE targets', async () => {
        mockPrisma.banners.findMany.mockResolvedValue([
            { id: 3, name: 'B3', image_url: 'http://z', events: [], deals: [] },
        ]);

        const res = await bannerService.getActiveBanners();

        expect(res).toEqual([]);
    });

    test('createBanner passes fields through', async () => {
        const created = { id: 10, name: 'N', image_url: 'u' };
        mockPrisma.banners.create.mockResolvedValue(created);

        const res = await bannerService.createBanner({ name: 'N', image_url: 'u' });

        expect(mockPrisma.banners.create).toHaveBeenCalledWith({
            data: { name: 'N', image_url: 'u' },
        });
        expect(res).toBe(created);
    });

    test('getBannersByDateRange queries prisma with OR across deals/events', async () => {
        const start = new Date('2026-01-01T00:00:00.000Z');
        const end = new Date('2026-01-02T00:00:00.000Z');
        const sample = [{ id: 1 }];
        mockPrisma.banners.findMany.mockResolvedValue(sample);

        const res = await bannerService.getBannersByDateRange(start, end);

        expect(mockPrisma.banners.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.any(Object),
                include: { deals: true, events: true },
            })
        );
        expect(res).toBe(sample);
    });
});
