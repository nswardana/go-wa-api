#!/bin/bash

# Frontend Function Testing Script
# Automated browser-based testing guide

echo "🧪 Frontend Function Testing"
echo "=========================="

# Check if servers are running
echo "🔍 Checking servers..."

# Check backend
if curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "✅ Backend server running on port 8090"
else
    echo "❌ Backend server not running"
    echo "Please start: cd backend && npm run dev"
    exit 1
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend server running on port 3000"
else
    echo "❌ Frontend server not running"
    echo "Please start: cd frontend && npm start"
    exit 1
fi

echo ""
echo "🌐 Frontend Testing URLs:"
echo "========================"
echo "1. Login Page:        http://localhost:3000/login"
echo "2. Dashboard:         http://localhost:3000/"
echo "3. Phones Page:       http://localhost:3000/phones"
echo "4. Messages Page:     http://localhost:3000/messages"
echo "5. Templates Page:     http://localhost:3000/templates"
echo "6. API Keys Page:     http://localhost:3000/api-keys"
echo "7. Scheduled Page:    http://localhost:3000/schedules"

echo ""
echo "🔑 Test Credentials:"
echo "==================="
echo "Email:    admin@example.com"
echo "Password: Admin123"

echo ""
echo "📋 Testing Checklist:"
echo "===================="

echo ""
echo "🔐 1. Authentication Testing:"
echo "   - Navigate to http://localhost:3000/login"
echo "   - Test invalid credentials"
echo "   - Test valid credentials (admin@example.com / Admin123)"
echo "   - Verify redirect to dashboard"
echo "   - Test logout functionality"

echo ""
echo "📱 2. Phone Management Testing:"
echo "   - Navigate to http://localhost:3000/phones"
echo "   - Verify phone list display"
echo "   - Test 'Add Phone' dialog"
echo "   - Fill: device_name, phone_number, webhook_url"
echo "   - Test QR code generation"
echo "   - Test phone deletion"
echo "   - Verify status updates"

echo ""
echo "💬 3. Message Testing:"
echo "   - Navigate to http://localhost:3000/messages"
echo "   - Verify message list"
echo "   - Test 'Send Message' dialog"
echo "   - Select phone and recipient"
echo "   - Compose and send message"
echo "   - Verify message in history"
echo "   - Test search/filter"

echo ""
echo "📝 4. Template Testing:"
echo "   - Navigate to http://localhost:3000/templates"
echo "   - Verify template list"
echo "   - Test 'Create Template' dialog"
echo "   - Fill: name, content, variables"
echo "   - Test template editing"
echo "   - Test template deletion"

echo ""
echo "🔑 5. API Key Testing:"
echo "   - Navigate to http://localhost:3000/api-keys"
echo "   - Verify API key list"
echo "   - Test 'Create API Key' dialog"
echo "   - Set permissions and create"
echo "   - Test API key regeneration"
echo "   - Test API key deletion"

echo ""
echo "⏰ 6. Scheduled Messages Testing:"
echo "   - Navigate to http://localhost:3000/schedules"
echo "   - Verify scheduled list"
echo "   - Test 'Schedule Message' dialog"
echo "   - Set message details and time"
echo "   - Test editing scheduled message"
echo "   - Test deletion of scheduled message"

echo ""
echo "🎯 7. Dashboard Testing:"
echo "   - Navigate to http://localhost:3000/"
echo "   - Verify user info display"
echo "   - Test navigation menu"
echo "   - Test sidebar toggle"
echo "   - Test profile menu"
echo "   - Test logout"

echo ""
echo "🔍 Debugging Tools:"
echo "=================="
echo "1. Open Browser Developer Tools (F12)"
echo "2. Monitor Console tab for JavaScript errors"
echo "3. Check Network tab for API calls"
echo "4. Verify API responses in Network tab"
echo "5. Check Elements tab for UI issues"

echo ""
echo "📊 Expected API Endpoints:"
echo "========================"
echo "POST /api/auth/login"
echo "POST /api/auth/register"
echo "GET  /api/phones"
echo "POST /api/phones"
echo "POST /api/phones/:id/generate-qr"
echo "GET  /api/messages"
echo "POST /api/messages/send"
echo "GET  /api/templates"
echo "POST /api/templates"
echo "GET  /api/api-keys"
echo "POST /api/api-keys"
echo "GET  /api/schedules"
echo "POST /api/schedules"

echo ""
echo "✅ Testing Infrastructure Ready!"
echo "=============================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8090"
echo ""
echo "📋 Follow the checklist above for comprehensive testing!"
echo "🔍 Use browser dev tools to monitor for issues!"
echo "📝 Report any errors or unexpected behavior!"
