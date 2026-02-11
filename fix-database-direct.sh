#!/bin/bash

# Database Schema Fix - Direct Approach
# Fix evolution_name column issue

echo "🔧 Direct Database Schema Fix"
echo "============================="

echo ""
echo "🔍 Checking database environment..."

# Check environment variables from docker-compose
echo "DB_NAME: chatflow_api"
echo "DB_USER: chatflow_user"
echo "DB_PASSWORD: Bismillah313!"

echo ""
echo "📊 Creating SQL script to add column..."

# Create SQL script
cat > add_evolution_column.sql << 'EOF'
-- Add evolution_name column to phone_numbers table
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS evolution_name VARCHAR(50) DEFAULT 'chatflow-1';

-- Update existing records with round-robin assignment
UPDATE phone_numbers 
SET evolution_name = CASE 
    WHEN id % 2 = 0 THEN 'chatflow-2'
    ELSE 'chatflow-1'
END
WHERE evolution_name IS NULL OR evolution_name = '';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'phone_numbers' 
AND column_name = 'evolution_name';
EOF

echo "✅ SQL script created: add_evolution_column.sql"

echo ""
echo "📊 Copying SQL script to container..."

# Copy SQL script to container
docker cp add_evolution_column.sql chatflow-postgres:/tmp/add_evolution_column.sql

echo ""
echo "🔧 Executing SQL script in container..."

# Execute SQL script with proper user
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -f /tmp/add_evolution_column.sql

echo ""
echo "🗑️ Cleaning up..."

# Remove temporary files
rm add_evolution_column.sql
docker exec chatflow-postgres rm /tmp/add_evolution_column.sql

echo ""
echo "✅ Database schema fix complete!"

echo ""
echo "🔄 Restarting backend to apply changes..."
docker restart chatflow-backend

echo ""
echo "⏳ Waiting for backend to start..."
sleep 10

echo ""
echo "🧪 Testing API..."
curl -s -X GET http://localhost:8090/health || echo "Backend not ready yet"

echo ""
echo "✅ Database fix complete!"
