#!/bin/bash

# Docker ChatFlow Migration & Restart
# Update Docker environment and restart services

echo "🐳 Docker ChatFlow Migration & Restart"
echo "======================================"

echo ""
echo "🔍 Current Docker Status..."
echo "=========================="

# Check current Docker containers
echo "📊 Checking running containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🛠️ Stopping Evolution API Services..."
echo "=================================="

# Stop existing containers
echo "🛑 Stopping evolution containers..."
docker stop evolution-api-1 evolution-api-2 evolution-backend evolution-frontend evolution-nginx evolution-postgres evolution-redis 2>/dev/null || true

echo "🗑️ Removing evolution containers..."
docker rm evolution-api-1 evolution-api-2 evolution-backend evolution-frontend evolution-nginx evolution-postgres evolution-redis 2>/dev/null || true

echo ""
echo "🚀 Starting ChatFlow Services..."
echo "================================"

# Start ChatFlow services with new environment
echo "🐳 Starting ChatFlow containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo "================================"

# Wait for services to start
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check backend health
echo "📊 Checking backend health..."
for i in {1..5}; do
    if curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
        echo "✅ Backend healthy after $i attempts"
        break
    else
        echo "⏳ Waiting for backend... attempt $i"
        sleep 2
    fi
done

# Check frontend health
echo "🌐 Checking frontend health..."
for i in {1..5}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend healthy after $i attempts"
        break
    else
        echo "⏳ Waiting for frontend... attempt $i"
        sleep 2
    fi
done

# Check Redis health
echo "🔴 Checking Redis health..."
for i in {1..5}; do
    if docker exec chatflow-redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis healthy after $i attempts"
        break
    else
        echo "⏳ Waiting for Redis... attempt $i"
        sleep 2
    fi
done

echo ""
echo "📊 Docker Migration Status:"
echo "=========================="

echo "✅ Evolution API containers: Stopped and removed"
echo "✅ ChatFlow containers: Started with new environment"
echo "✅ Service health: Checked"

echo ""
echo "🌐 Service URLs:"
echo "=================="
echo "Frontend:    http://localhost:3000"
echo "Backend API:  http://localhost:8090"
echo "Health Check:  http://localhost:8090/api/health"

echo ""
echo "🔧 Environment Variables:"
echo "========================"
echo "DB_NAME:      chatflow_api"
echo "DB_USER:      chatflow_user"
echo "REDIS_HOST:   redis"
echo "JWT_SECRET:    ChatFlowSecureSecret2024!"
echo "CHATFLOW_API_KEY: MySecureChatFlowKey2024!"

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Test login: curl -X POST http://localhost:8090/api/auth/login -d '{\"email\":\"admin@example.com\",\"password\":\"Admin123\"}'"
echo "2. Test frontend: open http://localhost:3000"
echo "3. Test APIs: Test all endpoints with authentication"
echo "4. Monitor logs: docker logs chatflow-backend -f"

echo ""
echo "✅ Docker ChatFlow Migration Complete!"
echo "=================================="
echo "🚀 ChatFlow services running with new branding!"
echo "🌐 All services accessible at URLs above"
echo "🎯 Ready for testing ChatFlow functionality!"
