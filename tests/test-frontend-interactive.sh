#!/bin/bash

# Frontend Function Testing Script - Interactive Version
# Step-by-step testing with verification

echo "🧪 Frontend Function Testing - Interactive"
echo "=========================================="

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
echo "🌐 Opening browser for testing..."
echo "================================"

# Test 1: Login Page
echo "📝 Test 1: Login Page"
echo "URL: http://localhost:3000/login"
echo "Credentials: admin@example.com / Admin123"
echo ""
echo "Steps:"
echo "1. Open browser at http://localhost:3000"
echo "2. Should redirect to login page"
echo "3. Test with invalid credentials"
echo "4. Test with valid credentials"
echo "5. Verify successful login redirects to dashboard"
echo ""
read -p "Press Enter after testing login..."

# Test 2: Dashboard
echo ""
echo "📝 Test 2: Dashboard"
echo "URL: http://localhost:3000/"
echo ""
echo "Steps:"
echo "1. Verify user info display"
echo "2. Test navigation menu items"
echo "3. Test sidebar toggle"
echo "4. Test profile menu dropdown"
echo "5. Test logout functionality"
echo ""
read -p "Press Enter after testing dashboard..."

# Test 3: Phones Page
echo ""
echo "📝 Test 3: Phone Management"
echo "URL: http://localhost:3000/phones"
echo ""
echo "Steps:"
echo "1. Verify phone list display"
echo "2. Test 'Add Phone' button"
echo "3. Fill form: device_name, phone_number, webhook_url"
echo "4. Test QR code generation"
echo "5. Test phone deletion"
echo "6. Verify status updates"
echo ""
read -p "Press Enter after testing phones..."

# Test 4: Messages Page
echo ""
echo "📝 Test 4: Messages"
echo "URL: http://localhost:3000/messages"
echo ""
echo "Steps:"
echo "1. Verify message list"
echo "2. Test 'Send Message' button"
echo "3. Select phone and recipient"
echo "4. Compose and send message"
echo "5. Verify message in history"
echo "6. Test search/filter"
echo ""
read -p "Press Enter after testing messages..."

# Test 5: Templates Page
echo ""
echo "📝 Test 5: Templates"
echo "URL: http://localhost:3000/templates"
echo ""
echo "Steps:"
echo "1. Verify template list"
echo "2. Test 'Create Template' button"
echo "3. Fill form: name, content, variables"
echo "4. Test template editing"
echo "5. Test template deletion"
echo ""
read -p "Press Enter after testing templates..."

# Test 6: API Keys Page
echo ""
echo "📝 Test 6: API Keys"
echo "URL: http://localhost:3000/api-keys"
echo ""
echo "Steps:"
echo "1. Verify API key list"
echo "2. Test 'Create API Key' button"
echo "3. Set permissions and create"
echo "4. Test API key regeneration"
echo "5. Test API key deletion"
echo ""
read -p "Press Enter after testing API keys..."

# Test 7: Scheduled Messages Page
echo ""
echo "📝 Test 7: Scheduled Messages"
echo "URL: http://localhost:3000/schedules"
echo ""
echo "Steps:"
echo "1. Verify scheduled list"
echo "2. Test 'Schedule Message' button"
echo "3. Set message details and time"
echo "4. Test editing scheduled message"
echo "5. Test deletion of scheduled message"
echo ""
read -p "Press Enter after testing scheduled messages..."

echo ""
echo "✅ Frontend Testing Complete!"
echo "============================"
echo ""
echo "📊 Test Summary:"
echo "- Authentication: Tested"
echo "- Dashboard: Tested"
echo "- Phone Management: Tested"
echo "- Messages: Tested"
echo "- Templates: Tested"
echo "- API Keys: Tested"
echo "- Scheduled Messages: Tested"
echo ""
echo "🔍 If any issues found:"
echo "1. Open Browser Dev Tools (F12)"
echo "2. Check Console for JavaScript errors"
echo "3. Check Network tab for API call failures"
echo "4. Verify API responses in Network tab"
echo ""
echo "📝 Report any errors or unexpected behavior!"
