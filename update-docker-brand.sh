#!/bin/bash

# Docker Compose Brand Update: Evolution API → ChatFlow
# Update all Docker Compose references to new brand

echo "🐳 Docker Compose Brand Update: Evolution API → ChatFlow"
echo "=================================================="

echo ""
echo "📝 Updating docker-compose.yml..."
echo "================================"

# Backup original file
cp docker-compose.yml docker-compose.yml.backup

echo "📄 Updating container names..."
sed -i '' 's/evolution-postgres/chatflow-postgres/g' docker-compose.yml
sed -i '' 's/evolution-redis/chatflow-redis/g' docker-compose.yml
sed -i '' 's/evolution-api-1/chatflow-api-1/g' docker-compose.yml
sed -i '' 's/evolution-api-2/chatflow-api-2/g' docker-compose.yml
sed -i '' 's/evolution-nginx/chatflow-nginx/g' docker-compose.yml
sed -i '' 's/evolution-backend/chatflow-backend/g' docker-compose.yml
sed -i '' 's/evolution-frontend/chatflow-frontend/g' docker-compose.yml

echo "📄 Updating database names..."
sed -i '' 's/evolution_api/chatflow_api/g' docker-compose.yml
sed -i '' 's/evolution_user/chatflow_user/g' docker-compose.yml

echo "📄 Updating environment variables..."
sed -i '' 's/EVOLUTION_API_KEY/CHATFLOW_API_KEY/g' docker-compose.yml
sed -i '' 's/MySecureEvolutionKey2024!/MySecureChatFlowKey2024!/g' docker-compose.yml
sed -i '' 's/EVOLUTION_API_URL/CHATFLOW_API_URL/g' docker-compose.yml
sed -i '' 's/EVOLUTION_INSTANCE_1/CHATFLOW_INSTANCE_1/g' docker-compose.yml
sed -i '' 's/EVOLUTION_INSTANCE_2/CHATFLOW_INSTANCE_2/g' docker-compose.yml

echo "📄 Updating network names..."
sed -i '' 's/evolution-network/chatflow-network/g' docker-compose.yml

echo "📄 Updating volume names..."
sed -i '' 's/evolution_data_1/chatflow_data_1/g' docker-compose.yml
sed -i '' 's/evolution_data_2/chatflow_data_2/g' docker-compose.yml

echo "📄 Updating server URLs..."
sed -i '' 's/evolution-api.beeasy.id/chatflow.beeasy.id/g' docker-compose.yml

echo ""
echo "✅ Docker Compose Brand Update Complete!"
echo "====================================="
echo ""
echo "🎯 Changes Made:"
echo "- Container names: evolution-* → chatflow-*"
echo "- Database names: evolution_* → chatflow_*"
echo "- Environment variables: EVOLUTION_* → CHATFLOW_*"
echo "- Network names: evolution-network → chatflow-network"
echo "- Volume names: evolution_data_* → chatflow_data_*"
echo "- Server URLs: evolution-api.beeasy.id → chatflow.beeasy.id"
echo ""
echo "📁 Files Updated:"
echo "✅ docker-compose.yml"
echo "✅ docker-compose.yml.backup (backup)"
echo ""
echo "🔄 Next Steps:"
echo "1. Review updated docker-compose.yml"
echo "2. Test Docker Compose configuration"
echo "3. Update environment variables in .env file"
echo "4. Update SSL certificates for new domain"
echo "5. Restart Docker services"
echo ""
echo "🐳 ChatFlow Docker configuration ready!"
