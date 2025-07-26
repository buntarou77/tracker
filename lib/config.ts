export const DEFAULT_CONFIG = {
  MONGODB_URI: 'mongodb://localhost:27017',
  MONGODB_DB_NAME: 'users',
  COLLECTION_NAME: 'users',
  REDIS_URL: 'redis://127.0.0.1:6379',
  JWT_SECRET: 'your-development-secret-key',
  JWT_REFRESH_SECRET: 'your-development-refresh-secret',
  BASE_URL: 'http://localhost:3000',
  KONVERT_TOKEN: '46be24096b6927fd6c4bb7cc'
}

export const getConfig = () => ({
  mongodb: {
    uri: process.env.MONGODB_URI || DEFAULT_CONFIG.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME || DEFAULT_CONFIG.MONGODB_DB_NAME,
    collectionName: process.env.COLLECTION_NAME || DEFAULT_CONFIG.COLLECTION_NAME
  },
  redis: {
    url: process.env.REDIS_URL || DEFAULT_CONFIG.REDIS_URL
  },
  jwt: {
    secret: process.env.JWT_SECRET || DEFAULT_CONFIG.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || DEFAULT_CONFIG.JWT_REFRESH_SECRET,
    accessTokenExpires: '15m' as const,
    refreshTokenExpires: '7d' as const
  },
  app: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_CONFIG.BASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  konvert: {
    token: process.env.KONVERT_TOKEN || DEFAULT_CONFIG.KONVERT_TOKEN
  }
})

// Экспортируем конфиг для удобства
export const config = getConfig() 