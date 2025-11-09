# CargoTracker - Complete Deployment Guide

## Overview

CargoTracker is a modern cargo tracking system built with:
- **Frontend**: Vue.js 3 + Vite + Bootstrap 5
- **Backend**: Node.js + Express + Supabase
- **Database**: Supabase PostgreSQL
- **Cloud Integration**: Yandex Cloud Functions (optional)

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Supabase account (already configured)
- Yandex Cloud account (optional, for cloud deployment)

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://fmumjoaelialoqzsuuyg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_PORT=3001
```

### 3. Start the Application

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
# Terminal 1 - Backend API
npm run server

# Terminal 2 - Frontend
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Database Setup

The database has been automatically configured with the following tables:

### Tables Created:

1. **shipments** - Cargo shipment records
   - id, origin, destination, driver, vehicle, cargo, weight, status
   - created_at, updated_at, synced

2. **drivers** - Driver information
   - id, name, phone, license, status
   - created_at, updated_at

3. **vehicles** - Vehicle fleet
   - id, number, brand, model, type, capacity, year, status
   - created_at, updated_at

### Sample Data:

The database includes sample data:
- 2 drivers (DRV001, DRV002)
- 2 vehicles (VH001, VH002)

### Security:

Row Level Security (RLS) is enabled on all tables with public access policies for the MVP. For production, you should update the policies to restrict access based on authentication.

## API Endpoints

### Shipments
- `GET /api/shipments` - List all shipments
- `POST /api/shipments` - Create new shipment
- `PUT /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment

### Drivers
- `GET /api/drivers` - List all drivers
- `POST /api/drivers` - Create new driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### System
- `GET /api/health` - Health check
- `GET /api/statistics` - Get statistics
- `GET /api/sync/status` - Sync status (always online with Supabase)

## Yandex Cloud Function Deployment

If you want to deploy the API as a Yandex Cloud Function (optional):

### 1. Prerequisites

- Yandex Cloud account with billing enabled
- Yandex CLI (`yc`) installed and configured

### 2. Install Yandex CLI

```bash
# Install Yandex CLI
curl https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Initialize
yc init
```

### 3. Create a Yandex Cloud Function

```bash
# Create folder for your resources (if not exists)
yc resource-manager folder create --name cargotracker

# Get folder ID
FOLDER_ID=$(yc resource-manager folder list --format json | jq -r '.[0].id')

# Create service account for the function
yc iam service-account create --name cargotracker-sa

# Get service account ID
SA_ID=$(yc iam service-account get cargotracker-sa --format json | jq -r '.id')

# Assign role to service account
yc resource-manager folder add-access-binding $FOLDER_ID \
  --role functions.functionInvoker \
  --subject serviceAccount:$SA_ID
```

### 4. Prepare Function Package

```bash
cd cloud-functions
npm install --prefix . --production
zip -r function.zip supabase-function.js supabase-package.json node_modules/
```

### 5. Create and Deploy Function

```bash
# Create function
yc serverless function create --name cargotracker-api

# Get function ID
FUNCTION_ID=$(yc serverless function list --format json | jq -r '.[0].id')

# Deploy function
yc serverless function version create \
  --function-name cargotracker-api \
  --runtime nodejs18 \
  --entrypoint supabase-function.handler \
  --memory 256m \
  --execution-timeout 10s \
  --source-path function.zip \
  --environment SUPABASE_URL=https://fmumjoaelialoqzsuuyg.supabase.co \
  --environment SUPABASE_ANON_KEY=your-anon-key
```

### 6. Make Function Public

```bash
yc serverless function allow-unauthenticated-invoke cargotracker-api
```

### 7. Get Function URL

```bash
yc serverless function get cargotracker-api --format json | jq -r '.http_invoke_url'
```

### 8. Update Frontend Configuration

Update your backend API URL in `config/local-config.js` or create an environment variable:

```env
YC_FUNCTIONS_URL=https://your-function-id.serverless.yandexcloud.net
```

## Testing the Application

### 1. Test Backend API

```bash
# Health check
curl http://localhost:3001/api/health

# Get shipments
curl http://localhost:3001/api/shipments

# Get drivers
curl http://localhost:3001/api/drivers

# Get vehicles
curl http://localhost:3001/api/vehicles

# Get statistics
curl http://localhost:3001/api/statistics
```

### 2. Test Frontend

Open http://localhost:3000 in your browser and:
1. Navigate through all pages (Home, Shipments, Drivers, Vehicles, Statistics)
2. Create a new shipment
3. Edit and delete test data
4. Verify all forms work correctly

### 3. Create Test Shipment

```bash
curl -X POST http://localhost:3001/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Москва",
    "destination": "Санкт-Петербург",
    "driver": "Иванов Иван Иванович",
    "vehicle": "А123ВС77",
    "cargo": "Электроника",
    "weight": 5.5,
    "status": "pending"
  }'
```

## Production Deployment

### Option 1: Traditional Server

1. Build the frontend:
```bash
npm run build
```

2. Deploy `dist` folder to your web server (Nginx, Apache, etc.)

3. Deploy backend:
```bash
# Copy server files
scp -r server/ package.json .env user@yourserver:/app/

# On server
cd /app
npm install --production
node server/supabase-server.js
```

4. Configure reverse proxy (Nginx example):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /var/www/cargotracker/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Cloud Platforms

#### Vercel (Frontend)
```bash
npm install -g vercel
vercel --prod
```

#### Railway (Backend)
1. Create new project on Railway
2. Connect GitHub repository
3. Set environment variables
4. Deploy

#### Heroku (Full Stack)
```bash
heroku create cargotracker
heroku config:set VITE_SUPABASE_URL=your-url
heroku config:set VITE_SUPABASE_ANON_KEY=your-key
git push heroku main
```

## Troubleshooting

### Backend won't start
- Check that port 3001 is available
- Verify Supabase credentials in `.env`
- Check logs: `npm run server`

### Frontend shows errors
- Clear browser cache
- Check browser console for errors
- Verify API is running on port 3001

### Database connection issues
- Verify Supabase URL and key in `.env`
- Check Supabase dashboard for service status
- Test connection: `curl https://fmumjoaelialoqzsuuyg.supabase.co/rest/v1/`

### CORS errors
- Ensure backend is running on correct port
- Check `vite.config.js` proxy configuration
- Verify CORS headers in server

## Security Recommendations for Production

1. **Update RLS Policies**: Replace public policies with authenticated-only access
2. **Use Service Role Key**: For Yandex Cloud Function, use Supabase service role key
3. **Enable Authentication**: Implement Supabase Auth
4. **Add Rate Limiting**: Protect API endpoints
5. **Use HTTPS**: Always use SSL/TLS in production
6. **Environment Variables**: Never commit sensitive keys to Git

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│   Vue.js     │────────▶│   Express   │
│             │         │   Frontend   │         │   Backend   │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         ▼
                        ┌──────────────────────────────────────┐
                        │         Supabase PostgreSQL         │
                        │  - shipments table                  │
                        │  - drivers table                    │
                        │  - vehicles table                   │
                        └──────────────────────────────────────┘
```

## Support

For issues or questions:
1. Check the logs: `npm run server` and browser console
2. Review this guide
3. Check Supabase dashboard for database issues
4. Contact the development team

## Next Steps

1. Customize the UI to match your branding
2. Add authentication with Supabase Auth
3. Implement real-time updates with Supabase Realtime
4. Add file upload for shipment documents
5. Create reports and analytics
6. Deploy to production

Your application is now ready to use!
