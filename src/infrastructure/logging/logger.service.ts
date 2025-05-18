import { Inject, Injectable, LoggerService, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

export const logContextStorage = new AsyncLocalStorage<Map<string, any>>();

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}
  setContext(context: string) {
    this.context = context;
  }

  // Get current request context from AsyncLocalStorage
  private getContextData(): Record<string, any> {
    const store = logContextStorage.getStore();
    return store ? Object.fromEntries(store.entries()) : {};
  }

  log(message: any, context?: string, ...meta: any[]) {
    const contextData = this.getContextData();
    this.winstonLogger.info(message, {
      context: context || this.context,
      ...contextData,
      ...this.formatMeta(meta),
    });
  }

  error(message: any, trace?: string, context?: string, ...meta: any[]) {
    const contextData = this.getContextData();
    this.winstonLogger.error(message, {
      context: context || this.context,
      trace,
      ...contextData,
      ...this.formatMeta(meta),
    });
  }

  warn(message: any, context?: string, ...meta: any[]) {
    const contextData = this.getContextData();
    this.winstonLogger.warn(message, {
      context: context || this.context,
      ...contextData,
      ...this.formatMeta(meta),
    });
  }

  debug(message: any, context?: string, ...meta: any[]) {
    const contextData = this.getContextData();
    this.winstonLogger.debug(message, {
      context: context || this.context,
      ...contextData,
      ...this.formatMeta(meta),
    });
  }

  verbose(message: any, context?: string, ...meta: any[]) {
    const contextData = this.getContextData();
    this.winstonLogger.verbose(message, {
      context: context || this.context,
      ...contextData,
      ...this.formatMeta(meta),
    });
  }

  // Helper to format additional metadata
  private formatMeta(meta: any[]): Record<string, any> {
    if (meta.length === 0) return {};

    if (meta.length === 1 && typeof meta[0] === 'object') {
      return meta[0];
    }

    return { additional: meta };
  }
}
