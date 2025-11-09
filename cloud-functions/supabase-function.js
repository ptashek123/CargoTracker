const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports.handler = async function (event, context) {
  console.log('Event:', JSON.stringify(event));

  let path = event.path || event.url || '/';
  const method = event.httpMethod || event.method || 'GET';

  if (path.includes('?')) path = path.split('?')[0];

  if (method === 'GET' && event.queryStringParameters && event.queryStringParameters.path) {
    path = event.queryStringParameters.path;
  }

  console.log('Parsed path:', path, 'method:', method);

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (path === '/health') {
      return success({ status: 'ok', timestamp: new Date().toISOString() }, corsHeaders);
    }

    if (path === '/shipments' && method === 'GET') {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return success(data || [], corsHeaders);
    }

    if (path === '/shipments' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const shipmentId = 'SHIP-' + Date.now();

      const shipmentData = {
        id: shipmentId,
        origin: body.origin,
        destination: body.destination,
        driver: body.driver || null,
        vehicle: body.vehicle || null,
        cargo: body.cargo,
        weight: body.weight,
        status: body.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('shipments')
        .insert([shipmentData])
        .select()
        .single();

      if (error) throw error;
      return created(data, corsHeaders);
    }

    if (path.match(/^\/shipments\/[^/]+$/) && method === 'GET') {
      const id = path.split('/')[2];
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return notFound('Shipment not found', corsHeaders);
      return success(data, corsHeaders);
    }

    if (path.match(/^\/shipments\/[^/]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const body = JSON.parse(event.body || '{}');
      const updates = {
        ...body,
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
      if (!data) return notFound('Shipment not found', corsHeaders);
      return success(data, corsHeaders);
    }

    if (path.match(/^\/shipments\/[^/]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return success({ message: 'Shipment deleted', id }, corsHeaders);
    }

    if (path === '/statistics' && method === 'GET') {
      const { data, error } = await supabase
        .from('shipments')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(s => s.status === 'active' || s.status === 'in_transit').length,
        completed: data.filter(s => s.status === 'completed').length,
        pending: data.filter(s => s.status === 'pending').length
      };

      return success(stats, corsHeaders);
    }

    return notFound('Route not found', corsHeaders);

  } catch (error) {
    console.error('Error:', error);
    return serverError(error.message, corsHeaders);
  }
};

function success(data, headers) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data)
  };
}

function created(data, headers) {
  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(data)
  };
}

function notFound(message, headers) {
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: message })
  };
}

function serverError(message, headers) {
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: message })
  };
}
