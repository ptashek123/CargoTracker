import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import config from '../config/local-config.js';
import AWS from 'aws-sdk';

const app = express();
const db = new sqlite3.Database(config.DB_PATH);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // для разработки
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Утилиты для работы с БД
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Middleware для проверки статуса подключения к облаку
let cloudStatus = { online: true, lastCheck: new Date() };

async function checkCloudConnection() {
  try {
    // Try basic URL - any response means function is online
    await axios.get(config.YC_FUNCTIONS_URL, { timeout: 5000 });
    cloudStatus = { online: true, lastCheck: new Date() };
    console.log('✅ Cloud connection OK');
  } catch (error) {
    // If it's a 404 or any HTTP error, the function IS responding, so it's online
    if (error.response) {
      cloudStatus = { online: true, lastCheck: new Date() };
      console.log('✅ Cloud connection OK (function responding with HTTP', error.response.status, ')');
    } else {
      // Only mark offline on network errors (timeout, connection refused, etc.)
      cloudStatus = { online: false, lastCheck: new Date() };
      console.log('❌ Cloud connection failed:', error.message);
    }
  }
}

// Проверка подключения каждые 30 секунд
setInterval(checkCloudConnection, 30000);

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cloudStatus: cloudStatus,
    timestamp: new Date()
  });
});

// Получить список грузоперевозок
app.get('/api/shipments', async (req, res) => {
  try {
    if (cloudStatus.online) {
      const response = await axios.get(`${config.YC_FUNCTIONS_URL}/shipments`, {
        timeout: config.API_TIMEOUT
      });
      
      // Кэшируем данные
      for (const shipment of response.data) {
        await dbRun(
          'INSERT OR REPLACE INTO shipments (id, data, synced) VALUES (?, ?, 1)',
          [shipment.id, JSON.stringify(shipment)]
        );
      }
      
      res.json(response.data);
    } else {
      // Оффлайн: возвращаем из кэша
      const cached = await dbAll('SELECT data FROM shipments ORDER BY updated_at DESC');
      res.json({
        data: cached.map(row => JSON.parse(row.data)),
        offline: true
      });
    }
  } catch (error) {
    console.error('Error fetching shipments:', error.message);
    
    // Fallback к кэшу
    const cached = await dbAll('SELECT data FROM shipments ORDER BY updated_at DESC');
    res.json({
      data: cached.map(row => JSON.parse(row.data)),
      offline: true,
      error: error.message
    });
  }
});

// Создать новую грузоперевозку
app.post('/api/shipments', async (req, res) => {
  try {
    if (cloudStatus.online && config.YC_FUNCTIONS_URL !== 'https://functions.yandexcloud.net/your-function-id') {
      // Try to sync with cloud
      try {
        const response = await axios.post(
          `${config.YC_FUNCTIONS_URL}/shipments`,
          req.body,
          { timeout: config.API_TIMEOUT }
        );
        
        // Кэшируем созданную грузоперевозку
        await dbRun(
          'INSERT OR REPLACE INTO shipments (id, data, synced) VALUES (?, ?, 1)',
          [response.data.id, JSON.stringify(response.data)]
        );
        
        res.json(response.data);
        return;
      } catch (cloudError) {
        console.log('Cloud sync failed, using local storage:', cloudError.message);
      }
    }
    
    // Fallback to local storage
    const shipId = 'SHIP-' + Date.now();
    const shipmentData = { id: shipId, ...req.body, createdAt: new Date().toISOString() };
    
    await dbRun(
      'INSERT INTO pending_operations (type, data) VALUES (?, ?)',
      ['create_shipment', JSON.stringify(shipmentData)]
    );
    
    // Сохраняем в локальном кэше
    await dbRun(
      'INSERT OR REPLACE INTO shipments (id, data, synced) VALUES (?, ?, 0)',
      [shipId, JSON.stringify(shipmentData)]
    );
    
    res.json({
      ...shipmentData,
      status: 'queued',
      message: 'Operation queued for synchronization',
      offline: true
    });
  } catch (error) {
    console.error('Error creating shipment:', error.message);
    
    // При ошибке также сохраняем с нормальным ID
    const shipId = 'SHIP-' + Date.now();
    const shipmentData = { id: shipId, ...req.body, createdAt: new Date().toISOString() };
    
    await dbRun(
      'INSERT INTO pending_operations (type, data) VALUES (?, ?)',
      ['create_shipment', JSON.stringify(shipmentData)]
    );
    
    // Сохраняем в локальном кэше
    await dbRun(
      'INSERT OR REPLACE INTO shipments (id, data, synced) VALUES (?, ?, 0)',
      [shipId, JSON.stringify(shipmentData)]
    );
    
    res.status(202).json({
      ...shipmentData,
      status: 'queued',
      message: 'Operation queued due to error',
      offline: true
    });
  }
});

// Обновить грузоперевозку
app.put('/api/shipments/:id', async (req, res) => {
  try {
    if (cloudStatus.online) {
      const response = await axios.put(
        `${config.YC_FUNCTIONS_URL}/shipments/${req.params.id}`,
        req.body,
        { timeout: config.API_TIMEOUT }
      );
      
      await dbRun(
        'INSERT OR REPLACE INTO shipments (id, data, synced) VALUES (?, ?, 1)',
        [req.params.id, JSON.stringify(response.data)]
      );
      
      res.json(response.data);
    } else {
      await dbRun(
        'INSERT INTO pending_operations (type, data) VALUES (?, ?)',
        ['update_shipment', JSON.stringify({ id: req.params.id, ...req.body })]
      );
      
      res.json({
        status: 'queued',
        message: 'Update queued for synchronization',
        offline: true
      });
    }
  } catch (error) {
    console.error('Error updating shipment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Получить статистику
app.get('/api/statistics', async (req, res) => {
  try {
    if (cloudStatus.online) {
      const response = await axios.get(`${config.YC_FUNCTIONS_URL}/statistics`, {
        timeout: config.API_TIMEOUT
      });
      res.json(response.data);
    } else {
      // Простая статистика из локального кэша
      const shipments = await dbAll('SELECT data FROM shipments');
      res.json({
        total: shipments.length,
        offline: true,
        message: 'Statistics from local cache'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить статус синхронизации
app.get('/api/sync/status', async (req, res) => {
  try {
    const pending = await dbAll('SELECT COUNT(*) as count FROM pending_operations');
    const unsynced = await dbAll('SELECT COUNT(*) as count FROM shipments WHERE synced = 0');
    
    res.json({
      cloudOnline: cloudStatus.online,
      pendingOperations: pending[0].count,
      unsyncedRecords: unsynced[0].count,
      lastCheck: cloudStatus.lastCheck
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Принудительная синхронизация
app.post('/api/sync/force', async (req, res) => {
  try {
    await syncPendingOperations();
    res.json({ status: 'success', message: 'Synchronization completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// OBJECT STORAGE UPLOAD (Yandex Object Storage via S3 API)
// ============================================

// Initialize S3 client if creds are provided
let s3Client = null;
if (config.YC_ACCESS_KEY_ID && config.YC_SECRET_ACCESS_KEY) {
  s3Client = new AWS.S3({
    endpoint: 'https://storage.yandexcloud.net',
    region: 'ru-central1',
    accessKeyId: config.YC_ACCESS_KEY_ID,
    secretAccessKey: config.YC_SECRET_ACCESS_KEY,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  });
}

// Expects JSON: { bucket: 'cargotracker-documents', key: 'path/name.ext', contentBase64: '...', contentType?: '...' }
app.post('/api/upload', async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(400).json({ error: 'Object Storage credentials are not configured' });
    }

    const { bucket, key, contentBase64, contentType } = req.body || {};
    if (!bucket || !key || !contentBase64) {
      return res.status(400).json({ error: 'bucket, key and contentBase64 are required' });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    await s3Client
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream'
      })
      .promise();

    const publicUrl = `${config.YC_OBJECT_STORAGE.replace(/\/$/, '')}/${encodeURIComponent(key)}`;
    res.json({ status: 'ok', url: publicUrl });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DRIVERS API
// ============================================

app.get('/api/drivers', async (req, res) => {
  try {
    const cached = await dbAll('SELECT data FROM drivers ORDER BY updated_at DESC');
    res.json(cached.map(row => JSON.parse(row.data)));
  } catch (error) {
    console.error('Error fetching drivers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/drivers/:id', async (req, res) => {
  try {
    const driverData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    await dbRun(
      'UPDATE drivers SET data = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(driverData), driverData.updated_at, req.params.id]
    );
    
    res.json({ id: req.params.id, ...driverData });
  } catch (error) {
    console.error('Error updating driver:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/drivers/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// VEHICLES API
// ============================================

app.get('/api/vehicles', async (req, res) => {
  try {
    const cached = await dbAll('SELECT data FROM vehicles ORDER BY updated_at DESC');
    res.json(cached.map(row => JSON.parse(row.data)));
  } catch (error) {
    console.error('Error fetching vehicles:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    await dbRun(
      'UPDATE vehicles SET data = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(vehicleData), vehicleData.updated_at, req.params.id]
    );
    
    res.json({ id: req.params.id, ...vehicleData });
  } catch (error) {
    console.error('Error updating vehicle:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ФОНОВАЯ СИНХРОНИЗАЦИЯ
// ============================================

async function syncPendingOperations() {
  if (!cloudStatus.online) {
    console.log('⏸️  Sync paused: cloud offline');
    return;
  }
  
  try {
    const pending = await dbAll('SELECT * FROM pending_operations LIMIT 10');
    
    if (pending.length === 0) return;
    
    console.log(`🔄 Syncing ${pending.length} pending operations...`);
    
    for (const op of pending) {
      try {
        const data = JSON.parse(op.data);
        
        switch (op.type) {
          case 'create_shipment':
            await axios.post(`${config.YC_FUNCTIONS_URL}/shipments`, data);
            break;
          case 'update_shipment':
            await axios.put(`${config.YC_FUNCTIONS_URL}/shipments/${data.id}`, data);
            break;
        }
        
        // Удаляем успешно синхронизированную операцию
        await dbRun('DELETE FROM pending_operations WHERE id = ?', [op.id]);
        console.log(`✅ Synced operation ${op.id}`);
        
      } catch (error) {
        console.error(`❌ Failed to sync operation ${op.id}:`, error.message);
        
        // Увеличиваем счётчик попыток
        await dbRun(
          'UPDATE pending_operations SET retry_count = retry_count + 1 WHERE id = ?',
          [op.id]
        );
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Запуск фоновой синхронизации каждые 5 минут
cron.schedule('*/5 * * * *', syncPendingOperations);

// Запуск сервера
app.listen(config.API_PORT, () => {
  console.log(`\n🚀 CargoTracker Local API Server running on http://localhost:${config.API_PORT}`);
  console.log(`📊 Status: ${cloudStatus.online ? 'Online' : 'Offline'} mode`);
  console.log(`🔄 Sync interval: ${config.SYNC_INTERVAL / 1000}s\n`);
  
  // Первоначальная проверка подключения
  checkCloudConnection();
});

export default app;
