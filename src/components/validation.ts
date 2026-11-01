interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a password based on a set of rules.
 * @param password The password to validate.
 * @returns An object with validation status and an optional error message.
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  if (password.length < 1) {
    return {
      isValid: false,
      error: 'Password must be at least 1 character long.',
    };
  }

  // You can add more complex rules here if needed

  return { isValid: true };
};

/**
 * Cleans the password string. Currently, it just trims whitespace.
 * In a real-world application, this is where you would hash the password.
 * @param password The password string to clean.
 * @returns The cleaned password.
 */
export const cleanPassword = (password: string): string => {
  return password.trim();
};