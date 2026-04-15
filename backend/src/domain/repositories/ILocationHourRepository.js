class ILocationHourRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findByLocationId(locationId) { throw new Error('Not implemented'); }
  async findByLocationAndDay(locationId, dayOfWeek) { throw new Error('Not implemented'); }
  async save(locationHour) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}
module.exports = ILocationHourRepository;
