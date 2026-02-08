# 🔍 ChatFlow Login Issue Diagnosis

## 🚨 **Current Problem:**
**User tidak bisa login ke ChatFlow**

---

## 🔧 **Manual Fix Steps**

### **📊 Server Status Check:**

#### **1. Backend Server:**
```bash
# Check if backend running
curl -s http://localhost:8090/api/health

# Expected: {"status":"healthy","timestamp":"..."}
# If error: Server tidak berjalan
```

#### **2. Frontend Server:**
```bash
# Check if frontend running
curl -s http://localhost:3000

# Expected: HTML content with ChatFlow branding
# If error: Frontend tidak berjalan
```

### **🚀 Start Servers (if needed):**

#### **Backend:**
```bash
cd backend
npm run dev
# Port: 8090
```

#### **Frontend:**
```bash
cd frontend
npm start
# Port: 3000
```

### **🔐 Test Login:**

#### **API Test:**
```bash
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}'

# Expected: {"token":"...","user":{...},"message":"Login successful"}
```

#### **Frontend Test:**
1. **Buka browser**: http://localhost:3000
2. **Login page**: Harus menampilkan "Welcome to ChatFlow Dashboard"
3. **Login credentials**: admin@example.com / Admin123
4. **Redirect**: Seharusnya ke dashboard setelah login

---

## 🔍 **Common Issues & Solutions:**

### **❌ Issue 1: Backend Server Tidak Berjalan**
**Symptoms:**
- Connection refused saat curl ke port 8090
- Error: "curl: (7) Failed to connect to localhost port 8090"

**Solution:**
```bash
cd backend
npm run dev
```

### **❌ Issue 2: Frontend Server Tidak Berjalan**
**Symptoms:**
- Connection refused saat curl ke port 3000
- Error: "curl: (7) Failed to connect to localhost port 3000"

**Solution:**
```bash
cd frontend
npm start
```

### **❌ Issue 3: Database Connection Error**
**Symptoms:**
- Login API returns 500 error
- Backend logs: "Database connection error"

**Solution:**
```bash
# Check PostgreSQL
brew services list | grep postgresql
# Atau
docker ps | grep postgres

# Restart jika perlu
brew services restart postgresql
# Atau
docker restart postgres_container_name
```

### **❌ Issue 4: Environment Variable Mismatch**
**Symptoms:**
- Login API returns "Token is not valid"
- JWT secret inconsistency

**Solution:**
```bash
# Set consistent JWT_SECRET
export JWT_SECRET=ChatFlowSecureSecret2024!

# Atau update .env file
echo "JWT_SECRET=ChatFlowSecureSecret2024!" >> .env
```

### **❌ Issue 5: Port Conflict**
**Symptoms:**
- Error: "Port 3000 already in use"
- Error: "Port 8090 already in use"

**Solution:**
```bash
# Kill processes using ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8090 | xargs kill -9

# Atau gunakan port lain
export PORT=8091
```

---

## 🛠️ **Quick Fix Commands:**

### **🔄 Restart All Services:**
```bash
# Kill existing processes
pkill -f "node.*app.js"
pkill -f "react-scripts"

# Start backend
cd backend && npm run dev &

# Start frontend
cd frontend && npm start &

# Check status
sleep 5
curl -s http://localhost:8090/api/health
curl -s http://localhost:3000
```

### **🔐 Test Login:**
```bash
# Test login API
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}'

# Test frontend
open http://localhost:3000
```

---

## 🌐 **Access URLs:**

- **Frontend**: http://localhost:3000
- **Login Page**: http://localhost:3000/login
- **Backend API**: http://localhost:8090
- **Health Check**: http://localhost:8090/api/health

---

## 🎯 **Expected Results:**

### **✅ Success Indicators:**
- Backend health check returns `{"status":"healthy"}`
- Frontend loads with ChatFlow branding
- Login API returns token successfully
- Browser redirects to dashboard after login

### **❌ Failure Indicators:**
- Connection refused errors
- 500 Internal Server Error
- "Token is not valid" errors
- CORS errors

---

## 🚀 **Action Plan:**

### **Step 1: Check Server Status**
1. Jalankan command di bawah untuk cek server
2. Pastikan backend dan frontend berjalan

### **Step 2: Test Login**
1. Buka http://localhost:3000
2. Login dengan admin@example.com / Admin123
3. Verifikasi berhasil login ke dashboard

### **Step 3: Debug Issues**
1. Jika masih tidak bisa, cek browser console (F12)
2. Cek network tab untuk API calls
3. Cek backend logs untuk error messages

---

## 🔧 **ChatFlow Login Fix Ready!**

**Ikuti langkah-langkah di atas untuk memperbaiki login!** 🛠️✨

**ChatFlow - Streamline Your Business Messaging!** 📱💼
