import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthIndicatorService } from '@nestjs/terminus';
import { HEALTH_CHECK_CONSTANTS } from '../constants/health.constants';
import { CacheHealthIndicator } from '../indicators/cache.health';

describe('CacheHealthIndicator', () => {
  const key = HEALTH_CHECK_CONSTANTS.CACHE.KEY;
  let cacheHealthIndicator: CacheHealthIndicator;

  // Mock implementation for Cache Manager
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheHealthIndicator,
        HealthIndicatorService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    cacheHealthIndicator =
      module.get<CacheHealthIndicator>(CacheHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(cacheHealthIndicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when cache operations succeed', async () => {
      // Arrange
      const testKey = HEALTH_CHECK_CONSTANTS.CACHE.TEST_KEY;
      const testValue = HEALTH_CHECK_CONSTANTS.CACHE.TEST_VALUE;
      mockCacheManager.get.mockResolvedValue(testValue);
      mockCacheManager.set.mockResolvedValue(testValue);

      // Act
      const result = await cacheHealthIndicator.isHealthy(key);

      // Assert
      expect(result).toEqual({
        [key]: {
          status: 'up',
          message: HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.HEALTHY,
        },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringMatching(testKey),
        expect.stringMatching(testValue),
        expect.any(Number),
      );
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        expect.stringMatching(testKey),
      );
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should return down status when cache set operation fails', async () => {
      // Arrange
      mockCacheManager.set.mockRejectedValue(new Error('Cache set failed'));

      // Act
      const result = await cacheHealthIndicator.isHealthy(key);

      // Assert
      expect(result[key].status).toBe('down');
      expect(result[key].message).toBe('Cache set failed');
    });

    it('should return down status when cache get operation fails', async () => {
      // Arrange
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockRejectedValue(new Error('Cache get failed'));

      // Act
      const result = await cacheHealthIndicator.isHealthy(key);

      // Assert
      expect(result[key].status).toBe('down');
      expect(result[key].message).toBe('Cache get failed');
    });

    it('should return down status when cache returns wrong value', async () => {
      // Arrange
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('wrong-value');

      // Act
      const result = await cacheHealthIndicator.isHealthy(key);

      // Assert
      expect(result[key].status).toBe('down');
      expect(result[key].message).toBe(
        HEALTH_CHECK_CONSTANTS.CACHE.MESSAGES.VERIFICATION_FAILED,
      );
    });

    it('should return down status when cache delete operation fails', async () => {
      // Arrange
      mockCacheManager.set.mockResolvedValue(HEALTH_CHECK_CONSTANTS.CACHE.TEST_VALUE);
      mockCacheManager.get.mockResolvedValue(HEALTH_CHECK_CONSTANTS.CACHE.TEST_VALUE);
      mockCacheManager.del.mockRejectedValue(new Error('Cache delete failed'));

      // Act
      const result = await cacheHealthIndicator.isHealthy(key);

      // Assert
      expect(result[key].status).toBe('down');
      expect(result[key].message).toBe('Cache delete failed');
    });
  });
});
