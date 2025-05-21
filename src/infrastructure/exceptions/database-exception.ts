import { HttpStatus } from '@nestjs/common';
import { AppException } from './app-exception';
import { ErrorCode } from '../../domain/shared/exceptions/error-codes.enum';

export class DatabaseException extends AppException {
  constructor(
    message: string,
    metadata?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(
      ErrorCode.DATABASE_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      metadata,
      cause,
    );
  }
}
