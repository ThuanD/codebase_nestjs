import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../database/prisma.service';
import { HEALTH_CHECK_CONSTANTS } from '../constants/health.constants';

/**
 * Health indicator for checking Prisma database connectivity
 */
@Injectable()
export class PrismaHealthIndicator {
  private readonly logger = new Logger(PrismaHealthIndicator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  /**
   * Checks if the Prisma database connection is healthy
   * @param key - The key to identify this health check (defaults to 'prisma')
   * @returns A health indicator response
   */
  async isHealthy(
    key: string = HEALTH_CHECK_CONSTANTS.PRISMA.KEY,
  ): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return indicator.up({
        message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.HEALTHY,
      });
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`, {
        error,
        stack: error.stack,
      });
      return indicator.down({
        message: error.message || HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.FAILED,
      });
    }
  }
}
