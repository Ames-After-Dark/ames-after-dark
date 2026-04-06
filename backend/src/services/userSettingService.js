const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user settings by userId
exports.getUserSettingsByUserId = async (userId) => {
	return prisma.user_settings.findUnique({
		where: { user_id: userId },
	});
}

// Create user settings for user
exports.createUserSettings = async (userId, data) => {
	return prisma.user_settings.create({
		data: {
			user_id: userId,
			...data
		}
	});
}

// Update user settings by userId
exports.updateUserSettingsByUserId = async (userId, data) => {
	return prisma.user_settings.update({
		where: { user_id: userId },
		data,
	});
}
