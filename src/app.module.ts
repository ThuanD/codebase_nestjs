import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import * as Joi from 'joi';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './infrastructure/health/health.module';
import { getWinstonLoggerConfig } from './infrastructure';
import { CACHE_CONSTANTS } from './app.constants';
import {
  AppLogger,
  AllExceptionFilter,
  RequestIdInterceptor,
  RequestLoggingMiddleware,
  PrismaModule,
} from './infrastructure';

const getEnvFilePath = () => {
  switch (process.env.ENVIRONMENT) {
    case 'production':
      return '.env.production';
    case 'test':
      return '.env.test';
    default:
      return '.env';
  }
};

const validationSchema = Joi.object({
  APP_NAME: Joi.string().required(),

  // Environment
  ENVIRONMENT: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  // Server configuration
  BACKEND_PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

  // Database configuration
  DATABASE_URL: Joi.string().required(),

  // Redis configuration
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePath(),
      cache: false,
      validationSchema: validationSchema,
    }),
    WinstonModule.forRoot(getWinstonLoggerConfig()),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB'),
        ttl: CACHE_CONSTANTS.TTL,
        max: CACHE_CONSTANTS.MAX_ITEMS,
      }),
      inject: [ConfigService],
    }),

    // Infrastructure
    PrismaModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLogger,
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*path');
  }
}
