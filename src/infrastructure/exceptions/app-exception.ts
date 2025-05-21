import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../domain/shared/exceptions/error-codes.enum';

export interface AppExceptionResponse {
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  requestId?: string;
}

export class AppException extends HttpException {
  constructor(
    code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    metadata?: Record<string, unknown>,
    cause?: Error,
  ) {
    const response: AppExceptionResponse = {
      code,
      message,
      metadata,
    };

    super(response, status, { cause });
  }
}
