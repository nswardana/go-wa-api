# 🧪 Evolution API cURL Test Guide

## 📋 **Test Steps**

### **1️⃣ Start Backend Server**
```bash
cd backend
npm start
```

### **2️⃣ Start Frontend Server**
```bash
cd frontend
npm start
```

---

## 🔐 **Authentication Tests**

### **Login Test**
```bash
curl -X POST http://localhost:8090/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

---

## 📱 **Phone Number Tests**

### **Add Phone Number**
```bash
curl -X POST http://localhost:8090/api/phones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "device_name": "TestDevice",
    "phone_number": "+628123456789",
    "webhook_url": "http://localhost:3000/webhook",
    "webhook_secret": "webhook_secret"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "phone": {
    "id": 1,
    "device_name": "TestDevice",
    "phone_number": "+628123456789",
    "is_connected": false,
    "webhook_url": "http://localhost:3000/webhook"
  }
}
```

### **Get All Phones**
```bash
curl -X GET http://localhost:8090/api/phones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Generate QR Code**
```bash
curl -X POST http://localhost:8090/api/phones/1/generate-qr \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "qrCode": "http://localhost:8081/qr/test-device.png",
  "message": "QR code generated successfully"
}
```

### **Get Phone Status**
```bash
curl -X GET http://localhost:8090/api/phones/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "connected": true,
  "status": "connected"
}
```

---

## 💬 **Message Tests**

### **Send Text Message**
```bash
curl -X POST http://localhost:8090/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone_id": 1,
    "to": "+628987654321",
    "message": "Hello from Evolution API!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": {
    "id": 1,
    "phone_id": 1,
    "to": "+628987654321",
    "message": "Hello from Evolution API!",
    "status": "sent",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### **Send Media Message**
```bash
curl -X POST http://localhost:8090/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone_id": 1,
    "to": "+628987654321",
    "message": "Check out this image!",
    "media_url": "https://example.com/image.jpg",
    "media_type": "image"
  }'
```

### **Get Message History**
```bash
curl -X GET "http://localhost:8090/api/messages?phone_id=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 **Template Tests**

### **Create Message Template**
```bash
curl -X POST http://localhost:8090/api/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Welcome Template",
    "content": "Hello {{name}}, welcome to our service!",
    "variables": ["name"]
  }'
```

### **Send Template Message**
```bash
curl -X POST http://localhost:8090/api/messages/send-template \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone_id": 1,
    "to": "+628987654321",
    "template_name": "Welcome Template",
    "variables": {
      "name": "John Doe"
    }
  }'
```

---

## ⏰ **Scheduled Message Tests**

### **Schedule Message**
```bash
curl -X POST http://localhost:8090/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone_id": 1,
    "to": "+628987654321",
    "message": "Scheduled message!",
    "scheduled_at": "2024-01-01T15:00:00Z"
  }'
```

### **Get Scheduled Messages**
```bash
curl -X GET http://localhost:8090/api/schedules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 **API Key Tests**

### **Create API Key**
```bash
curl -X POST http://localhost:8090/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test API Key",
    "permissions": ["send_message", "read_messages"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "api_key": {
    "id": 1,
    "name": "Test API Key",
    "key": "ak_test_1234567890abcdef",
    "permissions": ["send_message", "read_messages"]
  }
}
```

---

## 📊 **Complete Test Script**

### **Full Test Sequence**
```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:8090"
EMAIL="admin@example.com"
PASSWORD="admin123"

echo "🧪 Evolution API Test Script"
echo "=========================="

# 1. Login
echo "1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 2. Add Phone
echo "2. Adding Phone Number..."
PHONE_RESPONSE=$(curl -s -X POST $BASE_URL/api/phones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "device_name": "TestDevice",
    "phone_number": "+628123456789",
    "webhook_url": "http://localhost:3000/webhook"
  }')

PHONE_ID=$(echo $PHONE_RESPONSE | jq -r '.phone.id')
echo "Phone ID: $PHONE_ID"

# 3. Generate QR
echo "3. Generating QR Code..."
curl -s -X POST $BASE_URL/api/phones/$PHONE_ID/generate-qr \
  -H "Authorization: Bearer $TOKEN"

# 4. Check Status
echo "4. Checking Phone Status..."
curl -s -X GET $BASE_URL/api/phones/$PHONE_ID/status \
  -H "Authorization: Bearer $TOKEN"

# 5. Send Message
echo "5. Sending Message..."
curl -s -X POST $BASE_URL/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"phone_id\": $PHONE_ID,
    \"to\": \"+628987654321\",
    \"message\": \"Hello from Evolution API!\"
  }"

echo "✅ Test Complete!"
```

---

## 🔍 **Debugging Tips**

### **Check Server Status**
```bash
curl -X GET http://localhost:8090/api/health
```

### **Check Database Connection**
```bash
curl -X GET http://localhost:8090/api/status
```

### **View Logs**
```bash
# Backend logs
cd backend && npm run logs

# Frontend logs
cd frontend && npm run logs
```

---

## 📝 **Notes**

1. **Replace `YOUR_TOKEN_HERE`** dengan actual token dari login response
2. **Make sure Evolution API** running di `http://localhost:8081`
3. **PostgreSQL database** harus running
4. **QR Code scanning** required untuk connect phone
5. **Webhook URL** harus accessible untuk receive messages

---

## 🚀 **Ready to Test!**

**Run script di atas untuk test complete functionality!** 🧪✨
