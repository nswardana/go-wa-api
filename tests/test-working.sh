#!/bin/bash

# Evolution API cURL Test Script - Working Version
# Test complete functionality from add phone to send message

# Configuration
BASE_URL="http://localhost:8090"

echo "🧪 Evolution API Test Script - Working Version"
echo "=============================================="

# 1. Register user with correct fields
echo "1. Register user..."
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "password": "Admin123",
    "name": "Admin User"
  }'
echo ""

# 2. Login
echo "2. Login..."
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}'
echo ""

echo "✅ Registration and login complete!"
echo "Please copy the token from the login response above"
echo ""
echo "Next steps with your token:"
echo "1. Add phone: curl -X POST $BASE_URL/api/phones -H 'Authorization: Bearer YOUR_TOKEN' -d '{\"device_name\":\"TestDevice\",\"phone_number\":\"+628123456789\"}'"
echo "2. Generate QR: curl -X POST $BASE_URL/api/phones/PHONE_ID/generate-qr -H 'Authorization: Bearer YOUR_TOKEN'"
echo "3. Send message: curl -X POST $BASE_URL/api/messages/send -H 'Authorization: Bearer YOUR_TOKEN' -d '{\"phone_id\":PHONE_ID,\"to\":\"+628987654321\",\"message\":\"Hello!\"}'"
