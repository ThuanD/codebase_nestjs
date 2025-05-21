export interface DomainExceptionProps {
  message: string;
  code: string;
  cause?: Error;
  metadata?: Record<string, unknown>;
}

export interface IDomainException {
  message: string;
  code: string;
  cause?: Error;
  metadata?: Record<string, unknown>;

  getCode(): string;
  getMessage(): string;
  getMetadata(): Record<string, unknown> | undefined;
}
