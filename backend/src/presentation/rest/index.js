const createUserRoutes = require('./UserRoutes');
const createFriendshipRoutes = require('./FriendshipRoutes');
const createBannerRoutes = require('./BannerRoutes');
const createLocationRoutes = require('./LocationRoutes');
const createDealRoutes = require('./DealRoutes');
const createEventRoutes = require('./EventRoutes');
const createMenuItemRoutes = require('./MenuItemRoutes');
const createUserLocationRoutes = require('./UserLocationRoutes');
const createUserFavoriteRoutes = require('./UserFavoriteRoutes');
const createUserSettingRoutes = require('./UserSettingRoutes');
const createLocationHourRoutes = require('./LocationHourRoutes');

function registerRoutes(app, container) {
  // User routes
  app.use('/api', createUserRoutes(container));
  
  // Friendship routes
  app.use('/api', createFriendshipRoutes(container));
  
  // Banner routes
  app.use('/api', createBannerRoutes(container));
  
  // Location routes
  app.use('/api', createLocationRoutes(container));
  
  // Deal routes
  app.use('/api', createDealRoutes(container));
  
  // Event routes
  app.use('/api', createEventRoutes(container));
  
  // MenuItem routes
  app.use('/api', createMenuItemRoutes(container));
  
  // UserLocation routes
  app.use('/api', createUserLocationRoutes(container));
  
  // UserFavorite routes
  app.use('/api', createUserFavoriteRoutes(container));
  
  // UserSetting routes
  app.use('/api', createUserSettingRoutes(container));
  
  // LocationHour routes
  app.use('/api', createLocationHourRoutes(container));
}

module.exports = registerRoutes;
