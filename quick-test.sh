#!/bin/bash

# Quick Test Runner
# Run recommended tests quickly

echo "⚡ Quick Test Runner"
echo "=================="

# Check if tests directory exists
if [ ! -d "tests" ]; then
    echo "❌ Tests directory not found"
    exit 1
fi

cd tests

echo "🔧 Testing Backend API..."
echo "========================"
./test-working.sh

echo ""
echo "🌐 Testing Frontend..."
echo "====================="
./test-frontend-quick.sh

echo ""
echo "✅ Quick Tests Complete!"
echo "======================"
echo ""
echo "📊 Test Summary:"
echo "- Backend API: Tested"
echo "- Frontend: Tested"
echo ""
echo "🎯 Next Steps:"
echo "1. Open browser: http://localhost:3000"
echo "2. Test UI interactions manually"
echo "3. Check browser dev tools for issues"
echo ""
echo "📚 For more tests: ./run-tests.sh"
