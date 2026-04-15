const UserFavorite = require('../../domain/entities/UserFavorite');
const { UserFavoriteResponseDTO } = require('../dtos/UserFavoriteDTO');

class UserFavoriteApplicationService {
  constructor(userFavoriteRepository, userRepository, locationRepository, eventPublisher) {
    this.userFavoriteRepository = userFavoriteRepository;
    this.userRepository = userRepository;
    this.locationRepository = locationRepository;
    this.eventPublisher = eventPublisher;
  }

  async getUserFavorite(id) {
    const userFavorite = await this.userFavoriteRepository.findById(id);
    if (!userFavorite) throw new Error(`UserFavorite ${id} not found`);
    return UserFavoriteResponseDTO.fromDomain(userFavorite);
  }

  async getUserFavorites(userId) {
    const favorites = await this.userFavoriteRepository.findByUser(userId);
    return favorites.map(f => UserFavoriteResponseDTO.fromDomain(f));
  }

  async getLocationFavorites(locationId) {
    const favorites = await this.userFavoriteRepository.findByLocation(locationId);
    return favorites.map(f => UserFavoriteResponseDTO.fromDomain(f));
  }

  async addFavorite(userId, locationId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    
    const location = await this.locationRepository.findById(locationId);
    if (!location) throw new Error(`Location ${locationId} not found`);

    const existing = await this.userFavoriteRepository.findByUserAndLocation(userId, locationId);
    if (existing) throw new Error('Location is already favorited');

    const userFavorite = UserFavorite.create(null, userId, locationId);
    const saved = await this.userFavoriteRepository.save(userFavorite);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return UserFavoriteResponseDTO.fromDomain(saved);
  }

  async removeFavorite(id) {
    const userFavorite = await this.userFavoriteRepository.findById(id);
    if (!userFavorite) throw new Error(`UserFavorite ${id} not found`);
    
    userFavorite.remove();
    const saved = await this.userFavoriteRepository.save(userFavorite);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
  }

  async isFavorited(userId, locationId) {
    const userFavorite = await this.userFavoriteRepository.findByUserAndLocation(userId, locationId);
    return !!userFavorite;
  }
}

module.exports = UserFavoriteApplicationService;
