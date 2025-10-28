import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Yandex Cloud endpoints
  YC_FUNCTIONS_URL: process.env.YC_FUNCTIONS_URL || 'https://functions.yandexcloud.net/your-function-id',
  YC_QUEUE_URL: process.env.YC_QUEUE_URL || 'https://message-queue.yandexcloud.net/your-queue',
  YC_DB_HOST: process.env.YC_DB_HOST || 'your-postgres-host.yandex.cloud',
  YC_DB_PORT: process.env.YC_DB_PORT || 6432,
  YC_DB_NAME: process.env.YC_DB_NAME || 'cargotracker',
  YC_DB_USER: process.env.YC_DB_USER || 'cargotracker_user',
  YC_DB_PASSWORD: process.env.YC_DB_PASSWORD || '',
  YC_OBJECT_STORAGE: process.env.YC_OBJECT_STORAGE || 'https://storage.yandexcloud.net/your-bucket',
  YC_ACCESS_KEY_ID: process.env.YC_ACCESS_KEY_ID || '',
  YC_SECRET_ACCESS_KEY: process.env.YC_SECRET_ACCESS_KEY || '',
  YC_LOCKBOX_SECRET_ID: process.env.YC_LOCKBOX_SECRET_ID || '',
  
  // Lockbox secrets (загружаются при старте приложения)
  secrets: {
    dbPassword: null,
    apiKeys: null,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key'
  },
  
  // Локальные настройки
  LOCAL_PORT: process.env.LOCAL_PORT || 3000,
  API_PORT: process.env.API_PORT || 3001,
  OFFLINE_CACHE_TTL: parseInt(process.env.OFFLINE_CACHE_TTL) || 24 * 60 * 60 * 1000, // 24 часа
  SYNC_INTERVAL: parseInt(process.env.SYNC_INTERVAL) || 5 * 60 * 1000, // 5 минут
  
  // Database settings
  DB_PATH: './database/local-cache.db',
  
  // API settings
  API_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3
};

export default config;
