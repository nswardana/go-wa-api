#!/bin/bash

# Master Test Runner Script
# Run all tests or specific test categories

echo "🧪 Master Test Runner"
echo "===================="

# Check if tests directory exists
if [ ! -d "tests" ]; then
    echo "❌ Tests directory not found"
    exit 1
fi

cd tests

# Function to display menu
show_menu() {
    echo ""
    echo "📋 Test Categories:"
    echo "=================="
    echo "1. Backend API Tests"
    echo "2. Frontend Tests"
    echo "3. Debug Tests"
    echo "4. All Tests"
    echo "5. Quick Test (Recommended)"
    echo "6. View Test Documentation"
    echo "0. Exit"
    echo ""
}

# Function to run backend tests
run_backend_tests() {
    echo ""
    echo "🔧 Running Backend API Tests..."
    echo "=============================="
    
    echo "1. Basic API Test..."
    ./test-api.sh
    
    echo ""
    echo "2. Working Version Test..."
    ./test-working.sh
    
    echo ""
    echo "3. Final Working Test..."
    ./test-final-working.sh
}

# Function to run frontend tests
run_frontend_tests() {
    echo ""
    echo "🌐 Running Frontend Tests..."
    echo "==========================="
    
    echo "1. Quick Frontend Test..."
    ./test-frontend-quick.sh
    
    echo ""
    echo "2. Automated Frontend Test..."
    ./test-frontend-automated.sh
    
    echo ""
    echo "3. Interactive Frontend Test..."
    echo "   (This will require user interaction)"
    read -p "Press Enter to continue with interactive test..."
    ./test-frontend-interactive.sh
}

# Function to run debug tests
run_debug_tests() {
    echo ""
    echo "🔍 Running Debug Tests..."
    echo "========================"
    
    echo "1. Login Debug..."
    ./debug-login.sh
    
    echo ""
    echo "2. Token Debug..."
    ./debug-token.sh
}

# Function to run all tests
run_all_tests() {
    echo ""
    echo "🧪 Running All Tests..."
    echo "======================"
    
    run_backend_tests
    run_frontend_tests
    run_debug_tests
    
    echo ""
    echo "✅ All Tests Complete!"
}

# Function to run quick test
run_quick_test() {
    echo ""
    echo "⚡ Running Quick Test..."
    echo "======================"
    
    echo "1. Backend Quick Test..."
    ./test-working.sh
    
    echo ""
    echo "2. Frontend Quick Test..."
    ./test-frontend-quick.sh
    
    echo ""
    echo "✅ Quick Test Complete!"
}

# Function to show documentation
show_documentation() {
    echo ""
    echo "📚 Test Documentation:"
    echo "====================="
    echo "1. cURL Test Guide"
    echo "2. Frontend Test Guide"
    echo "3. README-TEST"
    echo ""
    read -p "Enter choice (1-3): " doc_choice
    
    case $doc_choice in
        1)
            echo ""
            echo "📖 cURL Test Guide:"
            echo "=================="
            cat curl-test-guide.md
            ;;
        2)
            echo ""
            echo "📖 Frontend Test Guide:"
            echo "======================"
            cat frontend-test-guide.md
            ;;
        3)
            echo ""
            echo "📖 README-TEST:"
            echo "==============="
            cat README-TEST.md
            ;;
        *)
            echo "❌ Invalid choice"
            ;;
    esac
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice (0-6): " choice
    
    case $choice in
        1)
            run_backend_tests
            ;;
        2)
            run_frontend_tests
            ;;
        3)
            run_debug_tests
            ;;
        4)
            run_all_tests
            ;;
        5)
            run_quick_test
            ;;
        6)
            show_documentation
            ;;
        0)
            echo ""
            echo "👋 Exiting Test Runner..."
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
