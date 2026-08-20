const mockPrisma = {
    user_settings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const userSettingService = require('../userSettingService');

describe('userSettingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getUserSettingsByUserId calls prisma.findUnique with user_id', async () => {
        const sample = { user_id: 5, notifications_enabled: true };
        mockPrisma.user_settings.findUnique.mockResolvedValue(sample);

        const res = await userSettingService.getUserSettingsByUserId(5);

        expect(mockPrisma.user_settings.findUnique).toHaveBeenCalledWith({
            where: { user_id: 5 },
        });
        expect(res).toBe(sample);
    });

    test('createUserSettings creates settings with user_id merged into data', async () => {
        const created = { id: 1, user_id: 7, notifications_enabled: false };
        mockPrisma.user_settings.create.mockResolvedValue(created);

        const res = await userSettingService.createUserSettings(7, { notifications_enabled: false });

        expect(mockPrisma.user_settings.create).toHaveBeenCalledWith({
            data: {
                user_id: 7,
                notifications_enabled: false,
            },
        });
        expect(res).toBe(created);
    });

    test('updateUserSettingsByUserId updates by user_id', async () => {
        const updated = { id: 2, user_id: 7, notifications_enabled: true };
        mockPrisma.user_settings.update.mockResolvedValue(updated);

        const res = await userSettingService.updateUserSettingsByUserId(7, { notifications_enabled: true });

        expect(mockPrisma.user_settings.update).toHaveBeenCalledWith({
            where: { user_id: 7 },
            data: { notifications_enabled: true },
        });
        expect(res).toBe(updated);
    });
});
