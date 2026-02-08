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
  CardActions,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Send,
  Settings,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  BugReport,
  Api,
  Key
} from '@mui/icons-material';
import { externalWhatsAppAPI, phonesAPI } from '../services/api';

const ExternalWhatsApp = () => {
  const [providers, setProviders] = useState([]);
  const [phones, setPhones] = useState([]);
  const [configs, setConfigs] = useState({});
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [formData, setFormData] = useState({
    provider: 'watzap',
    config: {
      api_key: '',
      number_key: ''
    },
    phoneId: '',
    to: '',
    content: '',
    type: 'text'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProviders();
    fetchPhones();
    fetchConfigs();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await externalWhatsAppAPI.getProviders();
      setProviders(response.data.providers || []);
    } catch (error) {
      setError('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhones = async () => {
    try {
      const response = await phonesAPI.getPhones();
      setPhones(response.data.phones || []);
    } catch (error) {
      setError('Failed to fetch phones');
    }
  };

  const fetchConfigs = async () => {
    try {
      // Mock configs - in real app, fetch from database
      setConfigs({
        watzap: {
          api_key: '',
          number_key: ''
        }
      });
    } catch (error) {
      setError('Failed to fetch configurations');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const response = await externalWhatsAppAPI.sendMessage(formData);
      
      if (response.data.success) {
        setSuccess('Message sent successfully via external API');
        setSendDialogOpen(false);
        setFormData({
          ...formData,
          to: '',
          content: ''
        });
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const handleTest = async (provider) => {
    try {
      const config = configs[provider];
      if (!config || !config.api_key || !config.number_key) {
        setError('Please configure the provider first');
        return;
      }

      const response = await externalWhatsAppAPI.testProvider({
        provider,
        config
      });

      setTestResults({
        ...testResults,
        [provider]: response.data
      });

      if (response.data.success) {
        setSuccess(`${provider} connection successful!`);
      } else {
        setError(`${provider} connection failed`);
      }
    } catch (error) {
      setError(`Failed to test ${provider}`);
      setTestResults({
        ...testResults,
        [provider]: { success: false, error: error.message }
      });
    }
  };

  const handleSaveConfig = async (provider) => {
    try {
      const config = configs[provider];
      // In real app, save to database
      setSuccess(`${provider} configuration saved successfully`);
    } catch (error) {
      setError(`Failed to save ${provider} configuration`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'pending':
        return <Info color="warning" />;
      default:
        return <Info />;
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        External WhatsApp API
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Provider Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
              Provider Configuration
            </Typography>
            
            {providers.map((provider) => (
              <Accordion key={provider.key} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Typography variant="subtitle1">{provider.name}</Typography>
                    <Box ml="auto">
                      {testResults[provider.key] ? (
                        <Chip
                          icon={testResults[provider.key].success ? <CheckCircle /> : <Error />}
                          label={testResults[provider.key].success ? 'Connected' : 'Failed'}
                          color={testResults[provider.key].success ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Button
                          size="small"
                          startIcon={<BugReport />}
                          onClick={() => handleTest(provider.key)}
                        >
                          Test
                        </Button>
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API Key"
                        value={configs[provider.key]?.api_key || ''}
                        onChange={(e) => setConfigs({
                          ...configs,
                          [provider.key]: {
                            ...configs[provider.key],
                            api_key: e.target.value
                          }
                        })}
                        type="password"
                        margin="normal"
                        InputProps={{
                          startAdornment: <Key sx={{ mr: 1, color: 'action.disabled' }} />
                        }}
                      />
                    </Grid>
                    {provider.key === 'watzap' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Number Key"
                          value={configs[provider.key]?.number_key || ''}
                          onChange={(e) => setConfigs({
                            ...configs,
                            [provider.key]: {
                              ...configs[provider.key],
                              number_key: e.target.value
                            }
                          })}
                          type="password"
                          margin="normal"
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => handleSaveConfig(provider.key)}
                        disabled={!configs[provider.key]?.api_key}
                      >
                        Save Configuration
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        {/* Send Message */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <Send sx={{ mr: 1, verticalAlign: 'middle' }} />
              Send Message
            </Typography>
            
            <Button
              variant="contained"
              onClick={() => setSendDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              Send New Message
            </Button>

            {/* Provider Features */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <Api sx={{ mr: 1, verticalAlign: 'middle' }} />
                Available Providers
              </Typography>
              {providers.map((provider) => (
                <Card key={provider.key} sx={{ mb: 1 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="subtitle2">{provider.name}</Typography>
                    <Box mt={1}>
                      {provider.features.sendMessage && (
                        <Chip label="Send Message" size="small" sx={{ mr: 1 }} />
                      )}
                      {provider.features.checkBalance && (
                        <Chip label="Check Balance" size="small" sx={{ mr: 1 }} />
                      )}
                      {provider.features.checkStatus && (
                        <Chip label="Check Status" size="small" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Send Message Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Message via External API</DialogTitle>
        <form onSubmit={handleSend}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    label="Provider"
                  >
                    {providers.map((provider) => (
                      <MenuItem key={provider.key} value={provider.key}>
                        {provider.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Phone Number</InputLabel>
                  <Select
                    value={formData.phoneId}
                    onChange={(e) => setFormData({ ...formData, phoneId: e.target.value })}
                    label="Phone Number"
                  >
                    {phones.map((phone) => (
                      <MenuItem key={phone.id} value={phone.id}>
                        {phone.phoneNumber} ({phone.deviceName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Number"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  required
                  margin="normal"
                  placeholder="628123456789"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message Content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  multiline
                  rows={4}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Send Message
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExternalWhatsApp;
