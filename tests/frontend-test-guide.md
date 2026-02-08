# 🧪 Frontend Function Testing Guide

## 📋 **Frontend Functions to Test**

### **1️⃣ Authentication Functions**
- **Login Page** (`/login`)
  - Email validation
  - Password validation  
  - Login submission
  - Error handling
  - Redirect after login

### **2️⃣ Dashboard Functions**
- **Main Dashboard** (`/`)
  - User info display
  - Navigation menu
  - Sidebar toggle
  - Profile menu
  - Logout functionality

### **3️⃣ Phone Management Functions**
- **Phones Page** (`/phones`)
  - Phone list display
  - Add phone dialog
  - Edit phone functionality
  - Delete phone confirmation
  - QR code generation
  - Connection status display
  - Real-time status updates

### **4️⃣ Message Functions**
- **Messages Page** (`/messages`)
  - Message list display
  - Send message dialog
  - Message history
  - Message status tracking
  - Search/filter messages

### **5️⃣ Template Functions**
- **Templates Page** (`/templates`)
  - Template list display
  - Create template dialog
  - Edit template functionality
  - Delete template confirmation
  - Template categories
  - Variable placeholders

### **6️⃣ API Key Functions**
- **API Keys Page** (`/api-keys`)
  - API key list display
  - Create API key dialog
  - Regenerate API key
  - Delete API key
  - Permission settings

### **7️⃣ Scheduled Messages Functions**
- **Scheduled Messages Page** (`/schedules`)
  - Scheduled list display
  - Create scheduled message
  - Edit scheduled message
  - Delete scheduled message
  - Time picker functionality
  - Status tracking

---

## 🔧 **Test Steps**

### **Step 1: Authentication Testing**
1. Navigate to `http://localhost:3000/login`
2. Test with invalid credentials
3. Test with valid credentials (`admin@example.com` / `Admin123`)
4. Verify successful login redirects to dashboard
5. Test logout functionality

### **Step 2: Dashboard Testing**
1. Verify user info display
2. Test navigation menu items
3. Test sidebar toggle
4. Test profile menu dropdown
5. Test logout from profile menu

### **Step 3: Phone Management Testing**
1. Navigate to Phones page
2. Verify phone list display
3. Test "Add Phone" dialog
4. Fill in phone details and submit
5. Test QR code generation
6. Test phone deletion
7. Verify real-time status updates

### **Step 4: Message Testing**
1. Navigate to Messages page
2. Verify message list
3. Test "Send Message" dialog
4. Select phone and recipient
5. Compose and send message
6. Verify message appears in history
7. Test search/filter functionality

### **Step 5: Template Testing**
1. Navigate to Templates page
2. Verify template list
3. Test "Create Template" dialog
4. Fill in template details with variables
5. Save template
6. Test template editing
7. Test template deletion

### **Step 6: API Key Testing**
1. Navigate to API Keys page
2. Verify API key list
3. Test "Create API Key" dialog
4. Set permissions and create key
5. Test API key regeneration
6. Test API key deletion

### **Step 7: Scheduled Messages Testing**
1. Navigate to Scheduled Messages page
2. Verify scheduled list
3. Test "Schedule Message" dialog
4. Set message details and schedule time
5. Save scheduled message
6. Test editing scheduled message
7. Test deletion of scheduled message

---

## 🎯 **Expected Behaviors**

### **✅ Authentication**
- Form validation works correctly
- Error messages display properly
- Successful login redirects to dashboard
- Token is stored and used for API calls

### **✅ Phone Management**
- Phone list loads correctly
- Add/Edit/Delete operations work
- QR codes generate and display
- Connection status updates in real-time

### **✅ Messaging**
- Messages send successfully
- Message history displays correctly
- Status indicators work
- Search/filter functions properly

### **✅ Templates**
- Templates create/edit/delete correctly
- Variable placeholders work
- Categories display properly

### **✅ API Keys**
- Keys generate with proper permissions
- Regeneration works
- Deletion works with confirmation

### **✅ Scheduled Messages**
- Scheduling works with time picker
- Messages display in schedule list
- Edit/delete operations work

---

## 🔍 **Debugging Tips**

### **Browser Console**
- Open Developer Tools (F12)
- Check Console tab for errors
- Monitor Network tab for API calls
- Verify API responses

### **Common Issues**
- **CORS errors**: Check backend CORS settings
- **Authentication errors**: Verify token storage
- **API timeouts**: Check backend server status
- **UI glitches**: Check Material-UI imports

### **Network Tab**
- Verify all API calls succeed
- Check request/response formats
- Monitor authentication headers
- Verify error responses

---

## 📊 **Test Results Checklist**

### **Authentication**
- [ ] Login form validation
- [ ] Successful login
- [ ] Failed login handling
- [ ] Logout functionality
- [ ] Token management

### **Dashboard**
- [ ] User info display
- [ ] Navigation works
- [ ] Sidebar functionality
- [ ] Profile menu
- [ ] Responsive design

### **Phones**
- [ ] Phone list display
- [ ] Add phone dialog
- [ ] QR generation
- [ ] Status updates
- [ ] Delete functionality

### **Messages**
- [ ] Message list
- [ ] Send message dialog
- [ ] Message history
- [ ] Status tracking
- [ ] Search/filter

### **Templates**
- [ ] Template list
- [ ] Create template
- [ ] Edit template
- [ ] Delete template
- [ ] Variable handling

### **API Keys**
- [ ] API key list
- [ ] Create key
- [ ] Regenerate key
- [ ] Delete key
- [ ] Permissions

### **Scheduled Messages**
- [ ] Schedule list
- [ ] Create schedule
- [ ] Edit schedule
- [ ] Delete schedule
- [ ] Time picker

---

## 🚀 **Ready for Testing!**

**Frontend is running at http://localhost:3000** 🌐

**Backend server is running at http://localhost:8090** 🔧

**Test all functions systematically using the checklist above!** ✅

**Monitor browser console for any errors during testing!** 🔍
