#!/bin/bash

# Kill Local Backend Process
# Stop local backend to free up port 8090

echo "🛑 Stopping Local Backend Process"
echo "================================="

echo ""
echo "🔍 Checking for Node.js processes on port 8090..."

# Find and kill Node.js processes using port 8090
if command -v lsof >/dev/null 2>&1; then
    echo "Using lsof to find processes..."
    lsof -ti:8090 | xargs kill -9 2>/dev/null || echo "No processes found with lsof"
else
    echo "Using ps to find Node.js processes..."
    ps aux | grep "node.*8090" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || echo "No Node.js processes found"
fi

echo ""
echo "🧹 Cleaning up any remaining Node.js processes..."
pkill -f "node.*backend" 2>/dev/null || echo "No backend processes found"

echo ""
echo "✅ Local backend processes stopped!"

echo ""
echo "🔄 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "🔍 Checking container status..."
docker ps | grep chatflow

echo ""
echo "🧪 Testing backend health..."
sleep 5
curl -s http://localhost:8090/health || echo "Backend not ready yet"

echo ""
echo "🧪 Testing frontend..."
curl -s http://localhost:3000 || echo "Frontend not ready yet"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Access URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8090"
echo "- ChatFlow API-1: http://localhost:8081"
echo "- ChatFlow API-2: http://localhost:8082"
echo ""
echo "📱 Next steps:"
echo "1. Open http://localhost:3000/phones"
echo "2. Create new phone"
echo "3. Generate QR code"
echo "4. Test WhatsApp connection"
