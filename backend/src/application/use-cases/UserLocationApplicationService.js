const UserLocation = require('../../domain/entities/UserLocation');
const { UserLocationResponseDTO } = require('../dtos/UserLocationDTO');

class UserLocationApplicationService {
  constructor(userLocationRepository, userRepository, locationRepository, eventPublisher) {
    this.userLocationRepository = userLocationRepository;
    this.userRepository = userRepository;
    this.locationRepository = locationRepository;
    this.eventPublisher = eventPublisher;
  }

  async getUserLocation(id) {
    const userLocation = await this.userLocationRepository.findById(id);
    if (!userLocation) throw new Error(`UserLocation ${id} not found`);
    return UserLocationResponseDTO.fromDomain(userLocation);
  }

  async getUserLocations(userId) {
    const userLocations = await this.userLocationRepository.findByUser(userId);
    return userLocations.map(ul => UserLocationResponseDTO.fromDomain(ul));
  }

  async getLocationVisitors(locationId) {
    const userLocations = await this.userLocationRepository.findByLocation(locationId);
    return userLocations.map(ul => UserLocationResponseDTO.fromDomain(ul));
  }

  async checkInUser(userId, locationId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    
    const location = await this.locationRepository.findById(locationId);
    if (!location) throw new Error(`Location ${locationId} not found`);

    const userLocation = UserLocation.create(null, userId, locationId);
    const saved = await this.userLocationRepository.save(userLocation);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return UserLocationResponseDTO.fromDomain(saved);
  }

  async checkOutUser(id) {
    const userLocation = await this.userLocationRepository.findById(id);
    if (!userLocation) throw new Error(`UserLocation ${id} not found`);
    
    userLocation.checkOut();
    const saved = await this.userLocationRepository.save(userLocation);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return UserLocationResponseDTO.fromDomain(saved);
  }

  async getActiveVisitors(locationId) {
    const visitors = await this.userLocationRepository.findActiveByLocation(locationId);
    return visitors.map(ul => UserLocationResponseDTO.fromDomain(ul));
  }
}

module.exports = UserLocationApplicationService;
