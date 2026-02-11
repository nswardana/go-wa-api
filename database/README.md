# ChatFlow Database Management

## Overview

This directory contains the complete database schema and management scripts for ChatFlow application.

## Files

### Schema Files
- `init-complete.sql` - Complete database initialization script with all tables
- `init.sql` - Basic initialization script (legacy)

### Migration Files
- `migrations/` - Individual migration files for incremental updates
  - `001_initial_schema.sql` - Initial schema
  - `002_add_contacts.sql` - Contacts and categories
  - `003_broadcasts.sql` - Broadcasting system
  - `004_auto_reply_schema.sql` - Auto-reply system
  - `005_auto_reply_phone_numbers.sql` - Phone number filtering for auto-reply

### Management Scripts
- `backup.sh` - Database backup script
- `restore.sh` - Database restore script

## Database Tables

### Core Tables
- `users` - User accounts and authentication
- `phone_numbers` - WhatsApp phone numbers and configurations
- `messages` - Message history and tracking

### Feature Tables
- `contacts` - Contact management
- `contact_categories` - Contact categorization
- `message_templates` - Message templates
- `broadcasts` - Broadcasting campaigns
- `scheduled_messages` - Scheduled message delivery

### Auto-Reply System
- `auto_reply_configs` - Auto-reply configurations
- `auto_reply_menus` - Interactive menu system
- `auto_reply_sessions` - User session tracking
- `auto_reply_logs` - Interaction logging

### System Tables
- `api_usage` - API usage tracking
- `webhook_events` - Webhook event logging
- `external_whatsapp_providers` - External provider configurations

## Deployment

### Fresh Deployment

For a fresh deployment, the database will be automatically initialized using `init-complete.sql` when the PostgreSQL container starts.

### Existing Deployment

For existing deployments, run migrations in order:

```bash
# Apply migrations in order
docker exec -i chatflow-postgres psql -U chatflow_user -d chatflow_api < migrations/001_initial_schema.sql
docker exec -i chatflow-postgres psql -U chatflow_user -d chatflow_api < migrations/002_add_contacts.sql
docker exec -i chatflow-postgres psql -U chatflow_user -d chatflow_api < migrations/003_broadcasts.sql
docker exec -i chatflow-postgres psql -U chatflow_user -d chatflow_api < migrations/004_auto_reply_schema.sql
docker exec -i chatflow-postgres psql -U chatflow_user -d chatflow_api < migrations/005_auto_reply_phone_numbers.sql
```

## Backup and Restore

### Create Backup

```bash
# Create timestamped backup
./backup.sh

# Create named backup
./backup.sh "production_backup_$(date +%Y%m%d)"
```

### Restore Database

```bash
# List available backups
./restore.sh

# Restore from specific backup
./restore.sh "chatflow_backup_20240210_120000.sql.gz"
```

## Schema Updates

When making schema changes:

1. Create a new migration file in `migrations/` directory
2. Update `init-complete.sql` with the new schema
3. Test the migration on a development environment
4. Update this README with new tables/columns

## Important Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` for consistency
- All tables have proper foreign key constraints with CASCADE delete
- Indexes are created for performance optimization
- Triggers automatically update `updated_at` columns
- The database uses UUID extension for generating unique identifiers

## Auto-Reply System

The auto-reply system supports:
- Keyword-based message triggering
- Interactive menu navigation
- Phone number-specific configurations
- Session management and logging
- Multi-level menu support

## Webhook Integration

The system supports webhook integration with:
- go-whatsapp-web-multidevice format
- Legacy Evolution API format
- Message type detection (text, image, video, audio)
- Group message handling

## Performance Considerations

- Indexes are created on frequently queried columns
- GIN indexes are used for array columns (phone_numbers, categories)
- JSONB is used for flexible data storage
- Connection pooling is configured in the application

## Security

- All tables have proper user_id constraints for multi-tenancy
- Sensitive data is properly indexed and secured
- Database user has limited privileges
- Webhook secrets are stored securely
