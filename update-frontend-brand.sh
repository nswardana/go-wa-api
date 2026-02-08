#!/bin/bash

# Frontend Brand Update: Evolution API → ChatFlow
# Update all frontend references to new brand

echo "🔄 Frontend Brand Update: Evolution API → ChatFlow"
echo "=============================================="

echo ""
echo "📝 Updating frontend files..."
echo "=========================="

# Update index.html
echo "📄 Updating public/index.html..."
sed -i '' 's/Evolution API/ChatFlow/g' frontend/public/index.html
sed -i '' 's/Evolution API SaaS Dashboard/ChatFlow - Business Messaging Platform/g' frontend/public/index.html

# Update package.json
echo "📄 Updating package.json..."
sed -i '' 's/evolution-api-frontend/chatflow-frontend/g' frontend/package.json

# Update Layout.js
echo "📄 Updating Layout.js..."
sed -i '' 's/admin@evolution-api.com/admin@chatflow.com/g' frontend/src/components/Layout.js

# Update Login.js
echo "📄 Updating Login.js..."
sed -i '' 's/Evolution API/ChatFlow/g' frontend/src/pages/Login.js
sed -i '' 's/Evolution API Dashboard/ChatFlow Dashboard/g' frontend/src/pages/Login.js

# Update other pages
echo "📄 Updating other pages..."
for file in frontend/src/pages/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

# Update components
echo "📄 Updating components..."
for file in frontend/src/components/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

# Update services
echo "📄 Updating services..."
for file in frontend/src/services/*.js; do
    if [ -f "$file" ]; then
        sed -i '' 's/Evolution API/ChatFlow/g' "$file"
        sed -i '' 's/evolution-api/chatflow/g' "$file"
    fi
done

echo ""
echo "✅ Frontend Brand Update Complete!"
echo "================================"
echo ""
echo "🎯 Changes Made:"
echo "- Evolution API → ChatFlow"
echo "- evolution-api → chatflow"
echo "- Evolution API Dashboard → ChatFlow Dashboard"
echo "- admin@evolution-api.com → admin@chatflow.com"
echo ""
echo "📁 Files Updated:"
echo "✅ frontend/public/index.html"
echo "✅ frontend/package.json"
echo "✅ frontend/src/components/Layout.js"
echo "✅ frontend/src/pages/Login.js"
echo "✅ frontend/src/pages/*.js"
echo "✅ frontend/src/components/*.js"
echo "✅ frontend/src/services/*.js"
echo ""
echo "🔄 Next Steps:"
echo "1. Restart frontend server"
echo "2. Test all pages for correct branding"
echo "3. Check browser title and meta tags"
echo "4. Verify email addresses and references"
echo ""
echo "🚀 ChatFlow branding ready!"
