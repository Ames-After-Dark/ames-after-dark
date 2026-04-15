/**
 * Base Value Object class following DDD principles.
 * Value objects are equal if all their properties are equal.
 * Value objects are immutable.
 */
class BaseValueObject {
  constructor(props) {
    this.props = Object.freeze(props);
  }

  /**
   * Value objects are equal if all properties match
   * @param {BaseValueObject} other
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof this.constructor)) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  /**
   * Get the value object's value(s)
   */
  getValue() {
    if (Object.keys(this.props).length === 1) {
      return Object.values(this.props)[0];
    }
    return { ...this.props };
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return { ...this.props };
  }
}

module.exports = BaseValueObject;
