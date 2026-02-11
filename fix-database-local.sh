#!/bin/bash

# Add evolution_name column to database for local development
# Fix database schema for backend local development

echo "🔧 Fix Database Schema for Local Backend"
echo "======================================"

echo ""
echo "📊 Connecting to PostgreSQL container..."

# Add evolution_name column using postgres user
docker exec chatflow-postgres psql -U postgres -d chatflow_api -c "
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS evolution_name VARCHAR(50) DEFAULT 'chatflow-1';
"

echo "✅ Column added successfully!"

echo ""
echo "📊 Updating existing records..."

# Update existing records with round-robin assignment
docker exec chatflow-postgres psql -U postgres -d chatflow_api -c "
UPDATE phone_numbers 
SET evolution_name = CASE 
    WHEN id % 2 = 0 THEN 'chatflow-2'
    ELSE 'chatflow-1'
END
WHERE evolution_name IS NULL OR evolution_name = '';
"

echo "✅ Records updated!"

echo ""
echo "📊 Verifying column..."

# Verify column was added
docker exec chatflow-postgres psql -U postgres -d chatflow_api -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'phone_numbers' 
AND column_name = 'evolution_name';
"

echo ""
echo "📊 Checking phone records..."

# Check phone records
docker exec chatflow-postgres psql -U postgres -d chatflow_api -c "
SELECT id, device_name, evolution_name, is_connected 
FROM phone_numbers 
ORDER BY id;
"

echo ""
echo "✅ Database schema fix complete!"
echo ""
echo "🎯 Summary:"
echo "- Added evolution_name column"
echo "- Updated existing records with round-robin assignment"
echo "- Database ready for local backend development"
echo ""
echo "🚀 Start your local backend with:"
echo "cd backend"
echo "npm install"
echo "npm run dev"
