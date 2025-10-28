import sqlite3 from 'sqlite3';
import axios from 'axios';
import config from '../config/local-config.js';

class SyncManager {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
    this.isSyncing = false;
    this.lastSyncTime = null;
  }

  async dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async checkCloudAvailability() {
    try {
      await axios.get(`${config.YC_FUNCTIONS_URL}/health`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async syncAll() {
    if (this.isSyncing) {
      console.log('⏸️  Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    console.log('\n🔄 Starting synchronization...');

    try {
      const isOnline = await this.checkCloudAvailability();
      
      if (!isOnline) {
        console.log('❌ Cloud is offline, sync aborted');
        return;
      }

      await this.syncPendingOperations();
      await this.syncUnsyncedRecords();
      
      this.lastSyncTime = new Date();
      console.log(`✅ Synchronization completed at ${this.lastSyncTime.toISOString()}\n`);
      
    } catch (error) {
      console.error('❌ Synchronization failed:', error.message);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncPendingOperations() {
    const pending = await this.dbAll(
      'SELECT * FROM pending_operations WHERE retry_count < ? ORDER BY created_at ASC',
      [config.MAX_RETRIES]
    );

    if (pending.length === 0) {
      console.log('✓ No pending operations to sync');
      return;
    }

    console.log(`📤 Syncing ${pending.length} pending operations...`);

    for (const op of pending) {
      try {
        const data = JSON.parse(op.data);
        let response;

        switch (op.type) {
          case 'create_shipment':
            response = await axios.post(`${config.YC_FUNCTIONS_URL}/shipments`, data, {
              timeout: config.API_TIMEOUT
            });
            
            // Обновляем временный ID на реальный
            if (data.tempId) {
              await this.dbRun(
                'UPDATE shipments SET id = ?, data = ?, synced = 1 WHERE id = ?',
                [response.data.id, JSON.stringify(response.data), data.tempId]
              );
            }
            break;

          case 'update_shipment':
            response = await axios.put(
              `${config.YC_FUNCTIONS_URL}/shipments/${data.id}`,
              data,
              { timeout: config.API_TIMEOUT }
            );
            
            await this.dbRun(
              'UPDATE shipments SET data = ?, synced = 1 WHERE id = ?',
              [JSON.stringify(response.data), data.id]
            );
            break;

          case 'delete_shipment':
            await axios.delete(`${config.YC_FUNCTIONS_URL}/shipments/${data.id}`, {
              timeout: config.API_TIMEOUT
            });
            
            await this.dbRun('DELETE FROM shipments WHERE id = ?', [data.id]);
            break;
        }

        // Удаляем успешно синхронизированную операцию
        await this.dbRun('DELETE FROM pending_operations WHERE id = ?', [op.id]);
        console.log(`  ✓ Synced: ${op.type} (ID: ${op.id})`);

      } catch (error) {
        console.error(`  ✗ Failed: ${op.type} (ID: ${op.id}) - ${error.message}`);
        
        // Увеличиваем счётчик попыток
        await this.dbRun(
          'UPDATE pending_operations SET retry_count = retry_count + 1 WHERE id = ?',
          [op.id]
        );
      }
    }
  }

  async syncUnsyncedRecords() {
    const unsynced = await this.dbAll(
      'SELECT * FROM shipments WHERE synced = 0 LIMIT 20'
    );

    if (unsynced.length === 0) {
      console.log('✓ No unsynced records');
      return;
    }

    console.log(`📤 Syncing ${unsynced.length} unsynced records...`);

    for (const record of unsynced) {
      try {
        const data = JSON.parse(record.data);
        
        const response = await axios.post(
          `${config.YC_FUNCTIONS_URL}/shipments`,
          data,
          { timeout: config.API_TIMEOUT }
        );

        await this.dbRun(
          'UPDATE shipments SET id = ?, data = ?, synced = 1 WHERE id = ?',
          [response.data.id, JSON.stringify(response.data), record.id]
        );

        console.log(`  ✓ Synced record: ${record.id}`);

      } catch (error) {
        console.error(`  ✗ Failed to sync record ${record.id}: ${error.message}`);
      }
    }
  }

  async getSyncStatus() {
    const pending = await this.dbAll('SELECT COUNT(*) as count FROM pending_operations');
    const unsynced = await this.dbAll('SELECT COUNT(*) as count FROM shipments WHERE synced = 0');
    const isOnline = await this.checkCloudAvailability();

    return {
      cloudOnline: isOnline,
      pendingOperations: pending[0].count,
      unsyncedRecords: unsynced[0].count,
      lastSyncTime: this.lastSyncTime,
      isSyncing: this.isSyncing
    };
  }

  close() {
    this.db.close();
  }
}

export default SyncManager;
