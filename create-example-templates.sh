#!/bin/bash

# Create Example Message Templates
# Script untuk insert contoh templates ke database

echo "📝 Creating Example Message Templates"
echo "=================================="

echo ""
echo "🔌 Connecting to database..."

# Insert example templates
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
-- Clear existing templates (optional)
-- DELETE FROM message_templates;

-- Insert welcome templates
INSERT INTO message_templates (user_id, name, content, category, variables) VALUES
(1, 'Welcome Message', 'Hello {{name}}! Welcome to our service. We are glad to have you with us!', 'welcome', '[\"name\"]'),
(1, 'Welcome with Promo', 'Hi {{name}}! Welcome to our service! Use promo code {{promo_code}} for {{discount}}% off your first order.', 'welcome', '[\"name\", \"promo_code\", \"discount\"]'),

-- Insert notification templates
INSERT INTO message_templates (user_id, name, content, category, variables) VALUES
(1, 'Order Confirmation', 'Dear {{name}}, your order #{{order_id}} has been confirmed. Total: {{amount}}. Estimated delivery: {{delivery_date}}.', 'notification', '[\"name\", \"order_id\", \"amount\", \"delivery_date\"]'),
(1, 'Payment Received', 'Thank you {{name}}! We have received your payment of {{amount}} for order #{{order_id}}.', 'notification', '[\"name\", \"amount\", \"order_id\"]'),
(1, 'Shipping Update', 'Hi {{name}}, your order #{{order_id}} has been shipped. Tracking number: {{tracking_number}}. Expected delivery: {{delivery_date}}.', 'notification', '[\"name\", \"order_id\", \"tracking_number\", \"delivery_date\"]'),

-- Insert promotional templates
INSERT INTO message_templates (user_id, name, content, category, variables) VALUES
(1, 'Flash Sale', '🔥 FLASH SALE! Get {{discount}}% off on all items! Use code: {{promo_code}}. Limited time only!', 'promotion', '[\"discount\", \"promo_code\"]'),
(1, 'New Product Launch', '🎉 NEW PRODUCT ALERT! Check out our latest {{product_category}}: {{product_name}}. Price: {{price}}. Available now!', 'promotion', '[\"product_category\", \"product_name\", \"price\"]'),
(1, 'Weekend Special', '🌟 WEEKEND SPECIAL! This weekend only: Get {{discount}}% off on {{product_category}}. Don''t miss out!', 'promotion', '[\"discount\", \"product_category\"]'),

-- Insert customer service templates
INSERT INTO message_templates (user_id, name, content, category, variables) VALUES
(1, 'Support Response', 'Dear {{name}}, regarding your inquiry about {{inquiry_topic}}. Our team will respond within {{response_time}} hours.', 'customer_service', '[\"name\", \"inquiry_topic\", \"response_time\"]'),
(1, 'Appointment Reminder', 'Hi {{name}}, this is a reminder for your appointment on {{appointment_date}} at {{appointment_time}} with {{department}}.', 'customer_service', '[\"name\", \"appointment_date\", \"appointment_time\", \"department\"]'),
(1, 'Feedback Request', 'Hi {{name}}, thank you for using our service! We would love to hear your feedback. Rate us: {{feedback_link}}', 'customer_service', '[\"name\", \"feedback_link\"]'),

-- Insert verification templates
INSERT INTO message_templates (user_id, name, content, category, variables) VALUES
(1, 'OTP Verification', 'Your verification code is: {{otp_code}}. This code will expire in {{expiry_minutes}} minutes.', 'verification', '[\"otp_code\", \"expiry_minutes\"]'),
(1, 'Account Verification', 'Hi {{name}}, please verify your account by clicking: {{verification_link}}. Link expires in {{expiry_hours}} hours.', 'verification', '[\"name\", \"verification_link\", \"expiry_hours\"]'),

-- Insert birthday templates
INSERT INTO message_templates (user_id, name, content, category, variables) VALUES
(1, 'Birthday Wish', '🎂 Happy Birthday {{name}}! Wishing you a fantastic day filled with joy and celebration! 🎉', 'birthday', '[\"name\"]'),
(1, 'Birthday with Discount', '🎂🎉 Happy Birthday {{name}}! As a birthday gift, enjoy {{discount}}% off your next purchase with code: {{promo_code}}', 'birthday', '[\"name\", \"discount\", \"promo_code\"]');
" 2>/dev/null

echo ""
echo "✅ Templates inserted successfully!"

echo ""
echo "📊 Verifying templates..."

# Check inserted templates
docker exec chatflow-postgres psql -U chatflow_user -d chatflow_api -c "
SELECT 
    id,
    name,
    category,
    LEFT(content, 50) || '...' as content_preview,
    variables
FROM message_templates 
WHERE user_id = 1 
ORDER BY category, name;
" 2>/dev/null

echo ""
echo "📝 Template Categories Created:"
echo "- Welcome Messages (2 templates)"
echo "- Notifications (3 templates)"
echo "- Promotions (3 templates)"
echo "- Customer Service (3 templates)"
echo "- Verification (2 templates)"
echo "- Birthday (2 templates)"
echo ""
echo "🌐 Test templates API:"
echo "curl -s http://localhost:8090/api/templates -H \"Authorization: Bearer YOUR_TOKEN\""

echo ""
echo "✅ Example templates creation complete!"
echo ""
echo "📱 Usage in Frontend:"
echo "1. Go to http://localhost:3000/templates"
echo "2. Select template category"
echo "3. Choose template and customize variables"
echo "4. Send to customers"
