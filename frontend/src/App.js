import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Phones from './pages/Phones';
import Messages from './pages/Messages';
import Templates from './pages/Templates';
import Schedules from './pages/Schedules';
import Users from './pages/Users';
import Settings from './pages/Settings';
import ExternalWhatsApp from './pages/ExternalWhatsApp';
import ApiKeys from './pages/ApiKeys';
import Contacts from './pages/Contacts';
import Broadcasts from './pages/Broadcasts';
import BroadcastDetails from './pages/BroadcastDetails';
import AutoReply from './pages/AutoReply';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Box sx={{ display: 'flex' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="phones" element={<Phones />} />
              <Route path="messages" element={<Messages />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="broadcasts" element={<Broadcasts />} />
              <Route path="broadcasts/create" element={<Broadcasts />} />
              <Route path="broadcasts/:id" element={<BroadcastDetails />} />
              <Route path="auto-reply" element={<AutoReply />} />
              <Route path="templates" element={<Templates />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="external-whatsapp" element={<ExternalWhatsApp />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<div>Settings Page</div>} />
            </Route>
          </Routes>
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
