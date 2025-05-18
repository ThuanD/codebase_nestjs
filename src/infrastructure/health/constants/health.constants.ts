/**
 * Constants used across health check modules
 */
export const HEALTH_CHECK_CONSTANTS = {
  PRISMA: {
    /** Default key for database health checks */
    KEY: 'database',
    MESSAGES: {
      /** Message when Prisma connection is successful */
      HEALTHY: 'Database connection is healthy',
      /** Message when Prisma connection fails */
      FAILED: 'Database connection failed',
    },
    QUERIES: {
      /** Simple query to test database connectivity */
      PING: 'SELECT 1',
    },
  },
  CACHE: {
    /** Default key for cache health checks */
    KEY: 'cache',
    /** Default TTL for cache test (in seconds) */
    TTL: 5,
    /** Test key used for cache health check */
    TEST_KEY: 'health_check_test',
    /** Test value used for cache health check */
    TEST_VALUE: 'test_value',
    MESSAGES: {
      /** Message when cache is working properly */
      HEALTHY: 'Cache is healthy',
      /** Message when cache is down */
      FAILED: 'Cache health check failed',
      /** Message when cache verification fails */
      VERIFICATION_FAILED: 'Cache set/get verification failed',
    },
  },
  DISK: {
    /** Default key for disk health checks */
    KEY: 'disk',
    /** Default threshold for disk space (in percent) */
    THRESHOLD: 0.9, // 90% of disk space
    MESSAGES: {
      /** Message when disk space is sufficient */
      HEALTHY: 'Disk is healthy',
      /** Message when disk space is low */
      LOW_SPACE: 'Disk storage threshold exceeded',
    },
  },
  MEMORY: {
    /** Default key for memory health checks */
    KEY: 'memory',
    /** Default threshold for memory heap (in bytes) */
    THRESHOLD: 300 * 1024 * 1024, // 300 MB
    MESSAGES: {
      /** Message when memory heap is sufficient */
      HEALTHY: 'Memory is healthy',
      /** Message when memory heap is low */
      LOW_HEAP: 'Memory heap threshold exceeded',
    },
  },
};
