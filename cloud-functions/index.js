/**
 * Yandex Cloud Function для CargoTracker
 * 
 * Обрабатывает API запросы для управления грузоперевозками
 */

const { Client } = require('pg');

// Подключение к PostgreSQL
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 6432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

/**
 * Главный обработчик функции
 */
module.exports.handler = async function (event, context) {
  console.log('Event:', JSON.stringify(event));
  
  // Handle Yandex Cloud Function HTTP API format
  let path = event.path || event.url || '/';
  const method = event.httpMethod || event.method || 'GET';
  
  // Remove query params
  if (path.includes('?')) path = path.split('?')[0];
  
  // Parse path from query params if it's in the query string (for GET requests)
  if (method === 'GET' && event.queryStringParameters && event.queryStringParameters.path) {
    path = event.queryStringParameters.path;
  }
  
  console.log('Parsed path:', path, 'method:', method);
  
  try {
    // Роутинг запросов
    if (path === '/health') {
      return success({ status: 'ok', timestamp: new Date().toISOString() });
    }
    
    if (path === '/shipments' && method === 'GET') {
      return await getShipments();
    }
    
    if (path === '/shipments' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      return await createShipment(body);
    }
    
    if (path.match(/^\/shipments\/[^/]+$/) && method === 'GET') {
      const id = path.split('/')[2];
      return await getShipment(id);
    }
    
    if (path.match(/^\/shipments\/[^/]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const body = JSON.parse(event.body || '{}');
      return await updateShipment(id, body);
    }
    
    if (path.match(/^\/shipments\/[^/]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      return await deleteShipment(id);
    }
    
    if (path === '/statistics' && method === 'GET') {
      return await getStatistics();
    }
    
    return notFound('Route not found');
    
  } catch (error) {
    console.error('Error:', error);
    return serverError(error.message);
  }
};

/**
 * Получить список всех грузоперевозок
 */
async function getShipments() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM shipments ORDER BY created_at DESC LIMIT 100'
    );
    
    return success(result.rows);
    
  } finally {
    await client.end();
  }
}

/**
 * Получить одну грузоперевозку
 */
async function getShipment(id) {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM shipments WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return notFound('Shipment not found');
    }
    
    return success(result.rows[0]);
    
  } finally {
    await client.end();
  }
}

/**
 * Создать новую грузоперевозку
 */
async function createShipment(data) {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const id = 'SHIP-' + Date.now();
    const now = new Date().toISOString();
    
    const result = await client.query(
      `INSERT INTO shipments 
       (id, origin, destination, driver, vehicle, cargo, weight, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        data.origin,
        data.destination,
        data.driver || null,
        data.vehicle || null,
        data.cargo,
        data.weight,
        data.status || 'pending',
        now,
        now
      ]
    );
    
    // Отправка события в Message Queue
    await sendEventToQueue('shipment_created', result.rows[0]);
    
    return created(result.rows[0]);
    
  } finally {
    await client.end();
  }
}

/**
 * Обновить грузоперевозку
 */
async function updateShipment(id, data) {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const now = new Date().toISOString();
    
    const result = await client.query(
      `UPDATE shipments 
       SET origin = COALESCE($2, origin),
           destination = COALESCE($3, destination),
           driver = COALESCE($4, driver),
           vehicle = COALESCE($5, vehicle),
           cargo = COALESCE($6, cargo),
           weight = COALESCE($7, weight),
           status = COALESCE($8, status),
           updated_at = $9
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.origin,
        data.destination,
        data.driver,
        data.vehicle,
        data.cargo,
        data.weight,
        data.status,
        now
      ]
    );
    
    if (result.rows.length === 0) {
      return notFound('Shipment not found');
    }
    
    // Отправка события в Message Queue
    await sendEventToQueue('shipment_updated', result.rows[0]);
    
    return success(result.rows[0]);
    
  } finally {
    await client.end();
  }
}

/**
 * Удалить грузоперевозку
 */
async function deleteShipment(id) {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(
      'DELETE FROM shipments WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return notFound('Shipment not found');
    }
    
    // Отправка события в Message Queue
    await sendEventToQueue('shipment_deleted', { id });
    
    return success({ message: 'Shipment deleted', id });
    
  } finally {
    await client.end();
  }
}

/**
 * Получить статистику
 */
async function getStatistics() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('active', 'in_transit')) as active,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM shipments
    `);
    
    return success(result.rows[0]);
    
  } finally {
    await client.end();
  }
}

/**
 * Отправить событие в Message Queue
 */
async function sendEventToQueue(eventType, data) {
  // Примечание: требует настройки AWS SDK для Yandex Message Queue
  try {
    console.log('Event sent to queue:', eventType, data);
    // Реализация отправки в очередь
  } catch (error) {
    console.error('Failed to send event to queue:', error);
  }
}

/**
 * Вспомогательные функции для ответов
 */
function success(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
}

function created(data) {
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
}

function notFound(message) {
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: message })
  };
}

function serverError(message) {
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: message })
  };
}
