import React, { useState, useEffect } from 'react';
import { socket } from '../services/api';
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
  CircularProgress,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  QrCode,
  Link,
  LinkOff,
  Visibility,
  VisibilityOff,
  ContentCopy,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { phonesAPI } from '../services/api';
import QRCodeModal from '../components/QRCodeModal';

const Phones = () => {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    deviceName: '',
    webhookUrl: '',
    webhookSecret: '',
    autoReply: false,
    autoReplyMessage: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrSource, setQrSource] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [tokenVisibility, setTokenVisibility] = useState({});

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      phones.forEach(phone => {
        refreshPhoneStatus(phone.id);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [phones]);

  useEffect(() => {
    fetchPhones();
  }, []);

  // WebSocket listener for real-time updates
  useEffect(() => {
    socket.on('phone-status-update', (data) => {
      console.log('Phone status update received:', data);
      
      // Update phone list
      setPhones(prevPhones => 
        prevPhones.map(p => 
          p.id === data.phoneId 
            ? { ...p, is_connected: data.isConnected, last_seen: data.timestamp }
            : p
        )
      );
      
      // Close QR modal if connected
      if (data.isConnected && qrDialogOpen) {
        setQrDialogOpen(false);
        setSelectedPhone(null);
        setSuccess('Phone connected successfully!');
      }
    });

    // Join user room for personalized updates
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      socket.emit('join-user-room', user.id);
    }

    return () => {
      socket.off('phone-status-update');
    };
  }, [qrDialogOpen]);

  const fetchPhones = async () => {
    try {
      const response = await phonesAPI.getPhones();
      setPhones(response.data.phones || []);
    } catch (error) {
      setError('Failed to fetch phones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingPhone) {
        await phonesAPI.updatePhone(editingPhone.id, formData);
        setSuccess('Phone updated successfully');
      } else {
        await phonesAPI.createPhone(formData);
        setSuccess('Phone created successfully');
      }
      
      setDialogOpen(false);
      setEditingPhone(null);
      setFormData({
        phoneNumber: '',
        deviceName: '',
        webhookUrl: '',
        webhookSecret: '',
      });
      fetchPhones();
    } catch (error) {
      setError(error.response?.data?.error || 'Operation failed');
    }
  };

  const toggleTokenVisibility = (phoneId) => {
    setTokenVisibility(prev => ({
      ...prev,
      [phoneId]: !prev[phoneId]
    }));
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess(`${label} copied to clipboard`);
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Failed to copy to clipboard');
      setTimeout(() => setError(''), 3000);
    });
  };

  const handleEdit = (phone) => {
    setEditingPhone(phone);
    setFormData({
      phoneNumber: phone.phone_number,
      deviceName: phone.device_name,
      webhookUrl: phone.webhook_url,
      webhookSecret: phone.webhook_secret,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this phone?')) {
      try {
        await phonesAPI.deletePhone(id);
        setSuccess('Phone deleted successfully');
        fetchPhones();
      } catch (error) {
        setError('Failed to delete phone');
      }
    }
  };

  const handleGenerateQR = async (phone) => {
    setQrLoading(true);
    setError('');
    setQrCode('');
    setQrSource('');
    setSelectedPhone(phone);
    
    console.log('Generating QR for phone:', phone.id);
    
    try {
      const response = await phonesAPI.generateQR(phone.id);
      console.log('QR Response:', response.data);
      
      if (response.data.success) {
        console.log('QR Code received:', response.data.qrCode);
        console.log('QR Source:', response.data.source);
        setQrCode(response.data.qrCode);
        setQrSource(response.data.source);
        setQrDialogOpen(true);

        // Refresh phone status after QR generation
        await refreshPhoneStatus(phone.id);
      } else {
        setError('Failed to generate QR code: ' + response.data.message);
      }
    } catch (error) {
      console.error('QR Generation Error:', error);
      setError('Failed to generate QR code: ' + error.message);
    } finally {
      setQrLoading(false);
    }
  };

  const handleQrDialogClose = () => {
    setQrDialogOpen(false);
    setQrCode('');
    setSelectedPhone(null);
    
    // Refresh all phones data when dialog closes
    fetchPhones();
  };

  const handleRefreshQR = async () => {
    if (selectedPhone) {
      await handleGenerateQR(selectedPhone);
    }
  };

  const refreshPhoneStatus = async (phoneId) => {
    try {
      const response = await phonesAPI.getPhoneStatus(phoneId);
      if (response.data.success) {
        // Update the phone in the phones list
        setPhones(prevPhones => 
          prevPhones.map(phone => 
            phone.id === phoneId 
              ? { ...phone, is_connected: response.data.connected }
              : phone
          )
        );
      }
    } catch (error) {
      console.error('Failed to refresh phone status:', error);
    }
  };

  const handleConnectDisconnect = async (phone) => {
    try {
      setError('');
      setSuccess('');
      
      if (phone.is_connected) {
        // Disconnect phone
        const response = await phonesAPI.disconnectPhone(phone.id);
        if (response.data.success) {
          setSuccess(`${phone.device_name} disconnected successfully`);
          // Update phone status
          setPhones(prevPhones => 
            prevPhones.map(p => 
              p.id === phone.id 
                ? { ...p, is_connected: false }
                : p
            )
          );
        } else {
          setError(response.data.message || 'Failed to disconnect phone');
        }
      } else {
        // Connect phone - generate QR code
        await handleGenerateQR(phone);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to connect/disconnect phone');
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { 
      field: 'phone_number', 
      headerName: 'Phone Number', 
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'device_name', 
      headerName: 'Device Name', 
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'token', 
      headerName: 'Number Key', 
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
          <TextField
            size="small"
            value={tokenVisibility[params.row.id] ? params.value : '•••••••••••••••••••••••••••••••'}
            type={tokenVisibility[params.row.id] ? 'text' : 'password'}
            variant="outlined"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                '& fieldset': {
                  border: 'none',
                },
                '& input': {
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem'
                }
              }
            }}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Box display="flex" gap={0.5}>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleTokenVisibility(params.row.id)}
                    sx={{ padding: 0.5 }}
                  >
                    {tokenVisibility[params.row.id] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(params.value, 'Number Key')}
                    sx={{ padding: 0.5 }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              )
            }}
          />
        </Box>
      )
    },
    { 
      field: 'evolution_name', 
      headerName: 'Instance', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'N/A'} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      )
    },
    { 
      field: 'is_connected', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Connected' : 'Disconnected'} 
          color={params.value ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => handleConnectDisconnect(params.row)}
            color={params.row.is_connected ? 'error' : 'success'}
            title={params.row.is_connected ? 'Disconnect' : 'Connect'}
          >
            {params.row.is_connected ? <LinkOff /> : <Link />}
          </IconButton>
          <IconButton
            onClick={() => handleGenerateQR(params.row)}
            color="primary"
            title="Generate QR Code"
            disabled={qrLoading}
          >
            
            <QrCode />
          </IconButton>
          <IconButton
            onClick={() => handleEdit(params.row.id)}
            color="info"
            title="Edit"
          >
            <Edit />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(params.row.id)}
            color="error"
            title="Delete"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
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
        <Typography variant="h4">Phone Numbers</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Phone
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid rows={phones} columns={columns} pageSize={10} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPhone ? 'Edit Phone' : 'Add New Phone'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Device Name"
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  name="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook Secret"
                  name="webhookSecret"
                  value={formData.webhookSecret}
                  onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingPhone ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QR Code Modal */}
      <QRCodeModal
        open={qrDialogOpen}
        onClose={handleQrDialogClose}
        qrCode={qrCode}
        qrSource={qrSource}
        loading={qrLoading}
        deviceName={selectedPhone?.device_name}
        serverId="CHATFLOW"
        onRefresh={handleRefreshQR}
        error={error}
        connected={selectedPhone?.is_connected}
      />
    </Box>
  );
};

export default Phones;
