import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemIcon,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Stop,
  Settings,
  Analytics,
  Message,
  Menu as MenuIcon
} from '@mui/icons-material';
import { autoReplyAPI } from '../services/api';

const AutoReply = () => {
  const [configs, setConfigs] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    trigger_keywords: [],
    welcome_message: '',
    is_active: true,
    phone_numbers: [],
    menus: []
  });

  // Test form state
  const [testForm, setTestForm] = useState({
    message: '',
    phone_number: ''
  });

  useEffect(() => {
    fetchConfigs();
    fetchPhoneNumbers();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await autoReplyAPI.getConfigs();
      setConfigs(response.data.configs);
    } catch (err) {
      setError('Failed to fetch auto-reply configs');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const response = await autoReplyAPI.getPhoneNumbers();
      setPhoneNumbers(response.data.phone_numbers);
    } catch (err) {
      setError('Failed to fetch phone numbers');
    }
  };

  const fetchConfigDetails = async (id) => {
    try {
      const response = await autoReplyAPI.getConfig(id);
      setSelectedConfig(response.data.config);
    } catch (err) {
      setError('Failed to fetch config details');
    }
  };

  const handleCreateConfig = () => {
    setSelectedConfig(null);
    setFormData({
      name: '',
      trigger_keywords: [],
      welcome_message: '',
      is_active: true,
      phone_numbers: [],
      menus: []
    });
    setDialogOpen(true);
  };

  const handleEditConfig = (config) => {
    setSelectedConfig(config);
    setFormData({
      name: config.name,
      trigger_keywords: config.trigger_keywords || [],
      welcome_message: config.welcome_message || '',
      is_active: config.is_active,
      phone_numbers: config.phone_numbers || [],
      menus: config.menus || []
    });
    setDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.name || !formData.trigger_keywords.length || !formData.welcome_message) {
        setError('Name, trigger keywords, and welcome message are required');
        return;
      }

      const payload = {
        ...formData,
        trigger_keywords: formData.trigger_keywords.join(',').split(',').map(k => k.trim()).filter(k => k)
      };

      if (selectedConfig) {
        await autoReplyAPI.updateConfig(selectedConfig.id, payload);
        setSuccess('Auto-reply config updated successfully');
      } else {
        await autoReplyAPI.createConfig(payload);
        setSuccess('Auto-reply config created successfully');
      }

      setDialogOpen(false);
      fetchConfigs();
    } catch (err) {
      setError('Failed to save config');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (window.confirm('Are you sure you want to delete this config?')) {
      try {
        await autoReplyAPI.deleteConfig(id);
        setSuccess('Auto-reply config deleted successfully');
        fetchConfigs();
      } catch (err) {
        setError('Failed to delete config');
      }
    }
  };

  const handleTestConfig = async () => {
    try {
      setLoading(true);
      const response = await autoReplyAPI.testConfig(selectedConfig.id, testForm);
      setTestResult(response.data);
    } catch (err) {
      setError('Failed to test config');
    } finally {
      setLoading(false);
    }
  };

  const addMenu = () => {
    console.log('Current menus before adding:', formData.menus);
    const newMenu = {
      menu_key: '',
      menu_text: '',
      response_text: '',
      order_index: formData.menus.length
    };
    console.log('Adding new menu:', newMenu);
    setFormData({
      ...formData,
      menus: [...formData.menus, newMenu]
    });
  };

  const updateMenu = (index, field, value) => {
    const newMenus = [...formData.menus];
    newMenus[index][field] = value;
    setFormData({ ...formData, menus: newMenus });
  };

  const removeMenu = (index) => {
    const newMenus = formData.menus.filter((_, i) => i !== index);
    setFormData({ ...formData, menus: newMenus });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Smart Auto-Reply
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Configurations" icon={<Settings />} />
        <Tab label="Analytics" icon={<Analytics />} />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Configurations</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateConfig}
                  size="small"
                >
                  New Config
                </Button>
              </Box>

              <List>
                {configs.map((config) => (
                  <ListItem key={config.id} divider>
                    <ListItemText
                      primary={config.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Keywords: {config.trigger_keywords?.join(', ') || 'None'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Phone Numbers: {config.phone_numbers && config.phone_numbers.length > 0 
                              ? `${config.phone_numbers.length} selected` 
                              : 'All numbers'}
                          </Typography>
                          <Chip
                            size="small"
                            label={config.is_active ? 'Active' : 'Inactive'}
                            color={config.is_active ? 'success' : 'default'}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleEditConfig(config)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            {selectedConfig && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedConfig.name}
                </Typography>

                <Box mb={2}>
                  <Typography variant="subtitle2">Phone Numbers:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedConfig.phone_numbers && selectedConfig.phone_numbers.length > 0 ? (
                      selectedConfig.phone_numbers.map((phoneId, index) => {
                        const phone = phoneNumbers.find(p => p.id === phoneId);
                        return phone ? (
                          <Chip key={index} label={`${phone.phone_number} (${phone.device_name})`} size="small" />
                        ) : null;
                      })
                    ) : (
                      <Chip label="All Phone Numbers" size="small" color="primary" />
                    )}
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2">Trigger Keywords:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedConfig.trigger_keywords?.map((keyword, index) => (
                      <Chip key={index} label={keyword} size="small" />
                    ))}
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2">Welcome Message:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {selectedConfig.welcome_message}
                    </Typography>
                  </Paper>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2">Menu Options:</Typography>
                  {selectedConfig.menus?.map((menu, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="body2">
                          <strong>{menu.menu_key}.</strong> {menu.menu_text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {menu.response_text}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={() => setTestDialogOpen(true)}
                  >
                    Test Config
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => handleEditConfig(selectedConfig)}
                  >
                    Edit Config
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analytics dashboard coming soon...
          </Typography>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedConfig ? 'Edit Auto-Reply Config' : 'Create Auto-Reply Config'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Config Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Trigger Keywords (comma-separated)"
                value={formData.trigger_keywords.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  trigger_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                })}
                helperText="Enter keywords that will trigger this auto-reply"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Phone Numbers (Optional)</InputLabel>
                <Select
                  multiple
                  value={formData.phone_numbers}
                  onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const phone = phoneNumbers.find(p => p.id === value);
                        return (
                          <Chip
                            key={value}
                            label={phone ? `${phone.phone_number} (${phone.device_name})` : value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {phoneNumbers.map((phone) => (
                    <MenuItem key={phone.id} value={phone.id}>
                      <Checkbox checked={formData.phone_numbers.indexOf(phone.id) > -1} />
                      <ListItemText primary={`${phone.phone_number} (${phone.device_name})`} />
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary">
                  Leave empty to apply to all phone numbers, or select specific numbers
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Welcome Message"
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                helperText="This message will be sent when keywords are matched"
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Menu Options</Typography>
                <Button onClick={addMenu} startIcon={<Add />} size="small">
                  Add Menu
                </Button>
              </Box>

              {formData.menus.map((menu, index) => {
                console.log('Rendering menu:', menu, index);
                return (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Key"
                          value={menu.menu_key}
                          onChange={(e) => updateMenu(index, 'menu_key', e.target.value)}
                          placeholder="1"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Menu Text"
                          value={menu.menu_text}
                          onChange={(e) => updateMenu(index, 'menu_text', e.target.value)}
                          placeholder="👉🏻 Data Karyawan"
                        />
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          label="Response"
                          value={menu.response_text}
                          onChange={(e) => updateMenu(index, 'response_text', e.target.value)}
                          placeholder="Response message..."
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <IconButton onClick={() => removeMenu(index)} color="error">
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                );
              })}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained" disabled={loading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Auto-Reply Config</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={testForm.phone_number}
                onChange={(e) => setTestForm({ ...testForm, phone_number: e.target.value })}
                placeholder="+62812345678"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Test Message"
                value={testForm.message}
                onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                placeholder="Type a message to test..."
              />
            </Grid>
            {testResult && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test Result:
                  </Typography>
                  <Typography variant="body2" color={testResult.triggered ? 'success.main' : 'text.secondary'}>
                    {testResult.triggered ? '✅ Triggered' : '❌ Not Triggered'}
                  </Typography>
                  {testResult.response && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'white' }}>
                      <Typography variant="body2" whiteSpace="pre-wrap">
                        {testResult.response}
                      </Typography>
                    </Paper>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          <Button onClick={handleTestConfig} variant="contained" disabled={loading}>
            Test
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AutoReply;
