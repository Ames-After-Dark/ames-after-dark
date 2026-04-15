const LocationHour = require('../../domain/entities/LocationHour');
const { LocationHourResponseDTO } = require('../dtos/LocationHourDTO');

class LocationHourApplicationService {
  constructor(locationHourRepository, locationRepository, eventPublisher) {
    this.locationHourRepository = locationHourRepository;
    this.locationRepository = locationRepository;
    this.eventPublisher = eventPublisher;
  }

  async getLocationHour(id) {
    const locationHour = await this.locationHourRepository.findById(id);
    if (!locationHour) throw new Error(`LocationHour ${id} not found`);
    return LocationHourResponseDTO.fromDomain(locationHour);
  }

  async getHoursByLocation(locationId) {
    const hours = await this.locationHourRepository.findByLocation(locationId);
    return hours.map(h => LocationHourResponseDTO.fromDomain(h));
  }

  async setLocationHours(locationId, hoursDTO) {
    const location = await this.locationRepository.findById(locationId);
    if (!location) throw new Error(`Location ${locationId} not found`);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const saved = [];

    for (const day of days) {
      if (hoursDTO[day]) {
        const { open, close } = hoursDTO[day];
        const locationHour = LocationHour.create(null, locationId, day, open, close);
        const result = await this.locationHourRepository.save(locationHour);
        result.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
        saved.push(LocationHourResponseDTO.fromDomain(result));
      }
    }

    return saved;
  }

  async updateLocationHour(id, updateDTO) {
    const locationHour = await this.locationHourRepository.findById(id);
    if (!locationHour) throw new Error(`LocationHour ${id} not found`);

    const { open, close } = updateDTO;
    if (open) locationHour.setOpenTime(open);
    if (close) locationHour.setCloseTime(close);

    const saved = await this.locationHourRepository.save(locationHour);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return LocationHourResponseDTO.fromDomain(saved);
  }

  async isLocationOpen(locationId) {
    const hours = await this.locationHourRepository.findByLocation(locationId);
    const now = new Date();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = hours.find(h => h.dayOfWeek === dayName);
    if (!todayHours) return false;

    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }
}

module.exports = LocationHourApplicationService;
