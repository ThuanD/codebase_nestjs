import { HttpStatus } from '@nestjs/common';
import { AppException } from './app-exception';
import { IDomainException } from '../../domain/shared/exceptions/domain-exception.interface';
import { ErrorCode } from '../../domain/shared/exceptions/error-codes.enum';

export class ExceptionMapper {
  static toAppException(exception: IDomainException): AppException {
    const status = this.mapErrorCodeToHttpStatus(exception.code);

    return new AppException(
      exception.code as ErrorCode,
      exception.message,
      status,
      exception.metadata,
    );
  }

  private static mapErrorCodeToHttpStatus(errorCode: string): HttpStatus {
    const errorCodeMap: Record<string, HttpStatus> = {
      // Auth domain
      [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
    };

    return errorCodeMap[errorCode] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
