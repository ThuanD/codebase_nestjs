import {
  IDomainException,
  DomainExceptionProps,
} from './domain-exception.interface';

export abstract class BaseException extends Error implements IDomainException {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;
  readonly cause?: Error;

  constructor(props: DomainExceptionProps) {
    super(props.message, { cause: props.cause });

    this.name = this.constructor.name;
    this.code = props.code;
    this.metadata = props.metadata;

    if (props.cause instanceof Error) {
      this.cause = props.cause;
    } else {
      this.cause = undefined;
    }

    if (typeof Error.captureStackTrace === 'function') {
      // Check if captureStackTrace exists
      Error.captureStackTrace(this, this.constructor);
    } else {
      // Fallback for environments where captureStackTrace might not be available
      // The stack will still be generated but might include the BaseException constructor.
      this.stack = new Error(props.message).stack;
    }
  }

  getCode(): string {
    return this.code;
  }

  getMessage(): string {
    return this.message;
  }

  getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }
}
