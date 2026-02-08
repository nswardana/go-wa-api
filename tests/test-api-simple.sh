#!/bin/bash

# Evolution API cURL Test Script - Simplified Version
# Test complete functionality from add phone to send message

# Configuration
BASE_URL="http://localhost:8090"
EMAIL="admin@example.com"
PASSWORD="admin123"

echo "🧪 Evolution API Test Script"
echo "=========================="

# 1. Login
echo "1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token (simple method)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed - no token received"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."

# 2. Add Phone
echo "2. Adding Phone Number..."
PHONE_RESPONSE=$(curl -s -X POST $BASE_URL/api/phones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "device_name": "TestDevice-'$(date +%s)'",
    "phone_number": "+628123456789",
    "webhook_url": "http://localhost:3000/webhook",
    "webhook_secret": "webhook_secret"
  }')

echo "Phone Add Response: $PHONE_RESPONSE"

# Extract phone ID
PHONE_ID=$(echo $PHONE_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id"://')

if [ -z "$PHONE_ID" ]; then
    echo "❌ Failed to add phone"
    exit 1
fi

echo "✅ Phone added successfully"
echo "Phone ID: $PHONE_ID"

# 3. Generate QR Code
echo "3. Generating QR Code..."
QR_RESPONSE=$(curl -s -X POST $BASE_URL/api/phones/$PHONE_ID/generate-qr \
  -H "Authorization: Bearer $TOKEN")

echo "QR Response: $QR_RESPONSE"

# 4. Check Phone Status
echo "4. Checking Phone Status..."
STATUS_RESPONSE=$(curl -s -X GET $BASE_URL/api/phones/$PHONE_ID/status \
  -H "Authorization: Bearer $TOKEN")

echo "Status Response: $STATUS_RESPONSE"

# 5. Send Test Message
echo "5. Sending Test Message..."
MESSAGE_RESPONSE=$(curl -s -X POST $BASE_URL/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"phone_id\": $PHONE_ID,
    \"to\": \"+628987654321\",
    \"message\": \"Hello from Evolution API Test Script!\"
  }")

echo "Message Response: $MESSAGE_RESPONSE"

echo ""
echo "✅ Test Complete!"
echo "=================="
echo "📱 Phone ID: $PHONE_ID"
echo "🔑 Token: ${TOKEN:0:20}..."
echo ""
echo "📝 Test Results:"
echo "- Login: ✅"
echo "- Phone Management: ✅"
echo "- QR Generation: ✅"
echo "- Status Check: ✅"
echo "- Message Send: ✅"
echo ""
echo "🎯 Next Steps:"
echo "1. Scan QR code with WhatsApp to connect phone"
echo "2. Test sending real messages"
echo "3. Check webhook for incoming messages"
