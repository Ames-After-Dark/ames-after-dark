const BaseValueObject = require('../../shared/BaseValueObject');

/**
 * Time Range value object
 * Represents opening and closing times in HH:mm format
 */
class TimeRange extends BaseValueObject {
  constructor(openTime, closeTime) {
    this.validateTimeFormat(openTime);
    this.validateTimeFormat(closeTime);

    super({
      openTime,
      closeTime,
    });
  }

  static create(openTime, closeTime) {
    return new TimeRange(openTime, closeTime);
  }

  validateTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected HH:mm`);
    }
  }

  get openTime() {
    return this.props.openTime;
  }

  get closeTime() {
    return this.props.closeTime;
  }

  /**
   * Check if this is an overnight range (e.g., 22:00 to 02:00)
   */
  isOvernight() {
    return this.closeTime < this.openTime;
  }

  /**
   * Check if a given time falls within this range
   */
  contains(timeStr) {
    this.validateTimeFormat(timeStr);

    if (!this.isOvernight()) {
      return timeStr >= this.openTime && timeStr <= this.closeTime;
    }

    // Overnight: either after openTime OR before closeTime
    return timeStr >= this.openTime || timeStr <= this.closeTime;
  }

  toObject() {
    return {
      openTime: this.openTime,
      closeTime: this.closeTime,
    };
  }
}

module.exports = TimeRange;
