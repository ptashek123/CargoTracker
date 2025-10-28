-- Initial database schema for CargoTracker Local
-- SQLite version

-- Таблица грузоперевозок
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  driver TEXT,
  vehicle TEXT,
  cargo TEXT,
  weight REAL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0
);

-- Таблица отложенных операций (для оффлайн режима)
CREATE TABLE IF NOT EXISTS pending_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0
);

-- Таблица водителей
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица транспортных средств
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица маршрутов
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  distance REAL,
  estimated_time INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_synced ON shipments(synced);
CREATE INDEX IF NOT EXISTS idx_pending_retry ON pending_operations(retry_count);
CREATE INDEX IF NOT EXISTS idx_drivers_created ON drivers(created_at);
CREATE INDEX IF NOT EXISTS idx_vehicles_created ON vehicles(created_at);

-- Вставка тестовых данных (опционально)
INSERT OR IGNORE INTO drivers (id, data) VALUES
  ('DRV001', '{"name":"Иванов Иван Иванович","phone":"+7 (999) 123-45-67","license":"AB123456","status":"active"}'),
  ('DRV002', '{"name":"Петров Петр Петрович","phone":"+7 (999) 765-43-21","license":"CD789012","status":"active"}');

INSERT OR IGNORE INTO vehicles (id, data) VALUES
  ('VH001', '{"number":"А123ВС77","brand":"КАМАЗ","model":"5490","type":"truck","capacity":20.0,"year":2021,"status":"available"}'),
  ('VH002', '{"number":"М456НР99","brand":"MAN","model":"TGX","type":"semi","capacity":25.0,"year":2022,"status":"available"}');
