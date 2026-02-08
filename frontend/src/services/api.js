import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8090/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Use React Router's navigate instead of hard redirect
      // This will be handled by the AuthContext
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
};

export const phonesAPI = {
  getPhones: () => api.get('/phones'),
  createPhone: (data) => api.post('/phones', data),
  updatePhone: (id, data) => api.put(`/phones/${id}`, data),
  deletePhone: (id) => api.delete(`/phones/${id}`),
  generateQR: (id) => api.post(`/phones/${id}/generate-qr`),
  getPhoneStatus: (id) => api.get(`/phones/${id}/status`),
};

export const templatesAPI = {
  getTemplates: () => api.get('/templates'),
  createTemplate: (data) => api.post('/templates', data),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  processTemplate: (id, variables) => api.post(`/templates/${id}/process`, variables)
};

// Get API Keys and Number Keys for current user
export const getApiKeys = async () => {
  try {
    const response = await api.get('/users/api-keys');
    return response.data;
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
};

// Get Phone Numbers with Number Keys for current user
export const getPhoneNumbersWithKeys = async () => {
  try {
    const response = await api.get('/phones/with-keys');
    return response.data;
  } catch (error) {
    console.error('Error fetching phone numbers with keys:', error);
    throw error;
  }
};

// Generate new API Key for user
export const generateApiKey = async () => {
  try {
    const response = await api.post('/users/generate-api-key');
    return response.data;
  } catch (error) {
    console.error('Error generating API key:', error);
    throw error;
  }
};

// Generate new Number Key for phone
export const generateNumberKey = async (phoneId) => {
  try {
    const response = await api.post(`/phones/${phoneId}/generate-number-key`);
    return response.data;
  } catch (error) {
    console.error('Error generating number key:', error);
    throw error;
  }
};

export const schedulesAPI = {
  getSchedules: () => api.get('/schedules'),
  createSchedule: (data) => api.post('/schedules', data),
  updateSchedule: (id, data) => api.put(`/schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`/schedules/${id}`),
  processSchedules: () => api.post('/schedules/process')
};

export const externalWhatsAppAPI = {
  getProviders: () => api.get('/external-whatsapp/providers'),
  sendMessage: (data) => api.post('/external-whatsapp/send', data),
  getStatus: (data) => api.post('/external-whatsapp/status', data),
  testProvider: (data) => api.post('/external-whatsapp/test', data)
};

export const messagesAPI = {
  getMessages: (params) => api.get('/messages', { params }),
  sendMessage: (data) => api.post('/messages/send', data),
};

export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getMessageStats: (period) => api.get('/stats/messages', { params: { period } }),
  getPhoneStats: () => api.get('/stats/phones'),
  getWebhookStats: (period) => api.get('/stats/webhooks', { params: { period } }),
};

export const subscriptionAPI = {
  getSubscription: () => api.get('/subscription/info'),
  canAddPhone: () => api.get('/subscription/can-add-phone'),
  getPlans: () => api.get('/subscription/plans'),
  upgradePlan: (planId) => api.post('/subscription/upgrade', { plan_id: planId }),
};

export default api;
