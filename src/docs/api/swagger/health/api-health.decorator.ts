import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export const API_TAG = 'Health';
export const API_SUMMARY =
  'Check the health status of the application and its dependencies. This endpoint verifies the connectivity and status of various components, including the database, cache, disk space, and memory usage. It returns a detailed report on the health of each component.';
export const API_RESPONSE_200_DESCRIPTION =
  'Application is healthy. The response includes a detailed report on the health of each component, including the database, cache, disk space, and memory usage.';
export const API_RESPONSE_503_DESCRIPTION =
  'One or more services are unhealthy. The response includes a detailed report on the health of each component, including the database, cache, disk space, and memory usage. The status of each component is indicated as "up" or "down", along with any relevant error messages.';
export const API_RESPONSE_200_EXAMPLE = {
  status: 'ok',
  info: {
    database: {
      status: 'up',
      message: 'Prisma connection is healthy',
    },
    disk: { status: 'up' },
    memory: { status: 'up' },
    cache: {
      status: 'up',
      message: 'Cache is healthy',
    },
  },
  error: {},
  details: {
    database: {
      status: 'up',
      message: 'Prisma connection is healthy',
    },
    disk: { status: 'up' },
    memory: { status: 'up' },
    cache: {
      status: 'up',
      message: 'Cache is healthy',
    },
  },
};
export const API_RESPONSE_503_EXAMPLE = {
  status: 'error',
  info: {
    database: {
      status: 'up',
      message: 'Prisma connection is healthy',
    },
    disk: { status: 'up' },
    memory: { status: 'up' },
    cache: {
      status: 'up',
      message: 'Cache is healthy',
    },
  },
  error: {
    cache: {
      status: 'down',
      message: 'Cache health check failed',
    },
  },
  details: {
    database: {
      status: 'up',
      message: 'Prisma connection is healthy',
    },
    disk: { status: 'up' },
    memory: { status: 'up' },
    cache: {
      status: 'down',
      message: 'Cache health check failed',
    },
  },
};

export function ApiTag() {
  return applyDecorators(ApiTags(API_TAG));
}

export function ApiHealthCheck() {
  return applyDecorators(
    ApiOperation({
      summary: API_SUMMARY,
    }),
    ApiResponse({
      status: 200,
      description: API_RESPONSE_200_DESCRIPTION,
      schema: {
        example: API_RESPONSE_200_EXAMPLE,
      },
    }),
    ApiResponse({
      status: 503,
      description: API_RESPONSE_503_DESCRIPTION,
      schema: {
        example: API_RESPONSE_503_EXAMPLE,
      },
    }),
  );
}
