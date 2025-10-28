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
  name TEXT NOT NULL,
  phone TEXT,
  license TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица транспортных средств
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  type TEXT,
  capacity REAL,
  year INTEGER,
  status TEXT DEFAULT 'available',
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
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Вставка тестовых данных (опционально)
INSERT OR IGNORE INTO drivers (id, name, phone, license) VALUES
  ('DRV001', 'Иванов Иван Иванович', '+7 (999) 123-45-67', 'AB123456'),
  ('DRV002', 'Петров Петр Петрович', '+7 (999) 765-43-21', 'CD789012');

INSERT OR IGNORE INTO vehicles (id, number, brand, model, type, capacity, year) VALUES
  ('VH001', 'А123ВС77', 'КАМАЗ', '5490', 'truck', 20.0, 2021),
  ('VH002', 'М456НР99', 'MAN', 'TGX', 'semi', 25.0, 2022);
