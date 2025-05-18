import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { AppLogger } from './infrastructure/logging/logger.service';
import { getWinstonLoggerConfig } from './infrastructure/logging/winston.config';
import {
  API_PREFIX,
  API_DEFAULT_VERSION,
  API_DEFAULT_PREFIX,
} from './common/constants';

async function bootstrap() {
  const bootstrapLogger = WinstonModule.createLogger(getWinstonLoggerConfig());
  const app = await NestFactory.create(AppModule, {
    logger: bootstrapLogger,
    bufferLogs: false,
  });

  const logger = await app.resolve(AppLogger);
  logger.setContext('Bootstrap');

  const configService = app.get(ConfigService);
  const env = configService.get('ENVIRONMENT') || 'development';

  logger.log(`Node Environment: ${env}}`);

  // Prefix path for API
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
    prefix: API_DEFAULT_PREFIX,
  });

  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('Authentication and authorization API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, documentFactory);

  const port = configService.get('BACKEND_PORT');
  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
