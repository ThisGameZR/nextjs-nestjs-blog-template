import { registerAs } from '@nestjs/config';
import { getEnvVar, validatePort, validateBoolean } from './config-validation.util';

export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: string[];
  synchronize: boolean;
  logging: boolean;
  ssl: boolean | { rejectUnauthorized: boolean };
}

export const getDatabaseConfig = registerAs('database', (): DatabaseConfig => {
  try {
    const nodeEnv = getEnvVar('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';
    const isDevelopment = nodeEnv === 'development';

    return {
      type: 'postgres',
      host: getEnvVar('DATABASE_HOST', 'localhost', {
        required: isProduction,
      }),
      port: getEnvVar('DATABASE_PORT', '5432', {
        transform: validatePort,
      }),
      username: getEnvVar('DATABASE_USERNAME', isDevelopment ? 'api_user' : undefined, {
        required: isProduction,
      }),
      password: getEnvVar('DATABASE_PASSWORD', isDevelopment ? 'api_password' : undefined, {
        required: isProduction,
      }),
      database: getEnvVar('DATABASE_NAME', isDevelopment ? 'api_db' : undefined, {
        required: isProduction,
      }),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: getEnvVar('DATABASE_SYNCHRONIZE', isDevelopment.toString(), {
        transform: validateBoolean,
      }),
      logging: getEnvVar('DATABASE_LOGGING', isDevelopment.toString(), {
        transform: validateBoolean,
      }),
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };
  } catch (error) {
    throw new Error(`Database configuration validation failed: ${error.message}`);
  }
});
