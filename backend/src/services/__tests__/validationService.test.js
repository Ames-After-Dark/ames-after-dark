const validationService = require('../validationService');

describe('validationService', () => {
  describe('validatePhoneNumber', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('accepts valid 10-digit phone number', () => {
      const result = validationService.validatePhoneNumber('1234567890');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('accepts valid 11-digit phone number with country code', () => {
      const result = validationService.validatePhoneNumber('11234567890');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('accepts phone number with dashes', () => {
      const result = validationService.validatePhoneNumber('123-456-7890');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('accepts phone number with parentheses and spaces', () => {
      const result = validationService.validatePhoneNumber('(123) 456-7890');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('accepts phone number with +1 country code', () => {
      const result = validationService.validatePhoneNumber('+1 (123) 456-7890');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('rejects phone number with less than 10 digits', () => {
      const result = validationService.validatePhoneNumber('123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number must be 10-11 digits');
    });

    test('rejects phone number with more than 11 digits', () => {
      const result = validationService.validatePhoneNumber('123456789012');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number must be 10-11 digits');
    });

    test('rejects 11-digit phone number without country code 1', () => {
      const result = validationService.validatePhoneNumber('21234567890');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid country code for phone number');
    });

    test('rejects empty phone number', () => {
      const result = validationService.validatePhoneNumber('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    test('rejects null phone number', () => {
      const result = validationService.validatePhoneNumber(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    test('rejects undefined phone number', () => {
      const result = validationService.validatePhoneNumber(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    test('rejects non-string phone number', () => {
      const result = validationService.validatePhoneNumber(1234567890);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number must be a string');
    });

    test('rejects phone number with only letters', () => {
      const result = validationService.validatePhoneNumber('abcdefghij');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number must be 10-11 digits');
    });
  });

  describe('validateBirthday', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('accepts valid birthday for 21+ year old (YYYY-MM-DD format)', () => {
      const twentyFiveYearsAgo = new Date();
      twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
      const birthdayStr = twentyFiveYearsAgo.toISOString().split('T')[0];
      
      const result = validationService.validateBirthday(birthdayStr);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('accepts valid birthday exactly 21 years ago', () => {
      const exactlyTwentyOne = new Date();
      exactlyTwentyOne.setFullYear(exactlyTwentyOne.getFullYear() - 21);
      exactlyTwentyOne.setDate(exactlyTwentyOne.getDate() - 1); // One day past 21st birthday
      
      const result = validationService.validateBirthday(exactlyTwentyOne);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('accepts Date object as input', () => {
      const thirtyYearsAgo = new Date();
      thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
      
      const result = validationService.validateBirthday(thirtyYearsAgo);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('accepts ISO 8601 formatted date string', () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 25);
      
      const result = validationService.validateBirthday(date.toISOString());
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('rejects birthday under 21 years old', () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      
      const result = validationService.validateBirthday(twentyYearsAgo);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('You must be at least 21 years old to register');
    });

    test('rejects birthday exactly 21 years ago (birthday not yet occurred)', () => {
      const exactlyTwentyOne = new Date();
      exactlyTwentyOne.setFullYear(exactlyTwentyOne.getFullYear() - 21);
      exactlyTwentyOne.setDate(exactlyTwentyOne.getDate() + 1); // One day before 21st birthday
      
      const result = validationService.validateBirthday(exactlyTwentyOne);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('You must be at least 21 years old to register');
    });

    test('rejects future birthday', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = validationService.validateBirthday(tomorrow);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Birthday cannot be in the future');
    });

    test('rejects birthday more than 120 years ago', () => {
      const tooOld = new Date();
      tooOld.setFullYear(tooOld.getFullYear() - 121);
      
      const result = validationService.validateBirthday(tooOld);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Birthday cannot be more than 120 years ago');
    });

    test('rejects invalid date format', () => {
      const result = validationService.validateBirthday('not-a-date');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid birthday format. Please use YYYY-MM-DD or ISO format');
    });

    test('rejects empty birthday', () => {
      const result = validationService.validateBirthday('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Birthday is required');
    });

    test('rejects null birthday', () => {
      const result = validationService.validateBirthday(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Birthday is required');
    });

    test('rejects undefined birthday', () => {
      const result = validationService.validateBirthday(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Birthday is required');
    });

    test('accepts birthday for someone exactly 120 years old', () => {
      const exactlyOneHundredTwenty = new Date();
      exactlyOneHundredTwenty.setFullYear(exactlyOneHundredTwenty.getFullYear() - 120);
      
      const result = validationService.validateBirthday(exactlyOneHundredTwenty);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('validateUserRegistrationData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('validates both valid phone number and birthday', () => {
      const twentyFiveYearsAgo = new Date();
      twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
      const birthdayStr = twentyFiveYearsAgo.toISOString().split('T')[0];
      
      const result = validationService.validateUserRegistrationData('123-456-7890', birthdayStr);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    test('returns errors for both invalid phone and birthday', () => {
      const result = validationService.validateUserRegistrationData('123', 'invalid-date');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('phoneNumber');
      expect(result.errors).toHaveProperty('birthday');
      expect(result.errors.phoneNumber).toBe('Phone number must be 10-11 digits');
      expect(result.errors.birthday).toBe('Invalid birthday format. Please use YYYY-MM-DD or ISO format');
    });

    test('returns error only for invalid phone number', () => {
      const twentyFiveYearsAgo = new Date();
      twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
      
      const result = validationService.validateUserRegistrationData('123', twentyFiveYearsAgo);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('phoneNumber');
      expect(result.errors).not.toHaveProperty('birthday');
      expect(result.errors.phoneNumber).toBe('Phone number must be 10-11 digits');
    });

    test('returns error only for invalid birthday', () => {
      const result = validationService.validateUserRegistrationData('123-456-7890', 'future-date');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('birthday');
      expect(result.errors).not.toHaveProperty('phoneNumber');
    });

    test('returns error for underage user', () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      
      const result = validationService.validateUserRegistrationData('123-456-7890', twentyYearsAgo);
      expect(result.valid).toBe(false);
      expect(result.errors.birthday).toBe('You must be at least 21 years old to register');
    });

    test('returns error for empty phone and birthday', () => {
      const result = validationService.validateUserRegistrationData('', '');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('phoneNumber');
      expect(result.errors).toHaveProperty('birthday');
      expect(result.errors.phoneNumber).toBe('Phone number is required');
      expect(result.errors.birthday).toBe('Birthday is required');
    });
  });
});
