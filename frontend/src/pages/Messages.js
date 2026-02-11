import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Send,
  Message as MessageIcon,
  Phone as PhoneIcon,
  Schedule,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { messagesAPI, phonesAPI } from '../services/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    phone_id: '',
    to: '',
    message: '',
    media_url: '',
    media_type: 'image',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchPhones();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await messagesAPI.getMessages();
      setMessages(response.data.messages || []);
    } catch (error) {
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhones = async () => {
    try {
      const response = await phonesAPI.getPhones();
      setPhones(response.data.phones || []);
    } catch (error) {
      console.error('Failed to fetch phones:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await messagesAPI.sendMessage(formData);
      setSuccess('Message sent successfully');
      setSendDialogOpen(false);
      setFormData({
        phone_id: '',
        to: '',
        message: '',
      });
      fetchMessages();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send message');
    }
  };

  const getMessageCount = (status) => {
    return messages.filter(msg => msg.status === status).length;
  };

  const getFilteredMessages = () => {
    // Add direction to messages
    const messagesWithDirection = messages.map(msg => ({
      ...msg,
      direction: msg.status === 'sent' ? 'outbound' : 'inbound',
      display_name: msg.status === 'sent' ? `To: ${msg.to_number}` : `From: ${msg.from_number}`
    }));

    switch (tabValue) {
      case 1: // Sent
        return messagesWithDirection.filter(msg => msg.status === 'sent');
      case 2: // Received
        return messagesWithDirection.filter(msg => msg.status === 'received');
      case 3: // Failed
        return messagesWithDirection.filter(msg => msg.status === 'failed');
      default:
        return messagesWithDirection;
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'display_name', headerName: 'From/To', width: 150 },
    { field: 'content', headerName: 'Message', width: 300 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'sent' ? 'success' :
            params.value === 'pending' ? 'warning' :
            params.value === 'failed' ? 'error' : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'direction',
      headerName: 'Direction',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'outbound' ? 'primary' : 'secondary'}
          size="small"
        />
      ),
    },
    { field: 'created_at', headerName: 'Time', width: 180 },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Messages</Typography>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => setSendDialogOpen(true)}
        >
          Send Message
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Messages" />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Sent
                <Badge badgeContent={getMessageCount('sent')} color="primary" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Received
                <Badge badgeContent={getMessageCount('received')} color="secondary" sx={{ ml: 1 }} />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Failed
                <Badge badgeContent={getMessageCount('failed')} color="error" sx={{ ml: 1 }} />
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid 
          rows={getFilteredMessages()} 
          columns={columns} 
          pageSize={10} 
        />
      </Paper>

      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send New Message</DialogTitle>
        <form onSubmit={handleSendMessage}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Phone Number</InputLabel>
                  <Select
                    value={formData.phone_id}
                    label="Phone Number"
                    onChange={(e) => setFormData({ ...formData, phone_id: e.target.value })}
                  >
                    {phones.map((phone) => (
                      <MenuItem key={phone.id} value={phone.id}>
                        {phone.phone_number} ({phone.device_name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Number"
                  name="to"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  placeholder="+628123456789"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  multiline
                  rows={4}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<Send />}>
              Send Message
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Messages;
