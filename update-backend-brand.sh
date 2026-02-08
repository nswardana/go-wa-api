#!/bin/bash

# Backend Brand Update: Evolution API → ChatFlow
# Update all backend references to new brand

echo "🔧 Backend Brand Update: Evolution API → ChatFlow"
echo "=============================================="

echo ""
echo "📝 Updating backend files..."
echo "============================"

# Update package.json
echo "📄 Updating package.json..."
sed -i '' 's/"name": "evolution-api-backend"/"name": "chatflow-backend"/g' backend/package.json
sed -i '' 's/"description": "Multi-tenancy WhatsApp API SaaS Backend"/"description": "Multi-tenancy ChatFlow Business Messaging Backend"/g' backend/package.json
sed -i '' 's/"evolution-api"/"chatflow"/g' backend/package.json
sed -i '' 's/"Evolution API Team"/"ChatFlow Team"/g' backend/package.json

# Update database.js
echo "📄 Updating database.js..."
sed -i '' 's/'\''evolution_api'\''/'\''chatflow_api'\''/g' backend/src/config/database.js
sed -i '' 's/'\''evolution_user'\''/'\''chatflow_user'\''/g' backend/src/config/database.js

# Update app.js
echo "📄 Updating app.js..."
sed -i '' 's/Evolution API/ChatFlow/g' backend/src/app.js

# Update auth middleware
echo "📄 Updating auth middleware..."
sed -i '' 's/evolution-api/chatflow/g' backend/src/middleware/auth.js

# Update controllers
echo "📄 Updating controllers..."
for file in backend/src/controllers/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

# Update models
echo "📄 Updating models..."
for file in backend/src/models/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

# Update routes
echo "📄 Updating routes..."
for file in backend/src/routes/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

# Update services
echo "📄 Updating services..."
for file in backend/src/services/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

# Update utils
echo "📄 Updating utils..."
for file in backend/src/utils/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

# Update middleware
echo "📄 Updating middleware..."
for file in backend/src/middleware/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

echo ""
echo "✅ Backend Brand Update Complete!"
echo "================================"
echo ""
echo "🎯 Changes Made:"
echo "- Project name: evolution-api-backend → chatflow-backend"
echo "- Description: Multi-tenancy WhatsApp API → Multi-tenancy ChatFlow"
echo "- Database: evolution_* → chatflow_*"
echo "- References: Evolution API → ChatFlow"
echo "- Keywords: evolution-api → chatflow"
echo "- Author: Evolution API Team → ChatFlow Team"
echo ""
echo "📁 Files Updated:"
echo "✅ backend/package.json"
echo "✅ backend/src/config/database.js"
echo "✅ backend/src/app.js"
echo "✅ backend/src/controllers/*.js"
echo "✅ backend/src/models/*.js"
echo "✅ backend/src/routes/*.js"
echo "✅ backend/src/services/*.js"
echo "✅ backend/src/utils/*.js"
echo "✅ backend/src/middleware/*.js"
echo ""
echo "🔄 Next Steps:"
echo "1. Restart backend server"
echo "2. Test all API endpoints"
echo "3. Check database connectivity"
echo "4. Verify authentication flow"
echo "5. Test WebSocket connections"
echo ""
echo "🔧 ChatFlow Backend ready!"
