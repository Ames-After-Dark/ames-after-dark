const { PrismaClient } = require('@prisma/client');
const LocationApplicationService = require('../../application/use-cases/LocationApplicationService');
const UserApplicationService = require('../../application/use-cases/UserApplicationService');
const EventApplicationService = require('../../application/use-cases/EventApplicationService');
const PrismaLocationRepository = require('../repositories/PrismaLocationRepository');
const PrismaUserRepository = require('../repositories/PrismaUserRepository');
const PrismaEventRepository = require('../repositories/PrismaEventRepository');
const EventPublisher = require('../event-bus/EventPublisher');

/**
 * Composition Root / Service Container
 * Responsible for instantiating and wiring all dependencies
 * This implements the Dependency Injection pattern
 */
class ServiceContainer {
  constructor() {
    this.prisma = new PrismaClient();
    this.eventPublisher = new EventPublisher();
    this._initializeRepositories();
    this._initializeServices();
  }

  _initializeRepositories() {
    this.locationRepository = new PrismaLocationRepository(this.prisma);
    this.userRepository = new PrismaUserRepository(this.prisma);
    this.eventRepository = new PrismaEventRepository(this.prisma);
  }

  _initializeServices() {
    this.locationApplicationService = new LocationApplicationService(
      this.locationRepository,
      this.eventPublisher
    );
    this.userApplicationService = new UserApplicationService(
      this.userRepository,
      this.eventPublisher
    );
    this.eventApplicationService = new EventApplicationService(
      this.eventRepository,
      this.eventPublisher
    );
  }

  /**
   * Get location application service
   */
  getLocationApplicationService() {
    return this.locationApplicationService;
  }

  /**
   * Get user application service
   */
  getUserApplicationService() {
    return this.userApplicationService;
  }

  /**
   * Get event application service
   */
  getEventApplicationService() {
    return this.eventApplicationService;
  }

  /**
   * Get event publisher
   */
  getEventPublisher() {
    return this.eventPublisher;
  }

  /**
   * Cleanup resources
   */
  async shutdown() {
    await this.prisma.$disconnect();
  }
}

// Singleton instance
let instance;

function getServiceContainer() {
  if (!instance) {
    instance = new ServiceContainer();
  }
  return instance;
}

module.exports = {
  getServiceContainer,
  ServiceContainer,
};
