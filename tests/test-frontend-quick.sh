#!/bin/bash

# Frontend Function Testing Script - Quick Version
# Automated testing with browser opening

echo "🧪 Frontend Function Testing - Quick Version"
echo "============================================"

# Check servers
echo "🔍 Checking servers..."
if curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "✅ Backend server running"
else
    echo "❌ Backend server not running"
    exit 1
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend server running"
else
    echo "❌ Frontend server not running"
    exit 1
fi

echo ""
echo "🌐 Opening Frontend Application..."
echo "================================"

# Open browser with frontend
if command -v open > /dev/null 2>&1; then
    # macOS
    open http://localhost:3000
elif command -v xdg-open > /dev/null 2>&1; then
    # Linux
    xdg-open http://localhost:3000
elif command -v start > /dev/null 2>&1; then
    # Windows
    start http://localhost:3000
else
    echo "Please open browser manually: http://localhost:3000"
fi

echo ""
echo "📋 Quick Testing Checklist:"
echo "=========================="
echo ""
echo "🔐 1. Login Testing:"
echo "   URL: http://localhost:3000/login"
echo "   Email: admin@example.com"
echo "   Password: Admin123"
echo "   ✓ Test invalid credentials"
echo "   ✓ Test valid credentials"
echo "   ✓ Verify redirect to dashboard"
echo ""
echo "📱 2. Phone Management:"
echo "   URL: http://localhost:3000/phones"
echo "   ✓ Add phone dialog"
echo "   ✓ QR code generation"
echo "   ✓ Phone deletion"
echo "   ✓ Status updates"
echo ""
echo "💬 3. Messages:"
echo "   URL: http://localhost:3000/messages"
echo "   ✓ Send message dialog"
echo "   ✓ Message history"
echo "   ✓ Search/filter"
echo ""
echo "📝 4. Templates:"
echo "   URL: http://localhost:3000/templates"
echo "   ✓ Create template"
echo "   ✓ Edit template"
echo "   ✓ Delete template"
echo ""
echo "🔑 5. API Keys:"
echo "   URL: http://localhost:3000/api-keys"
echo "   ✓ Create API key"
echo "   ✓ Regenerate key"
echo "   ✓ Delete key"
echo ""
echo "⏰ 6. Scheduled Messages:"
echo "   URL: http://localhost:3000/schedules"
echo "   ✓ Schedule message"
echo "   ✓ Edit schedule"
echo "   ✓ Delete schedule"
echo ""
echo "🎯 7. Dashboard:"
echo "   URL: http://localhost:3000/"
echo "   ✓ User info display"
echo "   ✓ Navigation menu"
echo "   ✓ Sidebar toggle"
echo "   ✓ Profile menu"
echo "   ✓ Logout"
echo ""
echo "🔍 Debugging Tools:"
echo "=================="
echo "1. Open Browser Dev Tools (F12)"
echo "2. Monitor Console for JavaScript errors"
echo "3. Check Network tab for API calls"
echo "4. Verify API responses"
echo ""
echo "📊 Expected API Endpoints:"
echo "========================"
echo "POST /api/auth/login"
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
echo "✅ Frontend Testing Ready!"
echo "=========================="
echo "🌐 Browser opened with: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8090"
echo ""
echo "📋 Follow the checklist above for systematic testing!"
echo "🔍 Use browser dev tools to monitor for issues!"
