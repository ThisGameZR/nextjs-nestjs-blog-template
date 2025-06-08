import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggerService } from './common/logging/logger.service';
import { ConfigService } from '@nestjs/config';
import { GeneralConfig } from './config/general.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const generalConfig = configService.get<GeneralConfig>('general');

  if (!generalConfig) {
    throw new Error('General configuration not found');
  }

  // Get services from DI container
  const loggerService = app.get(LoggerService);
  const reflector = app.get(Reflector);

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.setGlobalPrefix('api');

  // Enable CORS
  const corsOrigins = generalConfig.cors.origin.split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-User-Id', 'X-Requested-With', 'X-API-Key'],
  });

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

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService, reflector), new ResponseInterceptor(loggerService));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  // Global JWT Auth Guard
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Dynamic Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Datawow Interview')
    .setDescription(`**Environment**: ${generalConfig.environment}`)
    .setVersion('1.0.0')
    // JWT Authentication
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    // Dynamic server configuration based on environment
    .addServer(`http://localhost:${generalConfig.port}`, 'Development server')
    .build();

  // Create Swagger document
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => `${controllerKey}_${methodKey}`,
    deepScanRoutes: true,
    ignoreGlobalPrefix: false,
  });

  // Swagger UI options
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'list',
      deepLinking: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Datawow Interview Documentation',
  };

  // Setup Swagger UI
  SwaggerModule.setup('api-docs', app, document, swaggerOptions);

  const port = generalConfig.port;
  await app.listen(port);

  // Application startup logging
  loggerService.log(`📖 API documentation: http://localhost:${port}/api-docs`, 'Bootstrap');
  loggerService.log(`🌍 Environment: ${generalConfig.environment}`, 'Bootstrap');
  loggerService.log(`✅ Application started successfully on ${port}`, 'Bootstrap');
}
void bootstrap();
