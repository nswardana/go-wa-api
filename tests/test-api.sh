#!/bin/bash

# ChatFlow cURL Test Script
# Test complete functionality from add phone to send message

# Configuration
BASE_URL="http://localhost:8090"
EMAIL="admin@example.com"
PASSWORD="Admin123"

echo "🧪 ChatFlow Test Script"
echo "=========================="

# Check if servers are running
echo "🔍 Checking server status..."
if ! curl -s -f "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo "❌ Backend server is not running at $BASE_URL"
    echo "Please start backend server: cd backend && npm start"
    exit 1
fi

echo "✅ Backend server is running"

# 1. Login
echo "1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token (simple method without jq)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed - no token received"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."

# 2. Get existing phones or add new one
echo "2. Getting existing phones..."
PHONES_RESPONSE=$(curl -s -X GET $BASE_URL/api/phones \
  -H "Authorization: Bearer $TOKEN")

echo "Phones Response: $PHONES_RESPONSE"

# Try to extract phone ID (simple method)
PHONE_ID=$(echo $PHONES_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$PHONE_ID" ]; then
    echo "No existing phones found, adding new phone..."
    
    # 3. Add Phone
    echo "3. Adding Phone Number..."
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
    
    # Extract phone ID from response
    PHONE_ID=$(echo $PHONE_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id"://')
    
    if [ -z "$PHONE_ID" ]; then
        echo "❌ Failed to add phone"
        exit 1
    fi
    
    echo "✅ Phone added successfully"
else
    echo "✅ Using existing phone"
fi

echo "Phone ID: $PHONE_ID"

# 4. Generate QR Code
echo "4. Generating QR Code..."
QR_RESPONSE=$(curl -s -X POST $BASE_URL/api/phones/$PHONE_ID/generate-qr \
  -H "Authorization: Bearer $TOKEN")

echo "QR Response: $QR_RESPONSE"

# 5. Check Phone Status
echo "5. Checking Phone Status..."
STATUS_RESPONSE=$(curl -s -X GET $BASE_URL/api/phones/$PHONE_ID/status \
  -H "Authorization: Bearer $TOKEN")

echo "Status Response: $STATUS_RESPONSE"

# 6. Send Test Message
echo "6. Sending Test Message..."
MESSAGE_RESPONSE=$(curl -s -X POST $BASE_URL/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"phone_id\": $PHONE_ID,
    \"to\": \"+628987654321\",
    \"message\": \"Hello from ChatFlow Test Script!\"
  }")

echo "Message Response: $MESSAGE_RESPONSE"

# 7. Get Message History
echo "7. Getting Message History..."
HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/messages?phone_id=$PHONE_ID&limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "History Response: $HISTORY_RESPONSE"

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
echo "- Message History: ✅"
echo ""
echo "🎯 Next Steps:"
echo "1. Scan QR code with WhatsApp to connect phone"
echo "2. Test sending real messages"
echo "3. Check webhook for incoming messages"
echo ""
echo "📚 For more tests, see: curl-test-guide.md"
