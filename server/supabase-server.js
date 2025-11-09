import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('shipments').select('count', { count: 'exact', head: true });
    res.json({
      status: 'ok',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'ok',
      database: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/shipments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shipments', async (req, res) => {
  try {
    const shipmentId = 'SHIP-' + Date.now();
    const shipmentData = {
      id: shipmentId,
      origin: req.body.origin,
      destination: req.body.destination,
      driver: req.body.driver || null,
      vehicle: req.body.vehicle || null,
      cargo: req.body.cargo,
      weight: req.body.weight,
      status: req.body.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('shipments')
      .insert([shipmentData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Shipment deleted successfully', id });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drivers', async (req, res) => {
  try {
    const driverId = 'DRV' + Date.now();
    const driverData = {
      id: driverId,
      name: req.body.name,
      phone: req.body.phone,
      license: req.body.license,
      status: req.body.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicleId = 'VH' + Date.now();
    const vehicleData = {
      id: vehicleId,
      number: req.body.number,
      brand: req.body.brand,
      model: req.body.model,
      type: req.body.type || 'truck',
      capacity: req.body.capacity,
      year: req.body.year,
      status: req.body.status || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('status');

    if (error) throw error;

    const stats = {
      total: shipments.length,
      active: shipments.filter(s => s.status === 'active' || s.status === 'in_transit').length,
      completed: shipments.filter(s => s.status === 'completed').length,
      pending: shipments.filter(s => s.status === 'pending').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sync/status', async (req, res) => {
  try {
    const { error } = await supabase.from('shipments').select('count', { count: 'exact', head: true });

    res.json({
      cloudOnline: !error,
      pendingOperations: 0,
      unsyncedRecords: 0,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      cloudOnline: false,
      pendingOperations: 0,
      unsyncedRecords: 0,
      lastCheck: new Date().toISOString()
    });
  }
});

app.post('/api/sync/force', async (req, res) => {
  res.json({
    status: 'success',
    message: 'Using Supabase - always in sync'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 CargoTracker API Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: Supabase`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}\n`);
});

export default app;
