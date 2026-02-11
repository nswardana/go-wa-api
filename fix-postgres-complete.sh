#!/bin/bash

# Fix PostgreSQL Container - Complete Reset
# Reset PostgreSQL container with proper setup

echo "🔧 Fixing PostgreSQL Container Problem"
echo "===================================="

echo ""
echo "🛑 Stopping and removing PostgreSQL container..."

# Stop and remove container
docker stop chatflow-postgres 2>/dev/null
docker rm chatflow-postgres 2>/dev/null

echo ""
echo "🗑️ Removing volume (fresh start)..."

# Remove volume to start fresh
docker volume rm postgres_data 2>/dev/null

echo ""
echo "🐳 Starting PostgreSQL container..."

# Start PostgreSQL container with proper initialization
docker-compose up -d postgres

echo ""
echo "⏳ Waiting for PostgreSQL to initialize..."
sleep 15

echo ""
echo "🔍 Checking container status..."
docker ps | grep postgres

echo ""
echo "📊 Creating database and user..."

# Wait for container to be ready and create user/database
echo "Attempting to connect as default user..."

# Try different approaches to create user
echo "Method 1: Connect as default user..."
docker exec chatflow-postgres psql -U postgres -c "\du" 2>/dev/null || echo "Postgres user not available"

echo ""
echo "Method 2: Check environment variables..."
docker exec chatflow-postgres printenv | grep POSTGRES

echo ""
echo "Method 3: Try creating user with different approach..."
docker exec chatflow-postgres bash -c "
psql -c 'CREATE USER chatflow_user WITH PASSWORD \"Bismillah313!\";' || echo 'User creation failed'
psql -c 'CREATE DATABASE chatflow_api;' || echo 'Database creation failed'
psql -c 'GRANT ALL PRIVILEGES ON DATABASE chatflow_api TO chatflow_user;' || echo 'Grant failed'
" 2>/dev/null

echo ""
echo "📊 Verifying user creation..."
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "SELECT current_user;" 2>/dev/null || echo "User verification failed"

echo ""
echo "📊 Adding evolution_name column..."
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS evolution_name VARCHAR(50) DEFAULT 'chatflow-1';
" 2>/dev/null || echo "Column addition failed"

echo ""
echo "📊 Updating existing records..."
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
UPDATE phone_numbers 
SET evolution_name = CASE 
    WHEN id % 2 = 0 THEN 'chatflow-2'
    ELSE 'chatflow-1'
END
WHERE evolution_name IS NULL OR evolution_name = '';
" 2>/dev/null || echo "Record update failed"

echo ""
echo "📊 Final verification..."
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
SELECT id, device_name, evolution_name, is_connected 
FROM phone_numbers 
ORDER BY id 
LIMIT 3;
" 2>/dev/null || echo "Final verification failed"

echo ""
echo "✅ PostgreSQL container fix complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Start local backend: cd backend && npm run dev"
echo "2. Test connection: curl http://localhost:8090/health"
echo "3. Test QR generation: Use frontend at http://localhost:3000/phones"
echo ""
echo "🌐 Access URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8090"
echo "- ChatFlow API-1: http://localhost:8081"
echo "- ChatFlow API-2: http://localhost:8082"
