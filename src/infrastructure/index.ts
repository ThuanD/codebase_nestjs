// Interceptors
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';

// Logging
import { AppLogger } from './logging/logger.service';
import { getWinstonLoggerConfig } from './logging/winston.config';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';

// Database
import { PrismaModule } from './database/prisma.module';
import { PrismaService } from './database/prisma.service';

export {
  // Interceptors
  RequestIdInterceptor,

  // Logging
  AppLogger,
  getWinstonLoggerConfig,
  RequestLoggingMiddleware,

  // Database
  PrismaModule,
  PrismaService,
};
