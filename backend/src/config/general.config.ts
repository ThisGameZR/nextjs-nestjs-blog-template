import { Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import { getEnvVar, validatePort } from './config-validation.util';
import { getDatabaseConfig } from './database.config';
import loggingConfig from './logging.config';

export interface GeneralConfig {
  // Server Configuration
  port: number;
  environment: string;
  apiPrefix: string;

  // Security Configuration
  jwtSecret: string;
  jwtExpiresIn: string;

  // CORS Configuration
  cors: {
    origin: string;
    methods: string;
  };
}

export const getGeneralConfig = registerAs('general', (): GeneralConfig => {
  try {
    return {
      // Server Configuration
      port: getEnvVar('PORT', '5000', {
        transform: validatePort,
      }),
      environment: getEnvVar('NODE_ENV', 'development', {
        allowedValues: ['development', 'production', 'test'],
      }),
      apiPrefix: getEnvVar('API_PREFIX', 'api'),
      // Security Configuration
      jwtSecret: getEnvVar('JWT_SECRET', undefined, {
        required: true,
      }),
      jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
      // CORS Configuration
      cors: {
        origin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000,http://localhost:5173'),
        methods: getEnvVar('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
      },
    };
  } catch (error) {
    throw new Error(`General configuration validation failed: ${error.message}`);
  }
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [getGeneralConfig, getDatabaseConfig, loggingConfig],
    }),
  ],
  exports: [ConfigModule],
})
export class GeneralConfigModule {}
