#!/bin/bash

# Persistent Database Setup
# Ensures database tables persist across container restarts

echo "🔧 Setting up Persistent Database"
echo "================================="

echo ""
echo "🛑 Stopping containers..."

# Stop all containers
docker-compose down

echo ""
echo "🗑️ Cleaning up old volumes (optional)..."

# Ask user if they want to keep existing data
read -p "Keep existing database data? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Keeping existing data..."
else
    echo "🗑️ Removing old volume..."
    docker volume rm postgres_data 2>/dev/null
fi

echo ""
echo "🐳 Starting PostgreSQL with persistent setup..."

# Start PostgreSQL with complete init script
docker-compose up -d postgres

echo ""
echo "⏳ Waiting for PostgreSQL to initialize..."
sleep 20

echo ""
echo "🧪 Testing database connection..."

# Test connection
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "SELECT 'Database connection successful!' as status;" 2>/dev/null && echo "✅ Database connection successful!" || echo "❌ Database connection failed!"

echo ""
echo "📊 Verifying tables..."

# Check if all tables exist
TABLES=("users" "phone_numbers" "messages" "message_templates" "api_usage" "rate_limits" "webhook_events")

for table in "${TABLES[@]}"; do
    if docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "\dt $table" 2>/dev/null | grep -q "$table"; then
        echo "✅ Table '$table' exists"
    else
        echo "❌ Table '$table' missing"
    fi
done

echo ""
echo "🔄 Starting other services..."

# Start other services
docker-compose up -d redis chatflow-api-1 chatflow-api-2

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🧪 Testing services..."

# Test Redis
docker exec chatflow-redis redis-cli ping 2>/dev/null && echo "✅ Redis ready" || echo "❌ Redis not ready"

# Test ChatFlow APIs
curl -s http://localhost:8081/health > /dev/null && echo "✅ ChatFlow API-1 ready" || echo "❌ ChatFlow API-1 not ready"
curl -s http://localhost:8082/health > /dev/null && echo "✅ ChatFlow API-2 ready" || echo "❌ ChatFlow API-2 not ready"

echo ""
echo "✅ Persistent database setup complete!"
echo ""
echo "🌐 Access URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8090"
echo "- Database: PostgreSQL container (localhost:5432)"
echo "- Redis: Redis container (localhost:6379)"
echo "- ChatFlow API-1: http://localhost:8081"
echo "- ChatFlow API-2: http://localhost:8082"
echo ""
echo "📝 Database Tables Created:"
echo "- users - User management"
echo "- phone_numbers - Phone number management"
echo "- messages - Message history"
echo "- message_templates - Template management"
echo "- api_usage - API usage tracking"
echo "- rate_limits - Rate limiting"
echo "- webhook_events - Webhook event logging"
echo ""
echo "🔧 To start local development:"
echo "1. cd backend && NODE_ENV=development npm run dev"
echo "2. cd frontend && npm start"
echo ""
echo "💾 Data Persistence:"
echo "- Database data stored in Docker volume 'postgres_data'"
echo "- Tables auto-created on container start"
echo "- No more manual table creation needed!"
