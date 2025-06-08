import { registerAs } from '@nestjs/config';
import { getEnvVar, validateLogLevel, validateBoolean, validatePositiveInt } from './config-validation.util';

export interface LoggingConfig {
  level: string;
  silent: boolean;
  prettyPrint: boolean;
  timestamp: boolean;
  logDatabase: boolean;
  logRequests: boolean;
  logUserActions: boolean;
  maxFileSize: string;
  maxFiles: number;
  logDirectory: string;
}

/**
 * Validates log file size format (e.g., '20m', '1g', '500k')
 */
function validateLogFileSize(value: string): string {
  const pattern = /^\d+[kmgKMG]?$/;
  if (!pattern.test(value)) {
    throw new Error(`Invalid log file size format: ${value}. Use format like '20m', '1g', '500k'`);
  }
  return value;
}

export default registerAs('logging', (): LoggingConfig => {
  try {
    const nodeEnv = getEnvVar('NODE_ENV', 'development', {
      allowedValues: ['development', 'production', 'test'],
    });

    const isProduction = nodeEnv === 'production';
    const isDevelopment = nodeEnv === 'development';
    const isTest = nodeEnv === 'test';

    // Environment-specific defaults
    const getDefaultLevel = (): string => {
      switch (nodeEnv) {
        case 'production':
          return 'warn';
        case 'test':
          return 'error';
        case 'development':
        default:
          return 'debug';
      }
    };

    return {
      level: getEnvVar('LOG_LEVEL', getDefaultLevel(), {
        transform: validateLogLevel,
      }),
      silent: getEnvVar('LOG_SILENT', isTest.toString(), {
        transform: validateBoolean,
      }),
      prettyPrint: getEnvVar('LOG_PRETTY_PRINT', isDevelopment.toString(), {
        transform: validateBoolean,
      }),
      timestamp: getEnvVar('LOG_TIMESTAMP', 'true', {
        transform: validateBoolean,
      }),
      logDatabase: getEnvVar('LOG_DATABASE', (!isProduction && !isTest).toString(), {
        transform: validateBoolean,
      }),
      logRequests: getEnvVar('LOG_REQUESTS', (!isTest).toString(), {
        transform: validateBoolean,
      }),
      logUserActions: getEnvVar('LOG_USER_ACTIONS', (!isTest).toString(), {
        transform: validateBoolean,
      }),
      maxFileSize: getEnvVar('LOG_MAX_FILE_SIZE', '20m', {
        transform: validateLogFileSize,
      }),
      maxFiles: getEnvVar('LOG_MAX_FILES', '14', {
        transform: validatePositiveInt,
      }),
      logDirectory: getEnvVar('LOG_DIRECTORY', 'logs'),
    };
  } catch (error) {
    throw new Error(`Logging configuration validation failed: ${error.message}`);
  }
});
