const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.recordAlbumIfNew = async ({ folderName, locationId, photographerId }) => {
  const existing = await prisma.photo_albums.findUnique({ where: { folder_name: folderName } });
  if (existing) return null;

  try {
    return await prisma.photo_albums.create({
      data: { folder_name: folderName, location_id: locationId, photographer_id: photographerId },
    });
  } catch (err) {
    if (err.code !== 'P2002') throw err; // P2002 = unique constraint violation (race condition), safe no-op
    return null;
  }
};

exports.deleteAlbumRecord = async (folderName) => {
  try {
    await prisma.photo_albums.delete({ where: { folder_name: folderName } });
  } catch (err) {
    if (err.code !== 'P2025') throw err; // P2025 = record not found, safe no-op
  }
};

exports.getPublicProfileByUsername = async (username) => {
  const user = await prisma.users.findFirst({
    where: { username },
    include: {
      roles: true,
      photographer_links: { orderBy: { sort_order: 'asc' }, select: { label: true, url: true } },
      photo_albums: { select: { folder_name: true, location_id: true, locations: { select: { name: true } } } },
    },
  });

  if (!user || user.roles?.name?.toLowerCase() !== 'photographer') return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    photoKey: user.photographer_photo_url,
    links: user.photographer_links,
    albums: user.photo_albums.map((a) => ({
      folderName: a.folder_name,
      locationId: a.location_id,
      barName: a.locations.name,
    })),
  };
};

exports.getMyProfile = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { photographer_links: { orderBy: { sort_order: 'asc' }, select: { label: true, url: true } } },
  });

  return {
    bio: user.bio,
    photoKey: user.photographer_photo_url,
    links: user.photographer_links,
  };
};

exports.updateMyProfile = async (userId, { bio, links }) => {
  await prisma.users.update({ where: { id: userId }, data: { bio } });
  await prisma.photographer_links.deleteMany({ where: { user_id: userId } });
  if (links.length > 0) {
    await prisma.photographer_links.createMany({
      data: links.map((link, i) => ({ user_id: userId, label: link.label, url: link.url, sort_order: i })),
    });
  }
};
