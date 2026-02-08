#!/bin/bash

# Frontend Session Handling Test
# Test refresh behavior with session management

echo "🧪 Frontend Session Handling Test"
echo "================================="

# Check if servers are running
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
echo "📋 Session Handling Test Steps:"
echo "=============================="
echo ""
echo "🔐 1. Initial Login Test:"
echo "   - Open browser at http://localhost:3000"
echo "   - Should redirect to login page"
echo "   - Login with: admin@example.com / Admin123"
echo "   - Verify successful login to dashboard"
echo ""
echo "🔄 2. Refresh Test (With Valid Session):"
echo "   - While logged in, refresh the page (F5)"
echo "   - Should stay on current page (not redirect to login)"
echo "   - Should show loading spinner briefly"
echo "   - Should maintain user session"
echo ""
echo "🔄 3. Refresh Test (After Token Expiry):"
echo "   - Wait for token to expire (24h) or clear localStorage"
echo "   - Refresh the page"
echo "   - Should redirect to login page"
echo "   - Should show loading spinner first"
echo ""
echo "🔄 4. Multiple Tabs Test:"
echo "   - Open multiple tabs to the application"
echo "   - Login in one tab"
echo "   - Refresh other tabs"
echo "   - Should maintain session across tabs"
echo ""
echo "🔄 5. Logout and Refresh Test:"
echo "   - Logout from the application"
echo "   - Refresh the page"
echo "   - Should stay on login page"
echo ""
echo "🔍 6. Browser Dev Tools Monitoring:"
echo "   - Open Dev Tools (F12)"
echo "   - Monitor Console tab for errors"
echo "   - Monitor Network tab for API calls"
echo "   - Check localStorage for token"
echo "   - Check Application tab for storage"
echo ""
echo "📊 Expected Behaviors:"
echo "======================"
echo "✅ Valid Session: Refresh stays on current page"
echo "✅ Invalid Session: Refresh redirects to login"
echo "✅ Loading State: Shows spinner during session check"
echo "✅ Token Storage: Token saved/removed from localStorage"
echo "✅ Cross-tab Sync: Session shared across tabs"
echo "✅ Auto-logout: Redirects to login on 401 errors"
echo ""
echo "🐛 Common Issues to Check:"
echo "========================="
echo "❌ Always redirecting to login on refresh"
echo "❌ Not showing loading state during session check"
echo "❌ Token not being validated on app load"
echo "❌ localStorage not being cleared on logout"
echo "❌ Multiple tabs not syncing session state"
echo ""
echo "🔧 Technical Implementation:"
echo "=========================="
echo "✅ AuthContext: Checks session on app load"
echo "✅ PrivateRoute: Protects routes with loading state"
echo "✅ API Interceptor: Handles 401 errors automatically"
echo "✅ localStorage: Persists token across sessions"
echo "✅ Session Validation: Verifies token with /auth/me endpoint"
echo ""
echo "✅ Session Handling Test Ready!"
echo "=============================="
echo "🌐 Browser opened with: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8090"
echo ""
echo "📋 Follow the steps above to test session handling!"
echo "🔍 Use browser dev tools to monitor session behavior!"
