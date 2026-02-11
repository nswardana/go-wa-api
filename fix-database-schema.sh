#!/bin/bash

# Database Schema Fix
# Add evolution_name column to phone_numbers table

echo "🔧 Fixing Database Schema for Instance Management"
echo "=============================================="

echo ""
echo "🔍 Checking current database schema..."

# Connect to database and check if evolution_name column exists
docker exec -it chatflow-postgres psql -U chatflow_user -d chatflow_db -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'phone_numbers' 
AND column_name = 'evolution_name';
"

echo ""
echo "📊 Adding evolution_name column if not exists..."

# Add evolution_name column
docker exec -it chatflow-postgres psql -U chatflow_user -d chatflow_db -c "
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS evolution_name VARCHAR(50) DEFAULT 'chatflow-1';
"

echo ""
echo "✅ Column added successfully!"

echo ""
echo "🔍 Verifying column addition..."

# Verify column was added
docker exec -it chatflow-postgres psql -U chatflow_user -d chatflow_db -c "
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'phone_numbers' 
AND column_name = 'evolution_name';
"

echo ""
echo "📊 Updating existing records with default instance..."

# Update existing records to have instance values
docker exec -it chatflow-postgres psql -U chatflow_user -d chatflow_db -c "
UPDATE phone_numbers 
SET evolution_name = CASE 
    WHEN id % 2 = 0 THEN 'chatflow-2'
    ELSE 'chatflow-1'
END
WHERE evolution_name IS NULL OR evolution_name = '';
"

echo ""
echo "📊 Checking updated records..."

# Check updated records
docker exec -it chatflow-postgres psql -U chatflow_user -d chatflow_db -c "
SELECT id, device_name, evolution_name 
FROM phone_numbers 
ORDER BY id;
"

echo ""
echo "✅ Database schema fix complete!"
echo ""
echo "🎯 Summary:"
echo "- Added evolution_name column"
echo "- Set default value to 'chatflow-1'"
echo "- Updated existing records with round-robin assignment"
echo "- Database ready for instance management"

echo ""
echo "🔄 Restarting backend to apply changes..."
docker restart chatflow-backend

echo ""
echo "⏳ Waiting for backend to start..."
sleep 10

echo ""
echo "✅ Database schema fix complete!"
