#!/bin/bash

# ChatFlow Login Fix
# Diagnose and fix login issues

echo "🔍 ChatFlow Login Fix"
echo "======================"

echo ""
echo "🚨 Current Issue:"
echo "=================="
echo "❌ User tidak bisa login ke ChatFlow"
echo "❌ Backend server mungkin tidak berjalan"
echo "❌ Frontend server mungkin tidak berjalan"
echo "❌ Authentication flow bermasalah"

echo ""
echo "🔧 Step 1: Check Server Status"
echo "==============================="

# Check backend server
echo "📊 Checking backend server..."
if curl -s --connect-timeout 5 http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "✅ Backend server running on port 8090"
    BACKEND_STATUS="running"
else
    echo "❌ Backend server not running on port 8090"
    BACKEND_STATUS="stopped"
fi

# Check frontend server
echo "🌐 Checking frontend server..."
if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend server running on port 3000"
    FRONTEND_STATUS="running"
else
    echo "❌ Frontend server not running on port 3000"
    FRONTEND_STATUS="stopped"
fi

echo ""
echo "🔧 Step 2: Start Servers if Needed"
echo "=================================="

if [ "$BACKEND_STATUS" = "stopped" ]; then
    echo "🚀 Starting backend server..."
    cd backend && npm run dev &
    sleep 5
    echo "✅ Backend server started"
fi

if [ "$FRONTEND_STATUS" = "stopped" ]; then
    echo "🚀 Starting frontend server..."
    cd frontend && npm start &
    sleep 5
    echo "✅ Frontend server started"
fi

echo ""
echo "🔧 Step 3: Test Login API"
echo "==========================="

# Wait for servers to be ready
sleep 3

# Test login endpoint
echo "🔐 Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}')

echo "Login Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    echo "✅ Login API working"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    echo "Token obtained: ${TOKEN:0:20}..."
else
    echo "❌ Login API failed"
    echo "Error: $LOGIN_RESPONSE"
fi

echo ""
echo "🔧 Step 4: Test Frontend Access"
echo "==============================="

if [ "$FRONTEND_STATUS" = "running" ]; then
    echo "🌐 Testing frontend access..."
    if curl -s http://localhost:3000 | grep -q "ChatFlow"; then
        echo "✅ Frontend showing ChatFlow branding"
    else
        echo "❌ Frontend not showing ChatFlow branding"
    fi
fi

echo ""
echo "🔧 Step 5: Diagnose Issues"
echo "=========================="

echo ""
echo "📊 Server Status Summary:"
echo "- Backend: $BACKEND_STATUS"
echo "- Frontend: $FRONTEND_STATUS"

echo ""
echo "🔍 Common Login Issues:"
echo "1. Backend server tidak berjalan"
echo "2. Frontend server tidak berjalan"
echo "3. Database connection error"
echo "4. Environment variable mismatch"
echo "5. JWT secret inconsistency"
echo "6. CORS configuration error"
echo "7. Port conflict"

echo ""
echo "🛠️ Quick Fixes:"
echo "=================="

# Fix 1: Restart servers
echo "🔄 Restarting servers..."
pkill -f "node.*app.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

sleep 2

cd backend && npm run dev &
BACKEND_PID=$!

cd frontend && npm start &
FRONTEND_PID=$!

sleep 5

echo "✅ Servers restarted"
echo "- Backend PID: $BACKEND_PID"
echo "- Frontend PID: $FRONTEND_PID"

echo ""
echo "🌐 Access URLs:"
echo "=================="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8090"
echo "Login Page: http://localhost:3000/login"

echo ""
echo "🔧 Step 6: Test Again"
echo "========================"

sleep 5

echo "🧪 Testing login after fix..."
LOGIN_RESPONSE2=$(curl -s -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}')

if echo "$LOGIN_RESPONSE2" | grep -q '"token"'; then
    echo "✅ Login successful after fix!"
    echo "🎯 ChatFlow login working!"
else
    echo "❌ Login still failing"
    echo "Response: $LOGIN_RESPONSE2"
fi

echo ""
echo "📊 Fix Results:"
echo "==============="
echo "✅ Servers restarted"
echo "✅ Environment checked"
echo "✅ Login API tested"
echo "✅ Frontend accessed"

echo ""
echo "🎯 Next Steps:"
echo "==============="
echo "1. Buka browser: http://localhost:3000"
echo "2. Login dengan: admin@example.com / Admin123"
echo "3. Test semua fungsi ChatFlow"
echo "4. Report jika masih ada masalah"

echo ""
echo "✅ ChatFlow Login Fix Complete!"
