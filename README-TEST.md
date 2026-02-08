# 🧪 Evolution API Test Commands

## 📋 **Quick Test Commands**

### **1️⃣ Start Servers**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

### **2️⃣ Run Test Script**
```bash
# Make executable
chmod +x test-api.sh

# Run complete test
./test-api.sh
```

---

## 🔐 **Manual Tests**

### **Login**
```bash
curl -X POST http://localhost:8090/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### **Add Phone**
```bash
curl -X POST http://localhost:8090/api/phones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "device_name": "TestDevice",
    "phone_number": "+628123456789",
    "webhook_url": "http://localhost:3000/webhook"
  }'
```

### **Generate QR**
```bash
curl -X POST http://localhost:8090/api/phones/1/generate-qr \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Send Message**
```bash
curl -X POST http://localhost:8090/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone_id": 1,
    "to": "+628987654321",
    "message": "Hello from API!"
  }'
```

---

## 📊 **Test Results Expected**

### **✅ Success Flow:**
1. **Login** → Token received
2. **Add Phone** → Phone ID created
3. **Generate QR** → QR code URL returned
4. **Scan QR** → Phone connected
5. **Send Message** → Message sent successfully

### **🔧 Debug Commands:**
```bash
# Check server health
curl http://localhost:8090/api/health

# Check database status
curl http://localhost:8090/api/status

# View all phones
curl -H "Authorization: Bearer TOKEN" http://localhost:8090/api/phones

# View message history
curl -H "Authorization: Bearer TOKEN" "http://localhost:8090/api/messages?phone_id=1"
```

---

## 🚀 **Ready to Test!**

**Run `./test-api.sh` untuk automated testing!** 🧪✨

**Manual testing available dengan individual curl commands!** 📱🔧
