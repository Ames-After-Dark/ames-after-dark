const BaseValueObject = require('../../shared/BaseValueObject');

/**
 * Money value object
 * Represents a monetary amount with currency
 */
class Money extends BaseValueObject {
  constructor(amount, currency = 'USD') {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Money amount must be a non-negative number');
    }
    if (typeof currency !== 'string' || currency.length !== 3) {
      throw new Error('Currency must be a 3-letter ISO code');
    }
    super({
      amount: Number(amount),
      currency: currency.toUpperCase(),
    });
  }

  static create(amount, currency = 'USD') {
    return new Money(amount, currency);
  }

  get amount() {
    return this.props.amount;
  }

  get currency() {
    return this.props.currency;
  }

  add(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only add Money to Money');
    }
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot add different currencies: ${this.currency} and ${other.currency}`
      );
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only subtract Money from Money');
    }
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot subtract different currencies: ${this.currency} and ${other.currency}`
      );
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Resulting amount cannot be negative');
    }
    return new Money(result, this.currency);
  }

  toObject() {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}

module.exports = Money;
