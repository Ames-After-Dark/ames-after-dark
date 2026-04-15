const Location = require('../../domain/aggregates/Location');
const Coordinates = require('../../domain/value-objects/Coordinates');
const { LocationResponseDTO, CreateLocationDTO } = require('../dtos/LocationDTO');

/**
 * Core Application Service for Location use cases
 */
class LocationApplicationService {
  constructor(locationRepository, eventPublisher) {
    this.locationRepository = locationRepository;
    this.eventPublisher = eventPublisher;
  }

  /**
   * Use case: Get all locations
   */
  async getAllLocations() {
    const locations = await this.locationRepository.findAll();
    return locations.map(loc => LocationResponseDTO.fromDomain(loc));
  }

  /**
   * Use case: Get location by ID
   */
  async getLocationById(id) {
    const location = await this.locationRepository.findById(id);
    if (!location) {
      throw new Error(`Location with ID ${id} not found`);
    }
    return LocationResponseDTO.fromDomain(location);
  }

  /**
   * Use case: Get open locations
   */
  async getOpenLocations() {
    const locations = await this.locationRepository.findOpen();
    return locations.map(loc => LocationResponseDTO.fromDomain(loc));
  }

  /**
   * Use case: Find locations near coordinates
   */
  async findNearby(latitude, longitude, radiusKm = 5) {
    const coordinates = new Coordinates(latitude, longitude);
    const locations = await this.locationRepository.findByCoordinates(
      coordinates,
      radiusKm
    );
    return locations.map(loc => LocationResponseDTO.fromDomain(loc));
  }

  /**
   * Use case: Create location
   */
  async createLocation(createLocationDTO) {
    createLocationDTO.validate();

    const coordinates = new Coordinates(
      createLocationDTO.latitude,
      createLocationDTO.longitude
    );

    // Generate ID (normally from DB)
    const id = Math.floor(Math.random() * 1000000);

    const location = Location.create(id, createLocationDTO.name, coordinates, {
      address: createLocationDTO.address,
      description: createLocationDTO.description,
      timezone: createLocationDTO.timezone,
      tags: createLocationDTO.tags,
      imageUrl: createLocationDTO.imageUrl,
    });

    const saved = await this.locationRepository.save(location);

    // Publish events
    const events = location.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return LocationResponseDTO.fromDomain(saved);
  }

  /**
   * Use case: Update location
   */
  async updateLocation(locationId, updateDTO) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error(`Location with ID ${locationId} not found`);
    }

    location.updateDetails(
      updateDTO.name,
      updateDTO.address,
      updateDTO.description,
      updateDTO.imageUrl
    );

    const updated = await this.locationRepository.save(location);

    // Publish events
    const events = location.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    return LocationResponseDTO.fromDomain(updated);
  }

  /**
   * Use case: Delete location
   */
  async deleteLocation(locationId) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error(`Location with ID ${locationId} not found`);
    }

    await this.locationRepository.delete(locationId);
  }

  /**
   * Use case: Record view for location
   */
  async recordLocationView(locationId) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error(`Location with ID ${locationId} not found`);
    }

    location.recordView();
    await this.locationRepository.save(location);
    return location.views;
  }
}

module.exports = LocationApplicationService;
