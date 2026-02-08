# 🧪 Test Files Directory

## 📋 **Test Scripts Overview**

### **🔧 Backend API Tests**
- **`test-api.sh`** - Original comprehensive API test
- **`test-api-simple.sh`** - Simplified API test
- **`test-api-fixed.sh`** - Fixed login endpoint test
- **`test-api-working.sh`** - Working credentials test
- **`test-api-final.sh`** - Final version with registration
- **`test-complete.sh`** - Complete API test flow
- **`test-final-working.sh`** - Final working version
- **`test-fresh.sh`** - Fresh login test
- **`test-working.sh`** - Latest working version

### **🌐 Frontend Tests**
- **`test-frontend.sh`** - Basic frontend test
- **`test-frontend-interactive.sh`** - Interactive step-by-step testing
- **`test-frontend-quick.sh`** - Quick testing with browser opening
- **`test-frontend-automated.sh`** - Automated API testing

### **🔍 Debug Scripts**
- **`debug-login.sh`** - Debug login issues
- **`debug-token.sh`** - Debug token validation

### **📚 Documentation**
- **`curl-test-guide.md`** - Complete cURL test guide
- **`frontend-test-guide.md`** - Comprehensive frontend testing guide
- **`README-TEST.md`** - Quick test reference
- **`manual-test.sh`** - Manual test commands

---

## 🚀 **How to Use**

### **Backend API Testing**
```bash
# Run comprehensive API test
./tests/test-api.sh

# Run working version
./tests/test-working.sh

# Debug authentication
./tests/debug-login.sh
./tests/debug-token.sh
```

### **Frontend Testing**
```bash
# Quick frontend test with browser
./tests/test-frontend-quick.sh

# Interactive step-by-step testing
./tests/test-frontend-interactive.sh

# Automated API testing
./tests/test-frontend-automated.sh
```

### **Documentation**
```bash
# View test guides
cat tests/curl-test-guide.md
cat tests/frontend-test-guide.md
cat tests/README-TEST.md
```

---

## 📊 **Test Categories**

### **✅ Working Tests**
- `test-working.sh` - Basic functionality
- `test-frontend-quick.sh` - Frontend quick test
- `test-frontend-automated.sh` - Automated checks

### **🔧 Debug Tests**
- `debug-login.sh` - Login debugging
- `debug-token.sh` - Token debugging

### **📋 Reference Guides**
- `curl-test-guide.md` - API testing reference
- `frontend-test-guide.md` - Frontend testing reference

---

## 🎯 **Recommended Test Flow**

### **1️⃣ Quick Test**
```bash
./tests/test-working.sh
./tests/test-frontend-quick.sh
```

### **2️⃣ Comprehensive Test**
```bash
./tests/test-final-working.sh
./tests/test-frontend-automated.sh
```

### **3️⃣ Debug Issues**
```bash
./tests/debug-login.sh
./tests/debug-token.sh
```

---

## 📝 **Notes**

- All scripts are executable (`chmod +x`)
- Scripts assume servers are running on:
  - Backend: http://localhost:8090
  - Frontend: http://localhost:3000
- Default credentials: admin@example.com / Admin123
- Refer to documentation files for detailed instructions

---

## 🚀 **Ready for Testing!**

**All test files organized in `/tests/` directory!** 📁✨

**Run appropriate test script based on your needs!** 🧪🔧

**Use documentation files for reference and guidance!** 📚📋
