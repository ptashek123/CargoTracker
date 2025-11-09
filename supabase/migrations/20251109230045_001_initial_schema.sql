/*
  # Initial Database Schema for CargoTracker

  1. New Tables
    - `shipments`
      - `id` (text, primary key) - Unique shipment identifier
      - `origin` (text) - Origin location
      - `destination` (text) - Destination location
      - `driver` (text, nullable) - Assigned driver name
      - `vehicle` (text, nullable) - Assigned vehicle number
      - `cargo` (text) - Cargo description
      - `weight` (numeric) - Weight in tons
      - `status` (text) - Shipment status (pending, active, in_transit, completed, cancelled)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `synced` (boolean) - Sync status flag

    - `drivers`
      - `id` (text, primary key) - Unique driver identifier
      - `name` (text) - Driver full name
      - `phone` (text) - Contact phone
      - `license` (text) - License number
      - `status` (text) - Driver status (active, inactive)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `vehicles`
      - `id` (text, primary key) - Unique vehicle identifier
      - `number` (text) - Registration number
      - `brand` (text) - Vehicle brand
      - `model` (text) - Vehicle model
      - `type` (text) - Vehicle type (truck, van, semi, container)
      - `capacity` (numeric) - Capacity in tons
      - `year` (integer) - Manufacturing year
      - `status` (text) - Vehicle status (available, in_use, maintenance)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (simplified for MVP)
    
  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  driver TEXT,
  vehicle TEXT,
  cargo TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced BOOLEAN DEFAULT true
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'truck',
  capacity NUMERIC NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Enable Row Level Security
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (simplified for MVP - allows all operations)
CREATE POLICY "Allow public read access on shipments"
  ON shipments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on shipments"
  ON shipments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on shipments"
  ON shipments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on shipments"
  ON shipments FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on drivers"
  ON drivers FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on drivers"
  ON drivers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on drivers"
  ON drivers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on drivers"
  ON drivers FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on vehicles"
  ON vehicles FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on vehicles"
  ON vehicles FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on vehicles"
  ON vehicles FOR DELETE
  USING (true);

-- Insert sample data
INSERT INTO drivers (id, name, phone, license, status) VALUES
  ('DRV001', 'Иванов Иван Иванович', '+7 (999) 123-45-67', 'AB123456', 'active'),
  ('DRV002', 'Петров Петр Петрович', '+7 (999) 765-43-21', 'CD789012', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, number, brand, model, type, capacity, year, status) VALUES
  ('VH001', 'А123ВС77', 'КАМАЗ', '5490', 'truck', 20.0, 2021, 'available'),
  ('VH002', 'М456НР99', 'MAN', 'TGX', 'semi', 25.0, 2022, 'available')
ON CONFLICT (id) DO NOTHING;
