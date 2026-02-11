#!/bin/bash

# Create chatflow_user in PostgreSQL container
# Fix database user for local backend development

echo "🔧 Creating Database User for Local Backend"
echo "======================================="

echo ""
echo "📊 Creating chatflow_user in PostgreSQL..."

# Create chatflow_user with proper permissions
docker exec chatflow-postgres psql -U postgres -c "
CREATE USER chatflow_user WITH PASSWORD 'Bismillah313!';
GRANT ALL PRIVILEGES ON DATABASE chatflow_api TO chatflow_user;
ALTER USER chatflow_user CREATEDB;
ALTER USER chatflow_user CREATEROLE;
" 2>/dev/null || echo "User might already exist"

echo "✅ User created/updated!"

echo ""
echo "📊 Adding evolution_name column..."

# Add evolution_name column
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS evolution_name VARCHAR(50) DEFAULT 'chatflow-1';
" 2>/dev/null || echo "Column might already exist"

echo "✅ Column added!"

echo ""
echo "📊 Updating existing records..."

# Update existing records with round-robin assignment
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
UPDATE phone_numbers 
SET evolution_name = CASE 
    WHEN id % 2 = 0 THEN 'chatflow-2'
    ELSE 'chatflow-1'
END
WHERE evolution_name IS NULL OR evolution_name = '';
"

echo "✅ Records updated!"

echo ""
echo "📊 Verifying setup..."

# Test connection
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'phone_numbers' 
AND column_name = 'evolution_name';
" | head -5

echo ""
echo "📊 Phone records:"
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
SELECT id, device_name, evolution_name, is_connected 
FROM phone_numbers 
ORDER BY id 
LIMIT 5;
"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🚀 Start your local backend:"
echo "cd backend"
echo "npm install"
echo "npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8090"
echo "📱 ChatFlow API-1: http://localhost:8081"
echo "📱 ChatFlow API-2: http://localhost:8082"
