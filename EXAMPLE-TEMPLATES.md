# 📝 Example Message Templates

## 🎉 **Templates Successfully Created!**

---

## 📊 **Templates Created:**

### **✅ Total Templates: 3**

#### **1️⃣ Welcome Message**
- **ID**: 1
- **Category**: welcome
- **Content**: `Hello {{name}}! Welcome to our service. We are glad to have you with us!`
- **Variables**: `["name"]`
- **Usage**: Welcome new users/customers

#### **2️⃣ Order Confirmation**
- **ID**: 2
- **Category**: notification
- **Content**: `Dear {{name}}, your order #{{order_id}} has been confirmed. Total: {{amount}}.`
- **Variables**: `["name", "order_id", "amount"]`
- **Usage**: Order confirmation notifications

#### **3️⃣ Flash Sale**
- **ID**: 3
- **Category**: promotion
- **Content**: `🔥 FLASH SALE! Get {{discount}}% off on all items! Use code: {{promo_code}}.`
- **Variables**: `["discount", "promo_code"]`
- **Usage**: Promotional campaigns

---

## 🔧 **Template Variables:**

### **📋 Variable Format:**
- **Syntax**: `{{variable_name}}`
- **Purpose**: Dynamic content replacement
- **Example**: `Hello {{name}}!` → `Hello John!`

### **📋 Common Variables:**
```
{{name}} - Customer name
{{order_id}} - Order number
{{amount}} - Order amount
{{discount}} - Discount percentage
{{promo_code}} - Promotional code
{{delivery_date}} - Delivery date
{{tracking_number}} - Shipping tracking
{{appointment_date}} - Appointment date
{{appointment_time}} - Appointment time
{{department}} - Department name
{{inquiry_topic}} - Customer inquiry topic
{{response_time}} - Response time
{{feedback_link}} - Feedback form link
{{otp_code}} - One-time password
{{expiry_minutes}} - OTP expiry time
{{verification_link}} - Verification URL
{{expiry_hours}} - Link expiry time
{{product_category}} - Product category
{{product_name}} - Product name
{{price}} - Product price
```

---

## 🎯 **Template Categories:**

### **📋 Categories Available:**

#### **🏠 Welcome Messages**
- **Purpose**: New user onboarding
- **Variables**: Customer name, promo details
- **Example**: Welcome new subscribers

#### **📢 Notifications**
- **Purpose**: Transaction notifications
- **Variables**: Order details, payment info
- **Example**: Order confirmations, shipping updates

#### **🎉 Promotions**
- **Purpose**: Marketing campaigns
- **Variables**: Discount codes, product info
- **Example**: Flash sales, new launches

#### **🛎 Customer Service**
- **Purpose**: Support communications
- **Variables**: Appointment details, feedback
- **Example**: Support responses, feedback requests

#### **🔐 Verification**
- **Purpose**: Security verifications
- **Variables**: OTP codes, verification links
- **Example**: Account verification, password reset

#### **🎂 Birthday**
- **Purpose**: Birthday wishes
- **Variables**: Customer name, special offers
- **Example**: Birthday greetings, special discounts

---

## 🔧 **Usage Examples:**

### **📋 Template Usage in API:**

#### **Get All Templates:**
```bash
curl -X GET http://localhost:8090/api/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Create New Template:**
```bash
curl -X POST http://localhost:8090/api/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Template",
    "content": "Hello {{name}}, your custom message here!",
    "category": "custom",
    "variables": ["name"]
  }'
```

#### **Update Template:**
```bash
curl -X PUT http://localhost:8090/api/templates/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Template",
    "content": "Updated content for {{name}}!",
    "category": "updated",
    "variables": ["name"]
  }'
```

#### **Delete Template:**
```bash
curl -X DELETE http://localhost:8090/api/templates/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎨 **Frontend Integration:**

### **📋 Template Management UI:**

#### **Template List Page:**
- **URL**: http://localhost:3000/templates
- **Features**: 
  - List all templates by category
  - Search and filter templates
  - Preview template content
  - Edit existing templates
  - Delete templates
  - Create new templates

#### **Template Editor:**
- **Variable Highlighting**: Show `{{variables}}` in different color
- **Preview Mode**: Real-time template preview
- **Variable Suggestions**: Auto-suggest common variables
- **Category Selection**: Organize templates by category

#### **Template Usage:**
- **Quick Insert**: Insert template into message composer
- **Variable Replacement**: Auto-replace variables with customer data
- **Batch Sending**: Send template to multiple customers

---

## 🚀 **Advanced Features:**

### **📋 Template Variables:**

#### **Nested Variables:**
```handlebars
Hello {{customer.first_name}} {{customer.last_name}}!
Your order #{{order.id}} contains:
{{#each order.items}}
- {{this.name}} ({{this.quantity}}x) = {{this.price}}
{{/each}}
Total: {{order.total}}
```

#### **Conditional Logic:**
```handlebars
{{#if customer.is_vip}}
🌟 VIP Customer Special Offer!
{{else}}
Regular customer offer
{{/if}}
```

#### **Date Formatting:**
```handlebars
Your appointment on {{format_date appointment_date 'DD MMM YYYY'}} at {{format_time appointment_time 'HH:mm'}}
```

---

## ✅ **Templates Ready for Use!**

### **🎯 Current Status:**
- **✅ Database**: Templates stored in `message_templates` table
- **✅ API**: Template endpoints working correctly
- **✅ Variables**: Dynamic content replacement supported
- **✅ Categories**: Templates organized by category
- **✅ Examples**: 3 example templates created

### **📱 Next Steps:**
1. **Test Templates**: Use frontend template manager
2. **Create More**: Add industry-specific templates
3. **Customize**: Modify templates for your business
4. **Integrate**: Use templates in message sending

---

## 🎉 **Example Templates Complete!**

**✅ 3 example templates created!** 📝✨

**✅ Template management system working!** 🗂️🚀

**✅ Ready for business messaging!** 💼📱

**ChatFlow - Streamline Your Business Messaging!** 💼📱

---

## 🔧 **Files Created:**

### **📋 Scripts:**
- **✅ `create-example-templates.sh`** - Automated template creation script
- **✅ `EXAMPLE-TEMPLATES.md`** - Template documentation and examples

### **📋 Database:**
- **✅ `message_templates` table** - 3 example templates inserted
- **✅ Template variables** - JSON format for dynamic content
- **✅ Categories** - Organized by business function

### **📋 API:**
- **✅ Template endpoints** - CRUD operations working
- **✅ Variable replacement** - Handlebars-style syntax
- **✅ Category filtering** - Organized template retrieval
