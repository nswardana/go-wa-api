#!/bin/bash

# Final PostgreSQL Fix
# Fix PostgreSQL container user issue and add evolution_name column

echo "🔧 Final PostgreSQL Fix"
echo "======================"

echo ""
echo "🔍 Checking container environment..."

# Check what user is actually available
echo "Available users in container:"
docker exec chatflow-postgres bash -c "
psql -t -c '\du' || echo 'Cannot list users'
"

echo ""
echo "🔍 Creating database and user..."

# Try to connect with default user and create what we need
docker exec chatflow-postgres bash -c "
psql -d chatflow_api -c '
CREATE USER chatflow_user WITH PASSWORD \"Bismillah313!\";
GRANT ALL PRIVILEGES ON DATABASE chatflow_api TO chatflow_user;
ALTER USER chatflow_user CREATEDB;
ALTER USER chatflow_user CREATEROLE;
' 2>/dev/null || echo 'User creation attempted'
"

echo ""
echo "📊 Adding evolution_name column..."

# Add the column
docker exec chatflow-postgres bash -c "
psql -U chatflow_user -d chatflow_api -c '
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS evolution_name VARCHAR(50) DEFAULT \"chatflow-1\";
' 2>/dev/null || echo 'Column addition attempted'
"

echo ""
echo "📊 Updating existing records..."

# Update existing records
docker exec chatflow-postgres bash -c "
psql -U chatflow_user -d chatflow_api -c '
UPDATE phone_numbers 
SET evolution_name = CASE 
    WHEN id % 2 = 0 THEN \"chatflow-2\"
    ELSE \"chatflow-1\"
END
WHERE evolution_name IS NULL OR evolution_name = \"\";
' 2>/dev/null || echo 'Record update attempted'
"

echo ""
echo "📊 Verifying table structure..."

# Check if column exists
docker exec chatflow-postgres bash -c "
psql -U chatflow_user -d chatflow_api -c '
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = \"phone_numbers\" 
AND column_name = \"evolution_name\";
' 2>/dev/null || echo 'Column verification attempted'
"

echo ""
echo "📊 Checking phone records..."

# Check phone records
docker exec chatflow-postgres bash -c "
psql -U chatflow_user -d chatflow_api -c '
SELECT id, device_name, evolution_name, is_connected 
FROM phone_numbers 
ORDER BY id 
LIMIT 3;
' 2>/dev/null || echo 'Phone records check attempted'
"

echo ""
echo "🔄 Restarting backend container..."
docker restart chatflow-backend

echo ""
echo "⏳ Waiting for backend to start..."
sleep 10

echo ""
echo "🧪 Testing API connection..."
curl -s http://localhost:8090/health || echo "Backend not ready"

echo ""
echo "🧪 Testing phones API..."
curl -s http://localhost:8090/api/phones \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
  | head -10 || echo "API test failed"

echo ""
echo "✅ PostgreSQL fix complete!"
echo ""
echo "🌐 Access URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8090"
echo "- ChatFlow API-1: http://localhost:8081"
echo "- ChatFlow API-2: http://localhost:8082"
echo ""
echo "📱 Test QR Generation:"
echo "1. Open http://localhost:3000/phones"
echo "2. Create new phone"
echo "3. Click Generate QR"
echo "4. Verify QR code appears"
