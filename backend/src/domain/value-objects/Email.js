const BaseValueObject = require('../../shared/BaseValueObject');

/**
 * Email value object
 * Ensures email validity
 */
class Email extends BaseValueObject {
  constructor(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
    super({ value: value.toLowerCase() });
  }

  static create(value) {
    return new Email(value);
  }

  get value() {
    return this.props.value;
  }

  toString() {
    return this.value;
  }

  toObject() {
    return { email: this.value };
  }
}

module.exports = Email;
