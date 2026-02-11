#!/bin/bash

# ChatFlow Database Backup Script
# Usage: ./backup.sh [backup_name]

BACKUP_DIR="/Users/nswardana/nodejs/SMS API/go-wa-api/database/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME=${1:-"chatflow_backup_${TIMESTAMP}"}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Creating backup: $BACKUP_NAME"

# Create database backup
docker exec -i chatflow-postgres pg_dump -U chatflow_user chatflow_api > "$BACKUP_DIR/${BACKUP_NAME}.sql"

# Compress the backup
gzip "$BACKUP_DIR/${BACKUP_NAME}.sql"

echo "Backup completed: $BACKUP_DIR/${BACKUP_NAME}.sql.gz"

# List recent backups
echo -e "\nRecent backups:"
ls -la "$BACKUP_DIR" | tail -5
