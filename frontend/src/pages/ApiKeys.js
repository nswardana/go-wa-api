import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Box,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ContentCopy,
  Refresh,
  Key,
  Phone,
  Visibility,
  VisibilityOff,
  Add
} from '@mui/icons-material';
import { getApiKeys, getPhoneNumbersWithKeys, generateApiKey, generateNumberKey } from '../services/api';

const ApiKeys = () => {
  const [apiKeyData, setApiKeyData] = useState(null);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showNumberKeys, setShowNumberKeys] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', data: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apiKeysResponse, phonesResponse] = await Promise.all([
        getApiKeys(),
        getPhoneNumbersWithKeys()
      ]);
      
      setApiKeyData(apiKeysResponse.data);
      // Handle both response formats: phonesResponse.phones or phonesResponse.data
      const phonesData = phonesResponse.phones || phonesResponse.data || [];
      setPhoneNumbers(phonesData);
      console.log('API Keys Response:', apiKeysResponse);
      console.log('Phones Response:', phonesResponse);
      console.log('Phones Data:', phonesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Failed to fetch data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${type} copied to clipboard!`, severity: 'success' });
  };

  const handleGenerateApiKey = async () => {
    try {
      const response = await generateApiKey();
      setApiKeyData(prev => ({ ...prev, api_key: response.data.api_key }));
      setSnackbar({ open: true, message: 'API Key generated successfully!', severity: 'success' });
      setConfirmDialog({ open: false, type: '', data: null });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate API Key', severity: 'error' });
    }
  };

  const handleGenerateNumberKey = async (phoneId) => {
    try {
      const response = await generateNumberKey(phoneId);
      setPhoneNumbers(prev => 
        prev.map(phone => 
          phone.id === phoneId 
            ? { ...phone, number_key: response.data.number_key }
            : phone
        )
      );
      setSnackbar({ open: true, message: 'Number Key generated successfully!', severity: 'success' });
      setConfirmDialog({ open: false, type: '', data: null });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate Number Key', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const toggleNumberKeyVisibility = (phoneId) => {
    setShowNumberKeys(prev => ({ ...prev, [phoneId]: !prev[phoneId] }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API Keys & Number Keys
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your API keys and number keys for accessing the User Message API
      </Typography>

      {/* API Key Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Key color="primary" />
              <Typography variant="h6">Your API Key</Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setConfirmDialog({ open: true, type: 'api', data: null })}
            >
              Generate New API Key
            </Button>
          </Box>

          {apiKeyData && (
            <Box>
              <TextField
                fullWidth
                label="API Key"
                value={showApiKey ? apiKeyData.api_key : '••••••••••••••••••••••••••••••••'}
                type={showApiKey ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <Box display="flex" gap={1}>
                      <IconButton onClick={() => toggleApiKeyVisibility()}>
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      <IconButton onClick={() => handleCopyToClipboard(apiKeyData.api_key, 'API Key')}>
                        <ContentCopy />
                      </IconButton>
                    </Box>
                  )
                }}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {apiKeyData.username}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {apiKeyData.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(apiKeyData.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Number Keys Section */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Phone color="primary" />
            <Typography variant="h6">Your Number Keys</Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Device Name</TableCell>
                  <TableCell>Number Key</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Instance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {phoneNumbers.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell>{phone.phone_number}</TableCell>
                    <TableCell>{phone.device_name}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={showNumberKeys[phone.id] ? phone.number_key : '••••••••••••••••••••••••••••••••'}
                        type={showNumberKeys[phone.id] ? 'text' : 'password'}
                        InputProps={{
                          endAdornment: (
                            <Box display="flex" gap={1}>
                              <IconButton size="small" onClick={() => toggleNumberKeyVisibility(phone.id)}>
                                {showNumberKeys[phone.id] ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopyToClipboard(phone.number_key, 'Number Key')}
                              >
                                <ContentCopy />
                              </IconButton>
                            </Box>
                          )
                        }}
                        sx={{ width: 300 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={phone.is_connected ? 'Connected' : 'Disconnected'}
                        color={phone.is_connected ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={phone.evolution_name || 'chatflow-1'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => setConfirmDialog({ open: true, type: 'number', data: phone })}
                      >
                        Regenerate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {phoneNumbers.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No phone numbers found. Add a phone number to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* API Usage Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Usage Instructions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use your API Key and Number Keys to access the User Message API:
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            <Typography variant="body2">
              POST http://localhost:8090/v1/send-message
            </Typography>
            <Typography variant="body2">
              {"{"}
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              "api_key": "your_api_key_here",
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              "number_key": "your_number_key_here",
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              "phone_no": "628123456789",
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              "message": "Hello from API!"
            </Typography>
            <Typography variant="body2">
              {"}"}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: '', data: null })}>
        <DialogTitle>
          {confirmDialog.type === 'api' ? 'Generate New API Key?' : 'Generate New Number Key?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === 'api' 
              ? 'Are you sure you want to generate a new API key? The old key will be invalidated.'
              : `Are you sure you want to generate a new number key for ${confirmDialog.data?.phone_number}?`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: '', data: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (confirmDialog.type === 'api') {
                handleGenerateApiKey();
              } else {
                handleGenerateNumberKey(confirmDialog.data.id);
              }
            }}
            variant="contained"
            color="primary"
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ApiKeys;
