import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import {
  HealthIndicatorService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  TerminusModule,
} from '@nestjs/terminus';
import * as request from 'supertest';
import { HEALTH_CHECK_CONSTANTS } from '../src/infrastructure/health/constants/health.constants';
import { HealthController } from '../src/infrastructure/health/health.controller';
import { CacheHealthIndicator } from '../src/infrastructure/health/indicators/cache.health';
import { PrismaHealthIndicator } from '../src/infrastructure/health/indicators/prisma.health';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

// Mock PrismaService
class MockPrismaService {
  async $queryRaw<T>(query: any): Promise<T> {
    if (process.env.MOCK_PRISMA_FAIL === 'true') {
      return Promise.reject(
        new Error(HEALTH_CHECK_CONSTANTS.PRISMA.MESSAGES.FAILED),
      );
    }
    return [{ customQueryResult: 'mocked' }] as T;
  }
}

// Mock CacheManager
const mockCacheManager = {
  get: jest.fn().mockImplementation((key) => {
    if (process.env.MOCK_CACHE_FAIL === 'true') {
      return Promise.reject(
        new Error(HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED),
      );
    }
    return Promise.resolve(HEALTH_CHECK_CONSTANTS.CACHE.TEST_VALUE);
  }),
  set: jest.fn().mockImplementation((key, value) => {
    if (process.env.MOCK_CACHE_FAIL === 'true') {
      return Promise.reject(
        new Error(HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED),
      );
    }
    return Promise.resolve(HEALTH_CHECK_CONSTANTS.CACHE.TEST_VALUE);
  }),
  del: jest.fn().mockImplementation(() => {
    if (process.env.MOCK_CACHE_FAIL === 'true') {
      return Promise.reject(
        new Error(HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.FAILED),
      );
    }
    return Promise.resolve(true);
  }),
};

const mockDiskHealthIndicator = {
  checkStorage: jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve({ [HEALTH_CHECK_CONSTANTS.DISK.KEY]: { status: 'up' } }),
    ),
};

const mockMemoryHealthIndicator = {
  checkHeap: jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve({
        [HEALTH_CHECK_CONSTANTS.MEMORY.KEY]: { status: 'up' },
      }),
    ),
};

describe('HealthController - E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Save original environment variables
    const originalEnv = { ...process.env };

    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        HealthIndicatorService,
        CacheHealthIndicator,
        PrismaHealthIndicator,
        { provide: DiskHealthIndicator, useValue: mockDiskHealthIndicator },
        { provide: MemoryHealthIndicator, useValue: mockMemoryHealthIndicator },
        {
          provide: PrismaService,
          useClass: MockPrismaService,
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Restore original environment variables
    process.env = originalEnv;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.MOCK_PRISMA_FAIL;
    delete process.env.MOCK_CACHE_FAIL;
    delete process.env.MOCK_DISK_FAIL;
    delete process.env.MOCK_MEMORY_FAIL;
  });

  describe('E2E API Tests', () => {
    it('should return 200 when all services are healthy', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'ok',
          info: expect.objectContaining({
            [HEALTH_CHECK_CONSTANTS.PRISMA.KEY]: expect.any(Object),
            [HEALTH_CHECK_CONSTANTS.CACHE.KEY]: expect.any(Object),
            [HEALTH_CHECK_CONSTANTS.DISK.KEY]: expect.any(Object),
            [HEALTH_CHECK_CONSTANTS.MEMORY.KEY]: expect.any(Object),
          }),
          error: expect.any(Object),
          details: expect.any(Object),
        }),
      );
    });

    it('should return 503 when database is unhealthy', async () => {
      // Arrange
      process.env.MOCK_PRISMA_FAIL = 'true';

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(503);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            database: expect.objectContaining({
              status: 'down',
            }),
          }),
        }),
      );
    });

    it('should return 503 when cache is unhealthy', async () => {
      // Arrange
      process.env.MOCK_CACHE_FAIL = 'true';

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(503);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            cache: expect.objectContaining({
              status: 'down',
            }),
          }),
        }),
      );
    });
  });
});
