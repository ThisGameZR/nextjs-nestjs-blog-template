/**
 * Configuration validation utilities
 */

export interface ValidationOptions {
  required?: boolean;
  allowedValues?: string[];
  transform?: (value: string) => any;
}

/**
 * Gets an environment variable with validation
 * @param key - Environment variable key
 * @param defaultValue - Default value if not required
 * @param options - Validation options
 * @returns The validated value
 * @throws Error if required value is missing or invalid
 */
export function getEnvVar(key: string, defaultValue?: any, options: ValidationOptions = {}): any {
  const value = process.env[key];

  // Check if required
  if (options.required && (value === undefined || value === '')) {
    throw new Error(`Required environment variable '${key}' is not defined`);
  }

  // Use default if not provided
  const finalValue = value ?? defaultValue;

  // Check allowed values
  if (options.allowedValues && finalValue && !options.allowedValues.includes(String(finalValue))) {
    throw new Error(
      `Environment variable '${key}' has invalid value '${String(finalValue)}'. ` +
        `Allowed values: ${options.allowedValues.join(', ')}`,
    );
  }

  // Apply transformation
  if (options.transform && finalValue !== undefined) {
    try {
      return options.transform(String(finalValue));
    } catch (error) {
      throw new Error(`Failed to transform environment variable '${key}': ${error.message}`);
    }
  }

  return finalValue;
}

/**
 * Validates a port number
 */
export function validatePort(value: string): number {
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${value}. Must be between 1 and 65535`);
  }
  return port;
}

/**
 * Validates a boolean value
 */
export function validateBoolean(value: string): boolean {
  const lowerValue = value.toLowerCase();
  if (!['true', 'false'].includes(lowerValue)) {
    throw new Error(`Invalid boolean value: ${value}. Must be 'true' or 'false'`);
  }
  return lowerValue === 'true';
}

/**
 * Validates a positive integer
 */
export function validatePositiveInt(value: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1) {
    throw new Error(`Invalid positive integer: ${value}. Must be a positive number`);
  }
  return num;
}

/**
 * Validates log level
 */
export function validateLogLevel(value: string): string {
  const allowedLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
  if (!allowedLevels.includes(value)) {
    throw new Error(`Invalid log level: ${value}. Allowed values: ${allowedLevels.join(', ')}`);
  }
  return value;
}
