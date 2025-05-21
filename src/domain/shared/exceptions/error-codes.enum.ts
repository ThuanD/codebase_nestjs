export enum ErrorCode {
  // System level error codes (1000-1999)
  UNKNOWN_ERROR = '1000',
  VALIDATION_ERROR = '1001',
  UNAUTHORIZED = '1002',
  FORBIDDEN = '1003',
  NOT_FOUND = '1004',

  // User domain error codes (2000-2999)
  USER_NOT_FOUND = '2000',
  USER_ALREADY_EXISTS = '2001',
  INVALID_CREDENTIALS = '2002',

// Infrastructure (5000-5999)
  DATABASE_ERROR = '5000',
  EXTERNAL_SERVICE_ERROR = '5001',
}
