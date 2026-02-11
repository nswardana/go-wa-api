# ✅ Persistent Database Setup Complete!

## 🎉 **Database Tables Now Persist Across Container Restarts**

---

## 📊 **Problem Solved:**

### **🔍 Previous Issue:**
- **Docker Volume** - Data hilang saat container dihapus
- **Manual Tables** - Harus dibuat ulang setiap restart
- **Inconsistent** - Database state tidak persisten

### **✅ Solution Applied:**

#### **1️⃣ Complete Init Script:**
- **File**: `database/init-complete.sql`
- **Tables**: 7 tables dengan schema lengkap
- **Indexes**: Performance indexes untuk semua tables
- **Auto-execution**: Jalan otomatis saat container start

#### **2️⃣ Docker Compose Update:**
- **Volume Mount**: `./database/init-complete.sql:/docker-entrypoint-initdb.d/init-complete.sql`
- **Persistent Volume**: `postgres_data:/var/lib/postgresql/data`
- **Auto-initialization**: Tables dibuat otomatis

#### **3️⃣ Setup Script:**
- **File**: `setup-persistent-db.sh`
- **Interactive**: Pilihan untuk keep/delete existing data
- **Complete Setup**: Start semua services dengan benar
- **Verification**: Test semua tables dan services

---

## 🎯 **Current Database Schema:**

### **✅ Tables Created:**
```sql
-- 1. users - User management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. phone_numbers - Phone number management
CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    token VARCHAR(100) NOT NULL,
    webhook_url TEXT,
    webhook_secret VARCHAR(100),
    evolution_name VARCHAR(50) DEFAULT 'chatflow-1',
    is_connected BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    qr_code TEXT,
    session_data TEXT,
    auto_reply TEXT,
    auto_mark_read BOOLEAN DEFAULT FALSE,
    auto_download_media BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. messages - Message history
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    phone_number_id INTEGER NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. message_templates - Template management
CREATE TABLE message_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. api_usage - API usage tracking
CREATE TABLE api_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. rate_limits - Rate limiting
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    window_start TIMESTAMP NOT NULL,
    request_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. webhook_events - Webhook event logging
CREATE TABLE webhook_events (
    id SERIAL PRIMARY KEY,
    phone_number_id INTEGER NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);
```

---

## 🚀 **How It Works:**

### **📋 Container Startup Process:**
1. **PostgreSQL Starts** - Container jalan dengan volume `postgres_data`
2. **Init Script Runs** - `init-complete.sql` dijalankan otomatis
3. **Tables Created** - Semua tables dibuat dengan `IF NOT EXISTS`
4. **Indexes Created** - Performance indexes dibuat otomatis
5. **Data Preserved** - Existing data di volume tetap ada
6. **User Created** - Default admin user di-insert jika belum ada

### **📋 Data Persistence:**
- **Volume**: `postgres_data` - Docker volume untuk persistent storage
- **Location**: `/var/lib/postgresql/data` di dalam container
- **Backup**: Data survive container restart/recreate
- **Migration**: Schema updates handled dengan `IF NOT EXISTS`

---

## 🔧 **Usage Instructions:**

### **📋 Start Development Environment:**
```bash
# Option 1: Use setup script (recommended)
./setup-persistent-db.sh

# Option 2: Manual start
docker-compose up -d postgres redis chatflow-api-1 chatflow-api-2
cd backend && NODE_ENV=development npm run dev
cd frontend && npm start
```

### **📋 Restart Database:**
```bash
# Restart dengan data preserved
docker-compose restart postgres

# Atau
docker-compose down && docker-compose up -d postgres
```

### **📋 Reset Database (jika perlu):**
```bash
# Hapus semua data dan mulai fresh
docker-compose down
docker volume rm postgres_data
docker-compose up -d postgres
```

---

## ✅ **Benefits:**

### **🎯 Advantages:**
- **🔄 Automatic Setup** - Tidak perlu manual table creation
- **💾 Data Persistence** - Data tidak hilang saat restart
- **🚀 Fast Development** - Langsung bisa mulai development
- **📊 Complete Schema** - Semua tables yang dibutuhkan ada
- **🔍 Easy Debugging** - Konsistent database state
- **📈 Scalable** - Mudah tambah tables baru

---

## 🌐 **Access URLs:**

### **✅ Development Environment:**
- **Frontend**: http://localhost:3000 (React local)
- **Backend**: http://localhost:8090 (Node.js local)
- **Database**: PostgreSQL container (localhost:5432)
- **Redis**: Redis container (localhost:6379)
- **ChatFlow API-1**: http://localhost:8081 (Docker)
- **ChatFlow API-2**: http://localhost:8082 (Docker)

---

## 🎉 **Persistent Database Setup Complete!**

**✅ Database tables sekarang persisten!** 💾🗄️

**✅ Tidak perlu manual setup lagi!** 🚫🛠️

**✅ Development environment siap!** 🚀🌟

**ChatFlow - Streamline Your Business Messaging!** 💼📱

---

## 🔧 **Files Created:**

### **📋 Configuration Files:**
- **✅ `database/init-complete.sql`** - Complete database initialization script
- **✅ `docker-compose.yml`** - Updated dengan init script mount
- **✅ `setup-persistent-db.sh`** - Automated setup script

### **📋 Next Steps:**
1. **Start Development**: `./setup-persistent-db.sh`
2. **Test QR Generation**: http://localhost:3000/phones
3. **Test Templates**: http://localhost:3000/templates
4. **Develop Features**: Backend dan frontend siap digunakan
