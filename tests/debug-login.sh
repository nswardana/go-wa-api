#!/bin/bash

# Evolution API cURL Test Script - Debug Version
# Test complete functionality from add phone to send message

# Configuration
BASE_URL="http://localhost:8090"

echo "🧪 Evolution API Test Script - Debug Mode"
echo "=========================================="

# Test different login credentials
echo "1. Testing Login with different credentials..."

# Try admin@example.com
echo "Trying admin@example.com / admin123..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')
echo "Response: $LOGIN_RESPONSE"

# Try admin@evolution-api.com
echo "Trying admin@evolution-api.com / admin123..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evolution-api.com","password":"admin123"}')
echo "Response: $LOGIN_RESPONSE"

# Try admin / admin
echo "Trying admin / admin..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')
echo "Response: $LOGIN_RESPONSE"

# Try test / test
echo "Trying test / test..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}')
echo "Response: $LOGIN_RESPONSE"

# Check available routes
echo ""
echo "2. Checking available routes..."
curl -s $BASE_URL/api/ || echo "No response from /api/"

# Check auth routes
echo "Checking auth routes..."
curl -s $BASE_URL/api/auth || echo "No response from /api/auth/"

echo ""
echo "🔍 Debug Complete!"
echo "==================="
echo "Please check the responses above to find the correct credentials."
