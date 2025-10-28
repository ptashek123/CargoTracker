import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/local-cache.db');
const runAsync = promisify(db.run.bind(db));

async function setupDatabase() {
  console.log('🗄️  Setting up local SQLite database...');
  
  try {
    // Таблица для кэширования грузоперевозок
    await runAsync(`
      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      )
    `);
    
    // Таблица для отложенных операций (оффлайн режим)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS pending_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0
      )
    `);
    
    // Таблица для водителей
    await runAsync(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Таблица для транспортных средств
    await runAsync(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Таблица для маршрутов
    await runAsync(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Индексы для оптимизации
    await runAsync(`CREATE INDEX IF NOT EXISTS idx_shipments_synced ON shipments(synced)`);
    await runAsync(`CREATE INDEX IF NOT EXISTS idx_pending_retry ON pending_operations(retry_count)`);
    
    console.log('✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    db.close();
  }
}

setupDatabase().catch(console.error);
