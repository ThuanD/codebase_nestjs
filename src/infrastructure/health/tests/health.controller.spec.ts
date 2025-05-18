import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import {
  HealthCheckService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import * as path from 'path';
import { HEALTH_CHECK_CONSTANTS } from '../constants/health.constants';
import { PrismaHealthIndicator } from '../indicators/prisma.health';
import { CacheHealthIndicator } from '../indicators/cache.health';

describe('HealthController - Integration Test', () => {
  const databaseKey = HEALTH_CHECK_CONSTANTS.PRISMA.KEY;
  const cacheKey = HEALTH_CHECK_CONSTANTS.CACHE.KEY;
  const diskKey = HEALTH_CHECK_CONSTANTS.DISK.KEY;
  const memoryKey = HEALTH_CHECK_CONSTANTS.MEMORY.KEY;
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let prismaHealthIndicator: PrismaHealthIndicator;
  let cacheHealthIndicator: CacheHealthIndicator;
  let diskHealthIndicator: DiskHealthIndicator;
  let memoryHealthIndicator: MemoryHealthIndicator;

  beforeEach(async () => {
    // Prepare mock responses for health indicators
    const mockDbHealthy = {
      [databaseKey]: {
        status: 'up',
        message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.HEALTHY,
      },
    };
    const mockCacheHealthy = {
      [cacheKey]: {
        status: 'up',
        message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.HEALTHY,
      },
    };
    const mockDiskHealthy = { [diskKey]: { status: 'up' } };
    const mockMemoryHealthy = { [memoryKey]: { status: 'up' } };

    // Mock implementation with spy functions to track method calls
    const mockPrismaHealthIndicator = {
      isHealthy: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockDbHealthy)),
    };

    const mockCacheHealthIndicator = {
      isHealthy: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockCacheHealthy)),
    };

    const mockDiskHealthIndicator = {
      checkStorage: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockDiskHealthy)),
    };

    const mockMemoryHealthIndicator = {
      checkHeap: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockMemoryHealthy)),
    };

    // Create actual mock for HealthCheckService
    const mockHealthCheckService = {
      check: jest.fn().mockImplementation(async (indicators) => {
        const checkResults = {};
        const errors = {};
        let hasErrors = false;

        // Execute all health checks
        for (const check of indicators) {
          try {
            const result = await check();
            Object.assign(checkResults, result);
          } catch (error) {
            hasErrors = true;
            if (error.causes) {
              Object.assign(errors, error.causes);
            } else {
              // Fallback for non-standard error format
              errors['unknown'] = { status: 'down', message: error.message };
            }
          }
        }

        // Create response in terminus format
        const response: HealthCheckResult = {
          status: hasErrors ? 'error' : 'ok',
          info: { ...checkResults },
          error: { ...errors },
          details: { ...checkResults, ...errors },
        };

        return response;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaHealthIndicator },
        { provide: CacheHealthIndicator, useValue: mockCacheHealthIndicator },
        { provide: DiskHealthIndicator, useValue: mockDiskHealthIndicator },
        { provide: MemoryHealthIndicator, useValue: mockMemoryHealthIndicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaHealthIndicator = module.get<PrismaHealthIndicator>(
      PrismaHealthIndicator,
    );
    cacheHealthIndicator =
      module.get<CacheHealthIndicator>(CacheHealthIndicator);
    diskHealthIndicator = module.get<DiskHealthIndicator>(DiskHealthIndicator);
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(
      MemoryHealthIndicator,
    );

    // Setup path.resolve mock
    jest.spyOn(path, 'resolve').mockReturnValue('/mock/disk/path');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call all health checks with correct parameters', async () => {
    // Act
    await controller.healthCheck();

    // Assert
    expect(prismaHealthIndicator.isHealthy).toHaveBeenCalledWith(databaseKey);
    expect(cacheHealthIndicator.isHealthy).toHaveBeenCalledWith(cacheKey);
    expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith(diskKey, {
      path: '/mock/disk/path',
      thresholdPercent: 0.9,
    });
    expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
      memoryKey,
      300 * 1024 * 1024,
    );
  });

  it('should return correctly formatted healthy response', async () => {
    // Act
    const result = await controller.healthCheck();

    // Assert
    expect(result).toEqual({
      status: 'ok',
      info: {
        [databaseKey]: {
          status: 'up',
          message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.HEALTHY,
        },
        [cacheKey]: {
          status: 'up',
          message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.HEALTHY,
        },
        [diskKey]: { status: 'up' },
        [memoryKey]: { status: 'up' },
      },
      error: {},
      details: {
        [databaseKey]: {
          status: 'up',
          message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.HEALTHY,
        },
        [cacheKey]: {
          status: 'up',
          message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.HEALTHY,
        },
        [diskKey]: { status: 'up' },
        [memoryKey]: { status: 'up' },
      },
    });
  });

  it('should handle database failures correctly', async () => {
    // Arrange
    const dbError = new Error('Database connection failed');
    (prismaHealthIndicator.isHealthy as jest.Mock).mockRejectedValueOnce({
      causes: {
        [databaseKey]: {
          status: 'down',
          message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.FAILED,
        },
      },
    });

    // Act
    const result = await controller.healthCheck();

    // Assert
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty(databaseKey);
    expect(result.error[databaseKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.FAILED,
    });
    expect(result.details).toHaveProperty(databaseKey);
    expect(result.details[databaseKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.FAILED,
    });
  });

  it('should handle cache failures correctly', async () => {
    // Arrange
    (cacheHealthIndicator.isHealthy as jest.Mock).mockRejectedValueOnce({
      causes: {
        [cacheKey]: {
          status: 'down',
          message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED,
        },
      },
    });

    // Act
    const result = await controller.healthCheck();

    // Assert
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty(cacheKey);
    expect(result.error[cacheKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED,
    });
    expect(result.details).toHaveProperty(cacheKey);
    expect(result.details[cacheKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED,
    });
  });

  it('should handle disk failures correctly', async () => {
    // Arrange
    (diskHealthIndicator.checkStorage as jest.Mock).mockRejectedValueOnce({
      causes: {
        [diskKey]: {
          status: 'down',
          message: HEALTH_CHECK_CONSTANTS.DISK.MESSAGES.LOW_SPACE,
        },
      },
    });

    // Act
    const result = await controller.healthCheck();

    // Assert
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty(diskKey);
    expect(result.error[diskKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.DISK.MESSAGES.LOW_SPACE,
    });
  });

  it('should handle memory failures correctly', async () => {
    // Arrange
    (memoryHealthIndicator.checkHeap as jest.Mock).mockRejectedValueOnce({
      causes: {
        [memoryKey]: {
          status: 'down',
          message: HEALTH_CHECK_CONSTANTS.MEMORY.MESSAGES.LOW_HEAP,
        },
      },
    });

    // Act
    const result = await controller.healthCheck();

    // Assert
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty(memoryKey);
    expect(result.error[memoryKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.MEMORY.MESSAGES.LOW_HEAP,
    });
  });

  it('should handle multiple failures correctly', async () => {
    // Arrange
    (prismaHealthIndicator.isHealthy as jest.Mock).mockRejectedValueOnce({
      causes: {
        [databaseKey]: {
          status: 'down',
          message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.FAILED,
        },
      },
    });

    (cacheHealthIndicator.isHealthy as jest.Mock).mockRejectedValueOnce({
      causes: {
        [cacheKey]: {
          status: 'down',
          message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED,
        },
      },
    });

    // Act
    const result = await controller.healthCheck();

    // Assert
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty(databaseKey);
    expect(result.error).toHaveProperty(cacheKey);
    expect(result.error[databaseKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.FAILED,
    });
    expect(result.error[cacheKey]).toEqual({
      status: 'down',
      message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED,
    });
  });
});
