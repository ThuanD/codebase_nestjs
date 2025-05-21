import * as path from 'path';
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckResult,
  HealthCheckService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { HEALTH_CHECK_CONSTANTS } from './constants/health.constants';
import { CacheHealthIndicator } from './indicators/cache.health';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import {
  ApiTag,
  ApiHealthCheck,
} from '../../docs/api/swagger/health/api-health.decorator';

@ApiTag()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private cache: CacheHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  /**
   * Checks the health status of all system components
   * @returns HealthCheckResult containing status of all components
   */
  @Get()
  @ApiHealthCheck()
  healthCheck(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.isHealthy(HEALTH_CHECK_CONSTANTS.PRISMA.KEY),
      () => this.cache.isHealthy(HEALTH_CHECK_CONSTANTS.CACHE.KEY),
      () =>
        this.disk.checkStorage(HEALTH_CHECK_CONSTANTS.DISK.KEY, {
          path: path.resolve(process.cwd(), '..'),
          thresholdPercent: HEALTH_CHECK_CONSTANTS.DISK.THRESHOLD,
        }),
      () =>
        this.memory.checkHeap(
          HEALTH_CHECK_CONSTANTS.MEMORY.KEY,
          HEALTH_CHECK_CONSTANTS.MEMORY.THRESHOLD,
        ),
    ]);
  }
}
