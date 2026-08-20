const mockPrisma = {
    menu_items: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
    },
    menu_item_types: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const menuItemService = require('../menuItemService');

describe('menuItemService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getMenuItemById queries prisma with numeric id', async () => {
        const sample = { id: 1, name: 'Wings' };
        mockPrisma.menu_items.findUnique.mockResolvedValue(sample);

        const res = await menuItemService.getMenuItemById('1');

        expect(mockPrisma.menu_items.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
        });
        expect(res).toBe(sample);
    });

    test('createMenuItem converts location_id to number when provided', async () => {
        const created = { id: 10 };
        mockPrisma.menu_items.create.mockResolvedValue(created);

        const data = {
            location_id: '7',
            name: 'Nachos',
            is_available: true,
            price: 9.99,
        };

        const res = await menuItemService.createMenuItem(data);

        expect(mockPrisma.menu_items.create).toHaveBeenCalledWith({
            data: {
                ...data,
                location_id: 7,
            },
        });
        expect(res).toBe(created);
    });

    test('createMenuItem sets location_id to null when not provided', async () => {
        mockPrisma.menu_items.create.mockResolvedValue({ id: 11 });

        await menuItemService.createMenuItem({ name: 'Soda' });

        expect(mockPrisma.menu_items.create).toHaveBeenCalledWith({
            data: {
                name: 'Soda',
                location_id: null,
            },
        });
    });

    test('updateMenuItem converts location_id to number when provided', async () => {
        const updated = { id: 12 };
        mockPrisma.menu_items.update.mockResolvedValue(updated);

        const res = await menuItemService.updateMenuItem(12, { location_id: '3', name: 'Burger' });

        expect(mockPrisma.menu_items.update).toHaveBeenCalledWith({
            where: { id: 12 },
            data: {
                location_id: 3,
                name: 'Burger',
            },
        });
        expect(res).toBe(updated);
    });

    test('updateMenuItem leaves location_id undefined when not provided', async () => {
        mockPrisma.menu_items.update.mockResolvedValue({ id: 13 });

        await menuItemService.updateMenuItem('13', { name: 'Fries' });

        expect(mockPrisma.menu_items.update).toHaveBeenCalledWith({
            where: { id: 13 },
            data: {
                name: 'Fries',
                location_id: undefined,
            },
        });
    });

    test('deleteMenuItem deletes by numeric id', async () => {
        mockPrisma.menu_items.delete.mockResolvedValue({ id: 20 });

        const res = await menuItemService.deleteMenuItem('20');

        expect(mockPrisma.menu_items.delete).toHaveBeenCalledWith({
            where: { id: 20 },
        });
        expect(res).toEqual({ id: 20 });
    });

    test('getMenuItemsByLocationId queries prisma with numeric location id', async () => {
        const sample = [{ id: 1, location_id: 9 }];
        mockPrisma.menu_items.findMany.mockResolvedValue(sample);

        const res = await menuItemService.getMenuItemsByLocationId('9');

        expect(mockPrisma.menu_items.findMany).toHaveBeenCalledWith({
            where: { location_id: 9 },
        });
        expect(res).toBe(sample);
    });

    test('getMenuItemTypes orders by id asc', async () => {
        const sample = [{ id: 1, name: 'Food' }];
        mockPrisma.menu_item_types.findMany.mockResolvedValue(sample);

        const res = await menuItemService.getMenuItemTypes();

        expect(mockPrisma.menu_item_types.findMany).toHaveBeenCalledWith({
            orderBy: { id: 'asc' },
        });
        expect(res).toBe(sample);
    });

    test('createMenuItemType passes data to prisma', async () => {
        const created = { id: 2, name: 'Drink' };
        mockPrisma.menu_item_types.create.mockResolvedValue(created);

        const res = await menuItemService.createMenuItemType({ name: 'Drink' });

        expect(mockPrisma.menu_item_types.create).toHaveBeenCalledWith({
            data: { name: 'Drink' },
        });
        expect(res).toBe(created);
    });
});
