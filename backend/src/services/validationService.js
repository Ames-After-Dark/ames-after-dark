/**
 * Validation service for user data
 * Provides validation functions for phone numbers and birthdays
 */

/**
 * Validates a phone number
 * Accepts formats: +1234567890, 123-456-7890, (123) 456-7890, 1234567890
 * @param {string} phoneNumber - The phone number to validate
 * @returns {Object} { valid: boolean, error: string | null }
 */
exports.validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return { valid: false, error: 'Phone number is required' };
  }

  if (typeof phoneNumber !== 'string') {
    return { valid: false, error: 'Phone number must be a string' };
  }

  // Remove all non-numeric characters for validation
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // Check if phone number has 10-11 digits (US format with or without country code)
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { valid: false, error: 'Phone number must be 10-11 digits' };
  }

  // If 11 digits, first digit should be 1 (US country code)
  if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
    return { valid: false, error: 'Invalid country code for phone number' };
  }

  return { valid: true, error: null };
};

/**
 * Validates a birthday and checks if user is at least 21 years old
 * @param {string | Date} birthday - The birthday to validate
 * @returns {Object} { valid: boolean, error: string | null }
 */
exports.validateBirthday = (birthday) => {
  if (!birthday) {
    return { valid: false, error: 'Birthday is required' };
  }

  // Try to parse the birthday
  const birthDate = new Date(birthday);

  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return { valid: false, error: 'Invalid birthday format. Please use YYYY-MM-DD or ISO format' };
  }

  // Check if date is in the future
  const now = new Date();
  if (birthDate > now) {
    return { valid: false, error: 'Birthday cannot be in the future' };
  }

  // Check if date is too far in the past (more than 120 years ago)
  const maxAge = 120;
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - maxAge);
  if (birthDate < minDate) {
    return { valid: false, error: `Birthday cannot be more than ${maxAge} years ago` };
  }

  // Calculate age
  const age = calculateAge(birthDate);

  // Check if user is at least 21 years old
  const minimumAge = 21;
  if (age < minimumAge) {
    return { valid: false, error: `You must be at least ${minimumAge} years old to register` };
  }

  return { valid: true, error: null };
};

/**
 * Helper function to calculate age from birthday
 * @param {Date} birthDate - The birth date
 * @returns {number} Age in years
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validates both phone number and birthday
 * @param {string} phoneNumber - The phone number to validate
 * @param {string | Date} birthday - The birthday to validate
 * @returns {Object} { valid: boolean, errors: Object }
 */
exports.validateUserRegistrationData = (phoneNumber, birthday) => {
  const phoneValidation = exports.validatePhoneNumber(phoneNumber);
  const birthdayValidation = exports.validateBirthday(birthday);

  const errors = {};
  if (!phoneValidation.valid) {
    errors.phoneNumber = phoneValidation.error;
  }
  if (!birthdayValidation.valid) {
    errors.birthday = birthdayValidation.error;
  }

  return {
    valid: phoneValidation.valid && birthdayValidation.valid,
    errors: Object.keys(errors).length > 0 ? errors : null
  };
};
