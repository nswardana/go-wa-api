// Simple test to check if modules load correctly
console.log('Testing module imports...');

try {
  const authController = require('./controllers/authController');
  console.log('✓ authController loaded');
  console.log('Available methods:', Object.getOwnPropertyNames(authController).filter(name => typeof authController[name] === 'function'));
} catch (error) {
  console.error('✗ authController failed:', error.message);
}

try {
  const { auth } = require('./middleware/auth');
  console.log('✓ auth middleware loaded');
  console.log('auth type:', typeof auth);
} catch (error) {
  console.error('✗ auth middleware failed:', error.message);
}

try {
  const User = require('./models/User');
  console.log('✓ User model loaded');
} catch (error) {
  console.error('✗ User model failed:', error.message);
}

console.log('Test completed');
