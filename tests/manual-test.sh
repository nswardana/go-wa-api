#!/bin/bash

# Evolution API cURL Test Script - Simple Manual Test
# Test complete functionality from add phone to send message

# Configuration
BASE_URL="http://localhost:8090"

echo "🧪 Evolution API Manual Test"
echo "=========================="

# 1. Register user
echo "1. Register user..."
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin User"
  }'
echo ""

# 2. Login
echo "2. Login..."
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
echo ""

# 3. Get token manually (you need to copy this)
echo "3. Please copy the token from the login response above"
echo "Then run the following commands with your token:"
echo ""

# 4. Add phone (replace YOUR_TOKEN)
echo "4. Add phone (replace YOUR_TOKEN):"
echo "curl -X POST $BASE_URL/api/phones \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -d '{"
echo "    \"device_name\": \"TestDevice\","
echo "    \"phone_number\": \"+628123456789\","
echo "    \"webhook_url\": \"http://localhost:3000/webhook\""
echo "  }'"
echo ""

# 5. Generate QR (replace PHONE_ID and YOUR_TOKEN)
echo "5. Generate QR (replace PHONE_ID and YOUR_TOKEN):"
echo "curl -X POST $BASE_URL/api/phones/PHONE_ID/generate-qr \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""

# 6. Send message (replace PHONE_ID and YOUR_TOKEN)
echo "6. Send message (replace PHONE_ID and YOUR_TOKEN):"
echo "curl -X POST $BASE_URL/api/messages/send \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -d '{"
echo "    \"phone_id\": PHONE_ID,"
echo "    \"to\": \"+628987654321\","
echo "    \"message\": \"Hello from Evolution API!\""
echo "  }'"
echo ""

echo "✅ Manual test commands ready!"
echo "Please run them step by step."
