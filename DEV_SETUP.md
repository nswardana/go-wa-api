# Development Environment Setup

## 🗄️ Database Setup (Local PostgreSQL)

### Option A: Use Docker for Database Only
```bash
# Start only database services
docker-compose up -d postgres redis

# Wait for database to be ready
sleep 10

# Run migrations/setup if needed
```

### Option B: Install PostgreSQL Locally
```bash
# Install PostgreSQL on Mac
brew install postgresql
brew services start postgresql

# Create database
createdb evolution_api

# Create user and grant permissions
psql -d evolution_api -c "CREATE USER evolution_user WITH PASSWORD 'your_password';"
psql -d evolution_api -c "GRANT ALL PRIVILEGES ON DATABASE evolution_api TO evolution_user;"
```

## 🔧 Backend Development

### Environment Variables
Create `.env` file in backend directory:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evolution_api
DB_USER=evolution_user
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Evolution API
EVOLUTION_API_URL=http://localhost:8081
EVOLUTION_API_KEY=your_api_key

# Server
PORT=8090
NODE_ENV=development
```

### Start Backend
```bash
cd backend
npm run dev
# or
npm start
```

## 🎨 Frontend Development

### Start Frontend
```bash
cd frontend
npm start
```

## 🔄 Development Workflow

### 1. Local Development (Fast Iteration)
```bash
# Terminal 1: Database
docker-compose up -d postgres redis

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend  
cd frontend && npm start
```

### 2. Hot Reload Enabled
- ✅ Backend: Auto-restart on file changes
- ✅ Frontend: Auto-reload in browser
- ✅ Database: Persistent data

### 3. Testing
- Backend: http://localhost:8090
- Frontend: http://localhost:3000
- Database: localhost:5432

## 🐳 Docker Production Build

### When Ready for Production
```bash
# Stop local services
docker-compose down

# Build and run production containers
docker-compose up -d --build
```

## 📝 Development Tips

### Backend Hot Reload
```json
// package.json scripts
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js"
  }
}
```

### Frontend Hot Reload
```json
// package.json scripts  
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

### Environment Management
```bash
# Development
cp .env.example .env.development
# Edit .env.development

# Production  
cp .env.example .env.production
# Edit .env.production
```

## 🎯 Benefits

### ✅ Before (Current)
- Code change → docker build → restart → test (5-10 minutes)
- No hot reload
- Slow iteration

### ✅ After (Proposed)
- Code change → auto-reload → test (seconds)
- Hot reload enabled
- Fast iteration
- Better debugging

## 🔄 Switching Between Modes

### From Local to Docker
```bash
# Stop local services
pkill -f "node.*app.js"
pkill -f "react-scripts"

# Start Docker
docker-compose up -d --build
```

### From Docker to Local
```bash
# Stop Docker
docker-compose down

# Start local services
npm run dev  # backend
npm start   # frontend
```
