export const API_CONSTANTS = {
  /** Global prefix for the API */
  GLOBAL_PREFIX: 'api',
  /** Default version for the API */
  API_DEFAULT_VERSION: '1',

  DOCS: {
    /** Title of the API documentation */
    TITLE: 'Auth API',
    /** Description of the API documentation */
    DESCRIPTION: 'Authentication and authorization API',
    /** Version of the API documentation */
    VERSION: '1.0',
    /** Endpoint for the API documentation */
    ENDPOINT: '/api/v1/docs',
  },
};

export const CACHE_CONSTANTS = {
  /** Time to live for cache items */
  TTL: 36000000, // 1 hour in miliseconds
  /** Maximum number of items in the cache */
  MAX_ITEMS: 1000,
};
