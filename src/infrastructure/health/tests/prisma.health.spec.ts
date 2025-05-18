import { Test, TestingModule } from '@nestjs/testing';
import { HealthIndicatorService } from '@nestjs/terminus';
import { HEALTH_CHECK_CONSTANTS } from '../constants/health.constants';
import { PrismaService } from '../../database/prisma.service';
import { PrismaHealthIndicator } from '../indicators/prisma.health';

describe('PrismaHealthIndicator', () => {
  let indicator: PrismaHealthIndicator;
  let prismaService: PrismaService;
  let healthIndicatorService: HealthIndicatorService;
  const key = HEALTH_CHECK_CONSTANTS.PRISMA.KEY;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: HealthIndicatorService,
          useValue: {
            check: jest.fn().mockReturnValue({
              up: jest.fn().mockReturnValue({ status: 'up' }),
              down: jest.fn().mockReturnValue({ status: 'down' }),
            }),
          },
        },
      ],
    }).compile();

    indicator = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    prismaService = module.get<PrismaService>(PrismaService);
    healthIndicatorService = module.get<HealthIndicatorService>(
      HealthIndicatorService,
    );
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return up status when database is healthy', async () => {
      // Arrange
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValueOnce([{ 1: 1 }]);

      // Act
      const result = await indicator.isHealthy(key);

      // Assert
      expect(prismaService.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining(['SELECT 1']),
      );
      expect(healthIndicatorService.check).toHaveBeenCalledWith(key);
      expect(result).toEqual({ status: 'up' });
    });

    it('should return down status when database check fails', async () => {
      const error = new Error('Database connection failed');
      jest.spyOn(prismaService, '$queryRaw').mockRejectedValueOnce(error);

      const result = await indicator.isHealthy(key);

      expect(prismaService.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining(['SELECT 1']),
      );
      expect(healthIndicatorService.check).toHaveBeenCalledWith(key);
      expect(result).toEqual({ status: 'down' });
    });
  });
});
