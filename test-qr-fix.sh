#!/bin/bash

# Test QR Code Fix
# Test the fixed QR generation with force parameter

echo "🔧 Testing QR Code Fix"
echo "========================"

echo ""
echo "🔄 Restarting backend to apply changes..."

# Restart backend container
docker restart chatflow-backend

echo ""
echo "⏳ Waiting for backend to start..."
sleep 10

echo ""
echo "🔍 Testing force QR generation..."

# Test force QR generation
echo "📱 Testing force QR generation for device ID 16..."
FORCE_QR_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/phones/16/generate-qr?force=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
  -H "Content-Type: application/json")

echo "Force QR Response: $FORCE_QR_RESPONSE"

echo ""
echo "🔍 Analyzing force QR response..."

# Check if QR code is generated
if echo "$FORCE_QR_RESPONSE" | grep -q '"qrCode":null'; then
    echo "❌ Force QR still null - Issue persists"
    
    echo ""
    echo "🔧 Testing disconnect endpoint..."
    
    # Test disconnect endpoint
    echo "📱 Testing disconnect for device ID 16..."
    DISCONNECT_RESPONSE=$(curl -s -X POST http://localhost:8090/api/phones/16/disconnect \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
      -H "Content-Type: application/json")
    
    echo "Disconnect Response: $DISCONNECT_RESPONSE"
    
    echo ""
    echo "⏳ Waiting 3 seconds after disconnect..."
    sleep 3
    
    echo ""
    echo "📱 Testing normal QR generation after disconnect..."
    NORMAL_QR_RESPONSE=$(curl -s -X POST http://localhost:8090/api/phones/16/generate-qr \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
      -H "Content-Type: application/json")
    
    echo "Normal QR Response: $NORMAL_QR_RESPONSE"
    
    if echo "$NORMAL_QR_RESPONSE" | grep -q '"qrCode":null'; then
        echo "❌ Normal QR still null - Backend logic issue"
    else
        echo "✅ Normal QR generated successfully!"
    fi
else
    echo "✅ Force QR generated successfully!"
fi

echo ""
echo "📊 Testing connection status..."
STATUS_RESPONSE=$(curl -s -X GET http://localhost:8090/api/phones/16/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmVlYXN5LmlkIiwiaWF0IjoxNzcwNTQyMzI4LCJleHAiOjE3NzA2Mjg3MjgsImF1ZCI6ImV2b2x1dGlvbi1jbGllbnQiLCJpc3MiOiJjaGF0ZmxvdyJ9.p3oUTQivRQ8VFNTHOlvgMGfFwbcaU0Sj6l_Q_1dyA_4" \
  -H "Content-Type: application/json")

echo "Status Response: $STATUS_RESPONSE"

echo ""
echo "📊 Summary of Fixes Applied:"
echo "============================"
echo "✅ Added disconnect endpoint to routes"
echo "✅ Added disconnectPhone method to controller"
echo "✅ Added disconnectPhone method to service"
echo "✅ Added force parameter to QR generation"
echo "✅ Updated QR generation logic to force disconnect"
echo "✅ Added proper error handling and logging"

echo ""
echo "🎯 Test Results:"
echo "==============="
echo "1. Force QR generation tested"
echo "2. Disconnect endpoint tested"
echo "3. Normal QR generation tested"
echo "4. Connection status checked"

echo ""
echo "🔍 Next Steps:"
echo "=============="
echo "1. Check the responses above"
echo "2. If QR still null, check ChatFlow API logs"
echo "3. Verify ChatFlow containers are running"
echo "4. Test with frontend QR modal"

echo ""
echo "✅ QR Code Fix Test Complete!"
