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
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { phonesAPI } from '../services/api';

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
        console.log('Dialog should open now');
        console.log('QR Dialog State:', qrDialogOpen);
        
        // Force dialog open with timeout
        setTimeout(() => {
          console.log('Force opening dialog...');
          setQrDialogOpen(true);
        }, 100);

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

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'phone_number', headerName: 'Phone Number', width: 150 },
    { field: 'device_name', headerName: 'Device Name', width: 150 },
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
      ),
    },
    { field: 'webhook_url', headerName: 'Webhook URL', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleEdit(params.row)} size="small">
            <Edit />
          </IconButton>
          <IconButton onClick={() => handleGenerateQR(params.row)} size="small" color="primary">
            <QrCode />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)} size="small" color="error">
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

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={handleQrDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>QR Code for {selectedPhone?.device_name}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Scan this QR code with your WhatsApp device to connect {selectedPhone?.device_name}
          </Typography>
          {qrLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
              <CircularProgress />
            </Box>
          ) : qrCode ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={2}>
              {/* Use real QR code image */}
              <img 
                src={qrCode}
                alt="QR Code" 
                style={{ maxWidth: '300px', height: 'auto', border: '2px solid', backgroundColor: '#fff' }}
                onLoad={() => console.log('Real QR Code image loaded successfully')}
                onError={(e) => {
                  console.error('Real QR Code image failed to load:', e);
                  console.error('Image src:', qrCode);
                  console.error('Error details:', e.target.error);
                }}
              />
              <Typography variant="caption" display="block" textAlign="center" mt={1}>
                {qrSource === 'chatflow-real' ? 
                  '🟢 Real WhatsApp QR Code (ChatFlow)' : 
                  qrSource === 'mock-with-instructions' ?
                  '🟡 Mock QR - Use ChatFlow Web Interface' :
                  qrSource === 'real-whatsapp-format' ?
                  '🔵 Real WhatsApp QR Code (Scanable)' :
                  '🟡 Mock QR Code (Development Mode)'
                }
              </Typography>
              {qrSource === 'mock-with-instructions' && (
                <Typography variant="body2" color="info" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                  <strong>For Real WhatsApp QR:</strong><br />
                  1. Open <a href="http://localhost:8081" target="_blank" rel="noopener">ChatFlow Web Interface</a><br />
                  2. Login: admin / admin<br />
                  3. Create Instance: "Nanang"<br />
                  4. Generate QR and scan with WhatsApp
                </Typography>
              )}
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" p={2}>
              {qrSource === 'chatflow' ? (
                <>
                  <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                    🟢 Device Already Connected
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Device "{selectedPhone?.device_name}" is already connected to WhatsApp
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No QR code needed. You can start sending messages.
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="error">
                  Failed to generate QR code
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQrDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Phones;
