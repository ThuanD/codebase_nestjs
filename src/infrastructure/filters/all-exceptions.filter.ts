import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { IDomainException } from '../../domain/shared/exceptions/domain-exception.interface';
import { AppException } from '../exceptions/app-exception';
import { ExceptionMapper } from '../exceptions/exception.mapper';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle domain exceptions
    if (this.isDomainException(exception)) {
      const appException = ExceptionMapper.toAppException(exception);
      return this.sendErrorResponse(response, appException);
    }

    // Handle infrastructure exceptions
    if (exception instanceof AppException) {
      return this.sendErrorResponse(response, exception);
    }

    // Handle other exceptions
    console.error('Unhandled exception:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }

  private isDomainException(exception: unknown): exception is IDomainException {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      'code' in exception &&
      'message' in exception
    );
  }

  private sendErrorResponse(response: Response, exception: AppException) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    return response.status(status).json({
      success: false,
      error: exceptionResponse,
    });
  }
}
