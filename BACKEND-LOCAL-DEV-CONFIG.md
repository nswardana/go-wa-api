# 🔧 Backend Local Development Configuration

## ✅ **Backend Configuration Already Correct!**

### **📊 Current Setup Analysis:**

#### **🔍 Backend Configuration:**
```javascript
// evolutionService.js - Line 11-16
const isDevelopment = process.env.NODE_ENV === 'development';

this.instances = {
  'chatflow-1': {
    url: isDevelopment ? 'http://localhost:8081' : 'http://chatflow-1:3000',  // ✅ Correct for local dev
    apiKey: process.env.EVOLUTION_API_KEY_1 || 'admin'
  },
  'chatflow-2': {
    url: isDevelopment ? 'http://localhost:8082' : 'http://chatflow-2:3000',  // ✅ Correct for local dev
    apiKey: process.env.EVOLUTION_API_KEY_2 || 'admin'
  }
};
```

#### **🔍 Database Configuration:**
```javascript
// database.js - Line 8
const pool = new Pool({
  host: isDevelopment ? 'localhost' : process.env.DB_HOST || 'localhost',  // ✅ Correct for local dev
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatflow_api',
  user: process.env.DB_USER || 'chatflow_user',
  password: process.env.DB_PASSWORD || 'Bismillah313!',
  // ...
});
```

---

## 🚨 **Issue: Database Connection**

### **🔍 Problem Identified:**

#### **📊 Error from Logs:**
```
FATAL: role "chatflow_user" does not exist
```

#### **🚨 Root Cause:**
- **Backend Local** - Mencoba connect ke localhost:5432
- **Database Docker** - PostgreSQL container dengan user yang berbeda
- **User Mismatch** - `chatflow_user` tidak ada di container

---

## 🔧 **Solution: Fix Database Connection**

### **🔧 Option 1: Use PostgreSQL Container User**

#### **📋 Check Container User:**
```bash
# Cek user yang ada di container
docker exec chatflow-postgres psql -l
```

#### **🔧 Update Backend Config:**
```javascript
// database.js
const pool = new Pool({
  host: isDevelopment ? 'localhost' : process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatflow_api',
  user: process.env.DB_USER || 'postgres',  // ✅ Use postgres user
  password: process.env.DB_PASSWORD || 'postgres',  // ✅ Use postgres password
  // ...
});
```

### **🔧 Option 2: Create chatflow_user in Container**

#### **📋 Create User:**
```bash
# Buat user chatflow_user di container
docker exec chatflow-postgres psql -U postgres -c "
CREATE USER chatflow_user WITH PASSWORD 'Bismillah313!';
GRANT ALL PRIVILEGES ON DATABASE chatflow_api TO chatflow_user;
"
```

---

## 🚀 **Recommended Solution**

### **✅ Option 1: Use postgres User (Easier)**

#### **🔧 Update .env File:**
```bash
# Di folder backend/
echo "NODE_ENV=development" > .env
echo "DB_HOST=localhost" >> .env
echo "DB_PORT=5432" >> .env
echo "DB_NAME=chatflow_api" >> .env
echo "DB_USER=postgres" >> .env
echo "DB_PASSWORD=postgres" >> .env
echo "EVOLUTION_API_KEY_1=admin" >> .env
echo "EVOLUTION_API_KEY_2=admin" >> .env
```

#### **🔧 Or Update database.js Directly:**
```javascript
// database.js
const pool = new Pool({
  host: isDevelopment ? 'localhost' : process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatflow_api',
  user: isDevelopment ? 'postgres' : process.env.DB_USER || 'chatflow_user',  // ✅ Local dev use postgres
  password: isDevelopment ? 'postgres' : process.env.DB_PASSWORD || 'Bismillah313!',  // ✅ Local dev use postgres
  // ...
});
```

---

## 🔧 **Quick Fix Steps**

### **📋 Immediate Actions:**

#### **1️⃣ Stop Backend:**
```bash
# Di folder backend/
Ctrl+C atau kill process
```

#### **2️⃣ Update Configuration:**
```bash
# Edit backend/src/config/database.js
# Ganti user dan password untuk development
```

#### **3️⃣ Start Backend:**
```bash
# Di folder backend/
npm install
npm run dev
```

#### **4️⃣ Test Connection:**
```bash
# Test backend health
curl http://localhost:8090/health
```

---

## 🎯 **Expected Result**

### **✅ After Fix:**

#### **📱 Backend Local Development:**
- **Database Connection** - ✅ Connect ke PostgreSQL container
- **ChatFlow API** - ✅ Connect ke localhost:8081/8082
- **QR Generation** - ✅ Working dengan proper response
- **Frontend** - ✅ Connect ke backend lokal

#### **🔧 Development Workflow:**
```
Frontend (Docker) → Backend (Local) → Database (Docker)
                    ↓
            ChatFlow API (Docker)
```

---

## 🚀 **Backend Local Development Ready!**

**Configuration sudah correct untuk local development!** 🔧✨

**Tinggal fix database user connection!** 🗄️🔧

**QR generation akan work setelah fix!** 📱✅

**ChatFlow local development siap!** 🚀🌟

**ChatFlow - Streamline Your Business Messaging!** 💼📱
