import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { LoggerService } from '../src/common/logging/logger.service';

let app: INestApplication;
let dataSource: DataSource;
let testSchemaName: string;

export const getApp = () => app;
export const getDataSource = () => dataSource;
export const getTestSchemaName = () => testSchemaName;

// Generate a unique schema name for this test run
function generateTestSchemaName(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `test_schema_${timestamp}_${randomSuffix}`;
}

async function createTestSchema() {
  if (!dataSource || !testSchemaName) return;
  
  try {
    // Drop the test schema if it exists to ensure clean state
    await dataSource.query(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE`);
    
    // Create the test schema
    await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${testSchemaName}"`);

    await dataSource.query(`SET search_path TO "${testSchemaName}"`);
    
    // Enable UUID extension in the test schema
    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    console.log(`Created schema with UUID extension: ${testSchemaName}`);
  } catch (error) {
    console.error('Failed to create test schema:', error.message);
    throw error;
  }
}

async function createTablesManually() {
  if (!dataSource || !testSchemaName) return;
  
  try {
    // Set search path
    await dataSource.query(`SET search_path TO "${testSchemaName}", public`);
    
    // Create tables in the correct order to avoid foreign key issues
    
    // 1. Create users table first (no dependencies)
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "${testSchemaName}"."users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying(50) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")
      )
    `);
    
    // 2. Create posts table (depends on users)
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "${testSchemaName}"."posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "content" character varying(255) NOT NULL,
        "category" character varying NOT NULL,
        "authorId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"),
        CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES "${testSchemaName}"."users"("id") ON DELETE CASCADE
      )
    `);
    
    // 3. Create comments table (depends on both users and posts)
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "${testSchemaName}"."comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" character varying(255) NOT NULL,
        "postId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"),
        CONSTRAINT "FK_de3c0c3a4f8e8ddc61e5c5dc07a" FOREIGN KEY ("authorId") REFERENCES "${testSchemaName}"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "${testSchemaName}"."posts"("id") ON DELETE CASCADE
      )
    `);
    
    console.log('Manually created all tables in test schema');
  } catch (error) {
    console.error('Failed to create tables manually:', error.message);
    throw error;
  }
}

async function dropTestSchema() {
  if (!dataSource || !testSchemaName) return;
  
  try {
    // Drop the test schema and all its objects
    await dataSource.query(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE`);
    
    console.log(`Dropped test schema: ${testSchemaName}`);
  } catch (error) {
    console.error('Failed to drop test schema:', error.message);
    // Don't throw here as this is cleanup - we don't want to fail tests due to cleanup issues
  }
}

// Export schema management functions for use in individual test files if needed
export const createTestSchemaForTest = createTestSchema;
export const dropTestSchemaForTest = dropTestSchema;

async function initializeApp() {
  // Set NODE_ENV to test to ensure proper configuration
  process.env.NODE_ENV = 'test';
  
  // Generate unique schema name for this test run
  testSchemaName = generateTestSchemaName();
  
  // Disable synchronize in config to control it manually
  process.env.DATABASE_SYNCHRONIZE = 'false';
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  
  // Get services from DI container (same as main.ts)
  const loggerService = app.get(LoggerService);
  const reflector = app.get(Reflector);
  
  // Apply the same global configurations as in main.ts
  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      validateCustomDecorators: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors (same as main.ts)
  app.useGlobalInterceptors(
    new LoggingInterceptor(loggerService, reflector), 
    new ResponseInterceptor(loggerService)
  );

  // Global exception filter (same as main.ts)
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  // Global JWT Auth Guard (same as main.ts)
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  
  await app.init();

  // Get database connection for schema management
  dataSource = app.get(DataSource);
  
  // Create test schema and set search path
  await createTestSchema();
  
  // Manually create tables instead of using synchronization
  await createTablesManually();
}

// Only run Jest hooks if we're in a Jest test context
if (typeof beforeAll !== 'undefined') {
  beforeAll(async () => {
    await initializeApp();
  });

  afterAll(async () => {
    // Clean up: drop the test schema
    await dropTestSchema();
    
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  }); 
} 