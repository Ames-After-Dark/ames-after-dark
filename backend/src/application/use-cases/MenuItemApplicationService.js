const MenuItem = require('../../domain/entities/MenuItem');
const { MenuItemResponseDTO } = require('../dtos/MenuItemDTO');

class MenuItemApplicationService {
  constructor(menuItemRepository, locationRepository, eventPublisher) {
    this.menuItemRepository = menuItemRepository;
    this.locationRepository = locationRepository;
    this.eventPublisher = eventPublisher;
  }

  async getMenuItem(id) {
    const menuItem = await this.menuItemRepository.findById(id);
    if (!menuItem) throw new Error(`MenuItem ${id} not found`);
    return MenuItemResponseDTO.fromDomain(menuItem);
  }

  async getMenuByLocation(locationId) {
    const items = await this.menuItemRepository.findByLocation(locationId);
    return items.map(i => MenuItemResponseDTO.fromDomain(i));
  }

  async createMenuItem(createMenuItemDTO) {
    const { name, description, price, category, locationId, imageUrl } = createMenuItemDTO;
    
    if (!name || !locationId || price === undefined) {
      throw new Error('Name, location ID, and price are required');
    }

    const location = await this.locationRepository.findById(locationId);
    if (!location) throw new Error(`Location ${locationId} not found`);

    const menuItem = MenuItem.create(null, name, description, price, category, locationId, imageUrl);
    const saved = await this.menuItemRepository.save(menuItem);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return MenuItemResponseDTO.fromDomain(saved);
  }

  async updateMenuItem(id, updateMenuItemDTO) {
    const menuItem = await this.menuItemRepository.findById(id);
    if (!menuItem) throw new Error(`MenuItem ${id} not found`);

    const { name, description, price, category, imageUrl } = updateMenuItemDTO;
    if (name) menuItem.setName(name);
    if (description !== undefined) menuItem.setDescription(description);
    if (price !== undefined) menuItem.setPrice(price);
    if (category) menuItem.setCategory(category);
    if (imageUrl) menuItem.setImageUrl(imageUrl);

    const saved = await this.menuItemRepository.save(menuItem);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
    return MenuItemResponseDTO.fromDomain(saved);
  }

  async removeMenuItem(id) {
    const menuItem = await this.menuItemRepository.findById(id);
    if (!menuItem) throw new Error(`MenuItem ${id} not found`);
    menuItem.remove();
    const saved = await this.menuItemRepository.save(menuItem);
    saved.getUncommittedEvents().forEach(e => this.eventPublisher.publish(e));
  }

  async getMenuItemsByCategory(locationId, category) {
    const items = await this.menuItemRepository.findByLocationAndCategory(locationId, category);
    return items.map(i => MenuItemResponseDTO.fromDomain(i));
  }
}

module.exports = MenuItemApplicationService;
