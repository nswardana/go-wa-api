#!/bin/bash

# ChatFlow Test Runner & Fix
# Run all tests in tests/ folder and fix any issues

echo "🧪 ChatFlow Test Runner & Fix"
echo "============================"

echo ""
echo "📁 Running tests from tests/ folder..."
echo "===================================="

# Check if tests folder exists
if [ ! -d "tests" ]; then
    echo "❌ tests/ folder not found"
    exit 1
fi

echo "✅ tests/ folder found"
echo ""

# List all test files
echo "📋 Available test files:"
echo "======================"
ls -la tests/test-*.sh
echo ""

# Check server status first
echo "🔍 Checking server status..."
if curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "✅ Backend server running"
else
    echo "❌ Backend server not running"
    echo "🚀 Starting backend server..."
    cd backend && npm run dev &
    sleep 5
    cd ..
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend server running"
else
    echo "❌ Frontend server not running"
    echo "🚀 Starting frontend server..."
    cd frontend && npm start &
    sleep 5
    cd ..
fi

echo ""
echo "🧪 Running API Tests..."
echo "======================"

# Test 1: Basic API Test
echo "📝 Test 1: Basic API Test..."
if [ -f "tests/test-api.sh" ]; then
    echo "🔧 Fixing test-api.sh for ChatFlow..."
    # Fix the test file for ChatFlow
    sed -i '' 's/Evolution API/ChatFlow/g' tests/test-api.sh
    sed -i '' 's/admin123/Admin123/g' tests/test-api.sh
    sed -i '' 's|/api/login|/api/auth/login|g' tests/test-api.sh
    
    echo "🚀 Running test-api.sh..."
    chmod +x tests/test-api.sh
    cd tests && ./test-api.sh
    cd ..
    echo "✅ test-api.sh completed"
else
    echo "❌ test-api.sh not found"
fi

echo ""

# Test 2: API Working Test
echo "📝 Test 2: API Working Test..."
if [ -f "tests/test-api-working.sh" ]; then
    echo "🔧 Fixing test-api-working.sh for ChatFlow..."
    sed -i '' 's/Evolution API/ChatFlow/g' tests/test-api-working.sh
    sed -i '' 's/admin123/Admin123/g' tests/test-api-working.sh
    sed -i '' 's|/api/login|/api/auth/login|g' tests/test-api-working.sh
    
    echo "🚀 Running test-api-working.sh..."
    chmod +x tests/test-api-working.sh
    cd tests && ./test-api-working.sh
    cd ..
    echo "✅ test-api-working.sh completed"
else
    echo "❌ test-api-working.sh not found"
fi

echo ""

# Test 3: Final Working Test
echo "📝 Test 3: Final Working Test..."
if [ -f "tests/test-final-working.sh" ]; then
    echo "🔧 Fixing test-final-working.sh for ChatFlow..."
    sed -i '' 's/Evolution API/ChatFlow/g' tests/test-final-working.sh
    sed -i '' 's/admin123/Admin123/g' tests/test-final-working.sh
    sed -i '' 's|/api/login|/api/auth/login|g' tests/test-final-working.sh
    
    echo "🚀 Running test-final-working.sh..."
    chmod +x tests/test-final-working.sh
    cd tests && ./test-final-working.sh
    cd ..
    echo "✅ test-final-working.sh completed"
else
    echo "❌ test-final-working.sh not found"
fi

echo ""

# Test 4: Fresh Test
echo "📝 Test 4: Fresh Test..."
if [ -f "tests/test-fresh.sh" ]; then
    echo "🔧 Fixing test-fresh.sh for ChatFlow..."
    sed -i '' 's/Evolution API/ChatFlow/g' tests/test-fresh.sh
    sed -i '' 's/admin123/Admin123/g' tests/test-fresh.sh
    sed -i '' 's|/api/login|/api/auth/login|g' tests/test-fresh.sh
    
    echo "🚀 Running test-fresh.sh..."
    chmod +x tests/test-fresh.sh
    cd tests && ./test-fresh.sh
    cd ..
    echo "✅ test-fresh.sh completed"
else
    echo "❌ test-fresh.sh not found"
fi

echo ""

# Test 5: Frontend Test
echo "📝 Test 5: Frontend Test..."
if [ -f "tests/test-frontend.sh" ]; then
    echo "🔧 Fixing test-frontend.sh for ChatFlow..."
    sed -i '' 's/Evolution API/ChatFlow/g' tests/test-frontend.sh
    sed -i '' 's/admin123/Admin123/g' tests/test-frontend.sh
    
    echo "🚀 Running test-frontend.sh..."
    chmod +x tests/test-frontend.sh
    cd tests && ./test-frontend.sh
    cd ..
    echo "✅ test-frontend.sh completed"
else
    echo "❌ test-frontend.sh not found"
fi

echo ""

# Test 6: Session Handling Test
echo "📝 Test 6: Session Handling Test..."
if [ -f "tests/test-session-handling.sh" ]; then
    echo "🔧 Fixing test-session-handling.sh for ChatFlow..."
    sed -i '' 's/Evolution API/ChatFlow/g' tests/test-session-handling.sh
    sed -i '' 's/admin123/Admin123/g' tests/test-session-handling.sh
    
    echo "🚀 Running test-session-handling.sh..."
    chmod +x tests/test-session-handling.sh
    cd tests && ./test-session-handling.sh
    cd ..
    echo "✅ test-session-handling.sh completed"
else
    echo "❌ test-session-handling.sh not found"
fi

echo ""

# Create a comprehensive test report
echo "📊 Test Results Summary:"
echo "======================"
echo ""
echo "✅ Tests Fixed and Run:"
echo "- test-api.sh: Updated for ChatFlow branding"
echo "- test-api-working.sh: Updated for ChatFlow branding"
echo "- test-final-working.sh: Updated for ChatFlow branding"
echo "- test-fresh.sh: Updated for ChatFlow branding"
echo "- test-frontend.sh: Updated for ChatFlow branding"
echo "- test-session-handling.sh: Updated for ChatFlow branding"
echo ""
echo "🔧 Fixes Applied:"
echo "- Evolution API → ChatFlow"
echo "- admin123 → Admin123"
echo "- /api/login → /api/auth/login"
echo "- All test files made executable"
echo ""
echo "🌐 Test URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8090"
echo "- Login: http://localhost:3000/login"
echo ""
echo "🎯 Next Steps:"
echo "1. Check individual test results above"
echo "2. Fix any remaining issues"
echo "3. Test ChatFlow functionality manually"
echo "4. Verify all APIs working correctly"
echo ""
echo "✅ ChatFlow Test Runner Complete!"
