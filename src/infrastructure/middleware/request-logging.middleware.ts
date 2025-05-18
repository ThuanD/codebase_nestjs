import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { AppLogger, logContextStorage } from '../logging/logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private logger: AppLogger) {
    this.logger.setContext('HTTP');
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();
    
    const requestIdHeader = request.headers['x-request-id'] || uuidv4();
    const requestId: string = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;
    request.requestId = requestId;

    // Create context map with request-specific data
    const contextMap = new Map<string, any>();
    contextMap.set('requestId', requestId);
    contextMap.set('method', method);
    contextMap.set('url', originalUrl);
    contextMap.set('ip', ip);

    // Log incoming request
    this.logger.debug(`Incoming request ${method} ${originalUrl}`, 'HTTP', {
      user_agent: userAgent,
      requestId: requestId,
    });

    // Add response logging
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      const logMeta = {
        status_code: statusCode,
        response_time_ms: responseTime,
      };

      const message = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${responseTime}ms`;

      if (statusCode >= 500) {
        this.logger.error(
          `Request completed with error ${message}`,
          null,
          'HTTP',
          logMeta,
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `Request completed with issue ${message}`,
          'HTTP',
          logMeta,
        );
      } else {
        this.logger.log(`Request completed ${message}`, 'HTTP', logMeta);
      }
    });

    // Use AsyncLocalStorage to maintain context through the request lifecycle
    logContextStorage.run(contextMap, next);
  }
}
