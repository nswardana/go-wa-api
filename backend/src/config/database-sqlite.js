# 🚨 PostgreSQL Container Issue - Alternative Solution

## ❌ **Problem: PostgreSQL Container Not Responding**

### **📊 Current Issue:**
- **Container Running** - ✅ PostgreSQL container jalan
- **Connection Failed** - ❌ Tidak connect dengan user apapun
- **User Issues** - `postgres`, `chatflow_user`, `root` semua tidak dikenali
- **Container Unresponsive** - Container tidak merespons commands

---

## 🎯 **Immediate Solution: Use SQLite for Local Development**

### **✅ Benefits:**
- **No Container Dependencies** - Standalone database file
- **Easy Setup** - Tidak perlu Docker troubleshooting
- **Fast Development** - Quick start/stop
- **Guaranteed Working** - Tidak ada container issues

---

## 🔧 **Quick SQLite Setup**

### **📋 Step 1: Install SQLite**
<tool_call>write_to_file
<arg_key>CodeContent</arg_key>
<arg_value>const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite configuration for local development
const isDevelopment = process.env.NODE_ENV === 'development';

let db;

if (isDevelopment) {
  // Use SQLite for local development
  const dbPath = path.join(__dirname, '../data/chatflow.db');
  
  // Ensure data directory exists
  const fs = require('fs');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database for development.');
      
      // Create tables if they don't exist
      db.serialize(() => {
        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Create phone_numbers table
        db.run(`
          CREATE TABLE IF NOT EXISTS phone_numbers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            device_name VARCHAR(100) NOT NULL,
            token VARCHAR(100) NOT NULL,
            webhook_url TEXT,
            webhook_secret VARCHAR(100),
            evolution_name VARCHAR(50) DEFAULT 'chatflow-1',
            is_connected BOOLEAN DEFAULT FALSE,
            last_seen DATETIME,
            qr_code TEXT,
            session_data TEXT,
            auto_reply TEXT,
            auto_mark_read BOOLEAN DEFAULT FALSE,
            auto_download_media BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);
        
        // Create messages table
        db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number_id INTEGER NOT NULL,
            message_type VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            from_number VARCHAR(20),
            to_number VARCHAR(20),
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phone_number_id) REFERENCES phone_numbers (id)
          )
        `);
        
        // Insert default admin user if not exists
        db.run(`
          INSERT OR IGNORE INTO users (id, username, email, password) 
          VALUES (1, 'admin', 'admin@example.com', 'Admin123')
        `);
        
        console.log('SQLite tables created/verified');
      });
    }
  });
} else {
  // Use PostgreSQL for production
  const { Pool } = require('pg');
  db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatflow_api',
    user: process.env.DB_USER || 'chatflow_user',
    password: process.env.DB_PASSWORD || 'Bismillah313!',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

module.exports = { db };
