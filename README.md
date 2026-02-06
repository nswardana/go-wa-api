# Evolution API - Multi-tenancy WhatsApp SaaS

Multi-tenancy WhatsApp API SaaS platform built with Node.js, PostgreSQL, Redis, and Docker. Supports multiple users with multiple phone numbers, load balancing, and real-time webhooks.

## Features

### Core Features
- **Multi-tenancy**: 1 User → Multiple Phone Numbers
- **Authentication**: User API Key + JWT Token
- **Load Balancing**: 2 Evolution API instances with Nginx
- **Database**: PostgreSQL with optimized schema
- **Caching**: Redis for queue & sessions
- **Messaging**: Text & media messages support
- **Webhooks**: Real-time event notifications
- **Statistics**: Message tracking & analytics
- **Security**: Rate limiting, authentication, bcrypt

### Technical Features
- **Docker**: Full containerized deployment
- **Load Balancer**: Nginx with health checks
- **WebSocket**: Real-time updates
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston with structured logs
- **Monitoring**: Health checks and metrics

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Nginx (LB)    │    │   Frontend      │
│   Port 8080     │    │   React App     │
└─────────┬───────┘    └─────────────────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐
│ API 1 │   │ API 2 │
│ 8081  │   │ 8082  │
└───┬───┘   └───┬───┘
    │           │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ Backend   │
    │ Node.js   │
    │ Port 8090 │
    └─────┬─────┘
          │
    ┌─────▼─────┐    ┌─────────────────┐
    │ PostgreSQL│    │     Redis       │
    │ Port 5432 │    │   Port 6379     │
    └───────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evolution_api
DB_USER=evolution_user
DB_PASSWORD=Bismillah313!

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=random_jwt_secret_string_123
JWT_EXPIRES_IN=24h

# Evolution API
EVOLUTION_API_KEY=MySecureEvolutionKey2024!
SERVER_URL=https://evolution-api.beeasy.id

# Server
PORT=8090
NODE_ENV=development
```

### Docker Deployment

1. **Clone and setup**:
```bash
git clone <repository>
cd evolution-api
cp backend/.env.example backend/.env
# Edit .env with your configuration
```

2. **Start services**:
```bash
docker-compose up -d
```

3. **Check services**:
```bash
docker-compose ps
docker-compose logs -f
```

4. **Access services**:
- API: http://localhost:8080/api
- Manager: http://localhost:3000/manager
- API Docs: http://localhost:8080/api-docs
- Health: http://localhost:8080/health

### Local Development

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Setup database**:
```bash
# Create database
createdb evolution_api

# Run migrations
npm run migrate
```

3. **Start backend**:
```bash
npm run dev
```

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### API Key Authentication
```http
POST /api/auth/api-key
Content-Type: application/json

{
  "apiKey": "ev_your_api_key_here"
}
```

### Phone Numbers

#### Add Phone Number
```http
POST /api/phones
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+628123456789",
  "deviceName": "My Device",
  "webhookUrl": "https://your-domain.com/webhook"
}
```

#### Get Phone Numbers
```http
GET /api/phones
Authorization: Bearer <token>
```

### Messages

#### Send Message
```http
POST /api/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneId": 1,
  "to": "+628987654321",
  "message": "Hello World!",
  "type": "text"
}
```

#### Get Messages
```http
GET /api/messages?phoneId=1&limit=50&offset=0
Authorization: Bearer <token>
```

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Bcrypt hash
- `api_key` - Unique API key
- `jwt_secret` - JWT signing secret
- `is_active` - Account status

### Phone Numbers Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `phone_number` - WhatsApp phone number
- `token` - Unique phone token
- `webhook_url` - Webhook endpoint
- `is_connected` - Connection status
- `session_data` - WhatsApp session

### Messages Table
- `id` - Primary key
- `phone_number_id` - Foreign key
- `message_id` - WhatsApp message ID
- `from_number` - Sender number
- `to_number` - Recipient number
- `content` - Message content
- `status` - Message status

## Load Balancing

Nginx distributes traffic between two Evolution API instances:

```nginx
upstream evolution_backend {
    least_conn;
    server evolution-api-1:3000 max_fails=3 fail_timeout=30s;
    server evolution-api-2:3000 max_fails=3 fail_timeout=30s;
}
```

Health checks ensure failed instances are removed from rotation.

## Webhooks

Configure webhooks for real-time events:

```json
{
  "event": "message",
  "data": {
    "phoneId": 1,
    "from": "+628123456789",
    "message": "Hello!",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

Supported events:
- `message` - New message received
- `message.ack` - Message acknowledged
- `message.reaction` - Message reaction
- `group.participants` - Group participant changes

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authenticated users: Higher limits
- API endpoints: Custom limits

## Security

- JWT tokens with user-specific secrets
- API key authentication
- Rate limiting
- Input validation
- SQL injection protection
- XSS protection
- CORS configuration

## Monitoring

### Health Checks
- `/health` - Service health
- Database connectivity
- Redis connectivity
- Evolution API instances

### Logging
- Structured JSON logs
- Request/response logging
- Error tracking
- Performance metrics

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Backend port | `8090` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `evolution_api` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `EVOLUTION_API_KEY` | Evolution API key | - |
| `SERVER_URL` | Public URL | - |

## Development

### Project Structure
```
├── backend/
│   ├── src/
│   │   ├── config/     # Database and app config
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, validation, etc.
│   │   ├── models/     # Database models
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── utils/      # Helper functions
│   ├── uploads/        # File uploads
│   ├── logs/          # Log files
│   └── package.json
├── database/
│   └── schema.sql     # Database schema
├── nginx/
│   └── nginx.conf     # Nginx configuration
├── docker-compose.yml # Docker services
└── README.md
```

### Running Tests
```bash
cd backend
npm test
```

### Code Quality
```bash
npm run lint
npm run format
```

## Deployment

### Production Deployment

1. **Setup SSL certificates**:
```bash
# Place certificates in nginx/ssl/
cert.pem
key.pem
```

2. **Configure environment**:
```bash
NODE_ENV=production
```

3. **Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling

- Add more Evolution API instances
- Configure Nginx upstream
- Scale PostgreSQL with read replicas
- Use Redis cluster

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@beeasy.id
- Documentation: https://docs.evolution-api.beeasy.id

## License

MIT License - see LICENSE file for details.
