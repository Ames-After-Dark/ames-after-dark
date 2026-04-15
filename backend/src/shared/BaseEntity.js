/**
 * Base Entity class following DDD principles.
 * All domain entities should extend this class.
 * Enforces identity equality for entities.
 */
class BaseEntity {
  constructor(id, props = {}, createdAt = new Date(), updatedAt = new Date()) {
    if (!id) {
      throw new Error('Entity must have an id');
    }
    this.id = id;
    this.props = props;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Entities are equal if they have the same ID.
   * @param {BaseEntity} other
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof this.constructor)) {
      return false;
    }
    return this.id === other.id;
  }

  /**
   * Get all props for entity
   */
  getProps() {
    return {
      id: this.id,
      ...this.props,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Update entity props (creates new timestamp)
   */
  update(props) {
    this.props = { ...this.props, ...props };
    this.updatedAt = new Date();
  }
}

module.exports = BaseEntity;
