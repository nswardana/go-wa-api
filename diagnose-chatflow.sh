#!/bin/bash

# ChatFlow API Diagnostic
# Check ChatFlow API health and connectivity

echo "🔍 ChatFlow API Diagnostic"
echo "=========================="

echo ""
echo "📊 Checking container status..."
docker ps | grep chatflow

echo ""
echo "🔍 Checking ChatFlow API-1 health..."
curl -m 5 http://localhost:8081/health || echo "❌ ChatFlow API-1 not responding"

echo ""
echo "🔍 Checking ChatFlow API-2 health..."
curl -m 5 http://localhost:8082/health || echo "❌ ChatFlow API-2 not responding"

echo ""
echo "🔍 Checking ChatFlow API-1 login endpoint..."
curl -m 5 -H "Authorization: Basic $(echo -n 'admin:admin' | base64)" \
     http://localhost:8081/app/login || echo "❌ Login endpoint not responding"

echo ""
echo "🔍 Checking ChatFlow API-2 login endpoint..."
curl -m 5 -H "Authorization: Basic $(echo -n 'admin:admin' | base64)" \
     http://localhost:8082/app/login || echo "❌ Login endpoint not responding"

echo ""
echo "📊 Checking backend logs for QR generation..."
docker logs chatflow-backend --tail 10 | grep -i "qr\|generate\|chatflow" || echo "No QR logs found"

echo ""
echo "📊 Checking ChatFlow API-1 logs..."
docker logs chatflow-api-1 --tail 10 | grep -i "login\|qr\|device" || echo "No relevant logs found"

echo ""
echo "📊 Checking ChatFlow API-2 logs..."
docker logs chatflow-api-2 --tail 10 | grep -i "login\|qr\|device" || echo "No relevant logs found"

echo ""
echo "🔍 Testing direct ChatFlow API connection..."
echo "Testing device creation..."

# Test device creation
curl -m 10 -X POST http://localhost:8081/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin' | base64)" \
  -d '{
    "device_id": "test-device",
    "number": "+62811111111111",
    "webhook": "http://localhost:8090/webhook",
    "webhook_secret": "test_secret"
  }' || echo "❌ Device creation failed"

echo ""
echo "✅ Diagnostic complete!"
