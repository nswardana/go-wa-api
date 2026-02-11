#!/bin/bash

# Fix QR Code Generation Issue
# Force QR generation regardless of device status

echo "🔧 Fix QR Code Generation Issue"
echo "================================"

echo ""
echo "🔍 Checking current device status..."

# Check device status first
echo "📊 Checking phone status for device ID 13..."
PHONE_STATUS=$(curl -s -X GET http://localhost:8090/api/phones/13/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
  -H "Content-Type: application/json")

echo "Phone Status Response: $PHONE_STATUS"

echo ""
echo "🔄 Attempting to force disconnect device..."

# Force disconnect device first
echo "📱 Disconnecting device ID 13..."
DISCONNECT_RESPONSE=$(curl -s -X POST http://localhost:8090/api/phones/13/disconnect \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
  -H "Content-Type: application/json")

echo "Disconnect Response: $DISCONNECT_RESPONSE"

echo ""
echo "⏳ Waiting 3 seconds for disconnection to complete..."
sleep 3

echo ""
echo "🔄 Generating QR code after disconnect..."

# Generate QR code again
echo "📱 Generating QR code for device ID 13..."
QR_RESPONSE=$(curl -s -X POST http://localhost:8090/api/phones/13/generate-qr \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
  -H "Content-Type: application/json")

echo "QR Generation Response: $QR_RESPONSE"

echo ""
echo "🔍 Analyzing response..."

# Check if QR code is generated
if echo "$QR_RESPONSE" | grep -q '"qrCode":null'; then
    echo "❌ QR Code still null - Issue persists"
    
    echo ""
    echo "🔧 Trying alternative approach - Force reset device..."
    
    # Try to reset device completely
    echo "📱 Resetting device ID 13..."
    RESET_RESPONSE=$(curl -s -X DELETE http://localhost:8090/api/phones/13 \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
      -H "Content-Type: application/json")
    
    echo "Reset Response: $RESET_RESPONSE"
    
    echo ""
    echo "⏳ Waiting 2 seconds..."
    sleep 2
    
    echo ""
    echo "📱 Recreating device..."
    # Recreate device
    CREATE_RESPONSE=$(curl -s -X POST http://localhost:8090/api/phones \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
      -H "Content-Type: application/json" \
      -d '{
        "phoneNumber": "+62818223304",
        "deviceName": "nanag",
        "webhookUrl": "http://localhost:8090/webhook"
      }')
    
    echo "Create Response: $CREATE_RESPONSE"
    
    # Extract new phone ID
    NEW_PHONE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    
    if [ ! -z "$NEW_PHONE_ID" ]; then
        echo ""
        echo "📱 Generating QR for new device ID: $NEW_PHONE_ID"
        NEW_QR_RESPONSE=$(curl -s -X POST http://localhost:8090/api/phones/$NEW_PHONE_ID/generate-qr \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
          -H "Content-Type: application/json")
        
        echo "New QR Response: $NEW_QR_RESPONSE"
        
        if echo "$NEW_QR_RESPONSE" | grep -q '"qrCode":null'; then
            echo "❌ Still no QR code - Backend issue detected"
        else
            echo "✅ QR Code generated successfully!"
        fi
    fi
else
    echo "✅ QR Code generated successfully!"
fi

echo ""
echo "📊 Summary of Actions:"
echo "======================"
echo "1. Checked device status"
echo "2. Forced device disconnection"
echo "3. Attempted QR generation"
echo "4. If needed: Reset and recreated device"
echo ""
echo "🎯 Next Steps:"
echo "1. Check the responses above"
echo "2. If QR still null, backend needs fixing"
echo "3. Test with new device if recreation worked"
echo "4. Verify WhatsApp connection after QR scan"

echo ""
echo "✅ QR Code Fix Script Complete!"
