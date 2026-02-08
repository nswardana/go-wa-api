#!/bin/bash

# Evolution API cURL Test Script - Debug Token Version
# Debug token validation issues

# Configuration
BASE_URL="http://localhost:8090"

echo "🧪 Evolution API Token Debug"
echo "============================"

# 1. Fresh Login to get new token
echo "1. Fresh Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed - no token received"
    exit 1
fi

echo "✅ Login successful"
echo "Full Token: $TOKEN"
echo "Token length: ${#TOKEN}"

# 2. Test token decode
echo ""
echo "2. Testing token decode..."
DECODED=$(node -e "
try {
  const jwt = require('jsonwebtoken');
  const decoded = jwt.decode('$TOKEN');
  console.log('Decoded:', JSON.stringify(decoded, null, 2));
} catch (e) {
  console.log('Decode error:', e.message);
}
")
echo "$DECODED"

# 3. Test simple API call
echo ""
echo "3. Testing simple API call..."
echo "Authorization header: Authorization: Bearer $TOKEN"

# Test with curl -v for verbose output
echo "Verbose curl output:"
curl -v -X GET $BASE_URL/api/phones \
  -H "Authorization: Bearer $TOKEN" 2>&1 | head -20

echo ""
echo "4. Testing with different token format..."
# Try without Bearer prefix
echo "Without Bearer prefix:"
curl -s -X GET $BASE_URL/api/phones \
  -H "Authorization: $TOKEN"

echo ""
echo "🔍 Debug Complete!"
