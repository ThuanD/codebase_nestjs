import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { HEALTH_CHECK_CONSTANTS } from '../constants/health.constants';

/**
 * Health indicator for checking cache connectivity
 */
@Injectable()
export class CacheHealthIndicator {
  private readonly logger = new Logger(CacheHealthIndicator.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  /**
   * Checks if the cache connection is healthy
   * @param key - The key to identify this health check (defaults to 'cache')
   * @returns A health indicator response
   */
  async isHealthy(
    key: string = HEALTH_CHECK_CONSTANTS.CACHE.KEY,
  ): Promise<HealthIndicatorResult> {
    const testKey = HEALTH_CHECK_CONSTANTS.CACHE.TEST_KEY;
    const testValue = HEALTH_CHECK_CONSTANTS.CACHE.TEST_VALUE;
    const ttl = HEALTH_CHECK_CONSTANTS.CACHE.TTL;

    const indicator = this.healthIndicatorService.check(key);

    try {
      // Save test value to cache
      await this.cacheManager.set(testKey, testValue, ttl);
      await this.cacheManager.get(testKey);

      // Get value from cache
      const retrievedValue = await this.cacheManager.get(testKey);

      // Clean up
      await this.cacheManager.del(testKey);

      if (retrievedValue !== testValue) {
        throw new Error(
          HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.VERIFICATION_FAILED,
        );
      }

      return indicator.up({
        message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.HEALTHY,
      });
    } catch (error) {
      this.logger.error(`Cache health check failed: ${error.message}`, {
        error,
        stack: error.stack,
      });
      return indicator.down({
        message: error.message || HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED,
      });
    }
  }
}
