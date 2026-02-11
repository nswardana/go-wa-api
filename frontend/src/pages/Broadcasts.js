import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  Badge
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Pause,
  Stop,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Schedule,
  Send,
  People,
  Message,
  TrendingUp,
  CheckCircle,
  Error,
  RadioButtonUnchecked
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { broadcastsAPI, broadcastTemplatesAPI, contactsAPI, phonesAPI } from '../services/api';

const Broadcasts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCreateMode = location.pathname.includes('/create');
  const { user } = useAuth();
  
  const [broadcasts, setBroadcasts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);
  const [progressData, setProgressData] = useState({});

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [messageType, setMessageType] = useState('custom'); // 'custom' or 'template'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [contactFilter, setContactFilter] = useState({
    search: '',
    categories: []
  });
  const [scheduleType, setScheduleType] = useState('now'); // 'now' or 'later'
  const [scheduledAt, setScheduledAt] = useState(null);

  // Enhanced state for real-time tracking
  const [messagePreview, setMessagePreview] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedSenders, setSelectedSenders] = useState([]);
  const [selectAllSenders, setSelectAllSenders] = useState(false);
  
  // Background processing state
  const [broadcastQueue, setBroadcastQueue] = useState([]);
  const [runningBroadcasts, setRunningBroadcasts] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message: '',
    template_id: '',
    contact_filter: {
      search: '',
      categories: []
    },
    scheduled_at: null
  });

  // Stepper functions
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      name: '',
      description: '',
      message: '',
      template_id: '',
      contact_filter: { search: '', categories: [] },
      scheduled_at: null
    });
    setMessageType('custom');
    setSelectedTemplate(null);
    setContactFilter({ search: '', categories: [] });
    setSelectedCategories([]);
    setScheduleType('now');
    setScheduledAt(null);
    setRecipientCount(0);
    setSelectedSenders([]);
    setSelectAllSenders(false);
    setBroadcastQueue([]);
    setRunningBroadcasts([]);
    setShowDashboard(false);
  };

  // WhatsApp preview function
  const generateWhatsAppPreview = (message) => {
    const sampleData = {
      name: 'John Doe',
      phone: '+62812345678',
      email: 'john@example.com',
      company: 'PT Example'
    };
    
    let preview = message;
    Object.keys(sampleData).forEach(key => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), sampleData[key]);
    });
    
    return preview;
  };

  // Update message preview
  useEffect(() => {
    const message = messageType === 'custom' ? formData.message : (selectedTemplate?.message || '');
    setMessagePreview(generateWhatsAppPreview(message));
  }, [formData.message, selectedTemplate, messageType]);

  // Load broadcasts
  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await broadcastsAPI.getBroadcasts();
      if (response.data.success) {
        setBroadcasts(response.data.broadcasts);
        // Load progress for each broadcast
        response.data.broadcasts.forEach(broadcast => {
          if (broadcast.status === 'running' || broadcast.status === 'paused') {
            fetchBroadcastProgress(broadcast.id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load broadcasts:', error);
      setError('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipients when on step 2 or 3 with selected broadcast
  useEffect(() => {
    if ((activeStep === 2 || activeStep === 3) && selectedBroadcastId) {
      fetchRecipients(selectedBroadcastId);
    }
  }, [activeStep, selectedBroadcastId]);

  // Fetch recipients for a broadcast
  const fetchRecipients = async (broadcastId) => {
    try {
      setRecipientsLoading(true);
      const response = await broadcastsAPI.getBroadcastRecipients(broadcastId);
      setRecipients(response.data.recipients || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch recipients');
      console.error('Fetch recipients error:', err);
    } finally {
      setRecipientsLoading(false);
    }
  };

  // Load templates
  const fetchTemplates = async () => {
    try {
      const response = await broadcastTemplatesAPI.getTemplates();
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // Load contacts
  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getContacts();
      if (response.data.success) {
        setContacts(response.data.contacts);
        setFilteredContacts(response.data.contacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  // Load phone numbers
  const fetchPhoneNumbers = async () => {
    try {
      const response = await phonesAPI.getPhones();
      if (response.data.success) {
        setPhoneNumbers(response.data.phones || []);
      }
    } catch (error) {
      console.error('Failed to load phone numbers:', error);
    }
  };

  // Load broadcast queue
  const fetchBroadcastQueue = async () => {
    try {
      const response = await broadcastsAPI.getBroadcastQueue();
      if (response.data.success) {
        setBroadcastQueue(response.data.queue || []);
        setRunningBroadcasts(response.data.running || []);
      }
    } catch (error) {
      console.error('Failed to fetch broadcast queue:', error);
    }
  };

  // Get broadcast recipients with status
  const fetchBroadcastRecipients = async (broadcastId) => {
    try {
      const response = await broadcastsAPI.getBroadcastRecipients(broadcastId);
      if (response.data.success) {
        return response.data.recipients || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch broadcast recipients:', error);
      return [];
    }
  };

  // Get unique categories from contacts
  const getUniqueCategories = () => {
    const categories = new Set();
    contacts.forEach(contact => {
      if (contact.categories && Array.isArray(contact.categories)) {
        contact.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  };

  // Handle sender selection
  const handleSenderChange = (phoneId) => {
    setSelectedSenders(prev => {
      if (prev.includes(phoneId)) {
        return prev.filter(id => id !== phoneId);
      } else {
        return [...prev, phoneId];
      }
    });
  };

  // Handle select all senders
  const handleSelectAllSenders = () => {
    if (selectAllSenders) {
      setSelectedSenders([]);
    } else {
      const onlinePhoneIds = phoneNumbers
        .filter(phone => phone.is_connected === true)
        .map(phone => phone.id);
      setSelectedSenders(onlinePhoneIds);
    }
    setSelectAllSenders(!selectAllSenders);
  };

  // Update selectAllSenders when individual senders change
  useEffect(() => {
    const onlinePhoneIds = phoneNumbers
      .filter(phone => phone.is_connected === true)
      .map(phone => phone.id);
    
    setSelectAllSenders(
      onlinePhoneIds.length > 0 && 
      onlinePhoneIds.every(id => selectedSenders.includes(id))
    );
  }, [selectedSenders, phoneNumbers]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    const socket = require('../services/api').socket;

    // Listen for broadcast status updates
    socket.on('broadcast_status', (data) => {
      console.log('Broadcast status update:', data);
      
      // Update running broadcasts
      if (data.status === 'started' || data.status === 'running') {
        setRunningBroadcasts(prev => {
          const exists = prev.find(b => b.id === data.broadcast_id);
          if (exists) {
            return prev.map(b => 
              b.id === data.broadcast_id 
                ? { ...b, ...data }
                : b
            );
          } else {
            return [...prev, { id: data.broadcast_id, ...data }];
          }
        });
      } else if (data.status === 'completed' || data.status === 'stopped' || data.status === 'failed') {
        setRunningBroadcasts(prev => 
          prev.filter(b => b.id !== data.broadcast_id)
        );
      }
      
      // Update main broadcasts list
      setBroadcasts(prev => 
        prev.map(b => 
          b.id === data.broadcast_id 
            ? { ...b, ...data }
            : b
        )
      );
    });

    // Listen for recipient status updates
    socket.on('recipient_status', (data) => {
      console.log('Recipient status update:', data);
      
      // Update progress data
      setProgressData(prev => ({
        ...prev,
        [data.broadcast_id]: {
          ...prev[data.broadcast_id],
          ...data
        }
      }));
    });

    // Listen for queue updates
    socket.on('queue_update', (data) => {
      console.log('Queue update:', data);
      setBroadcastQueue(data.queue || []);
      setRunningBroadcasts(data.running || []);
    });

    return () => {
      socket.off('broadcast_status');
      socket.off('recipient_status');
      socket.off('queue_update');
    };
  }, []);

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category];
      
      // Update contact filter
      setContactFilter({
        ...contactFilter,
        categories: newCategories
      });
      
      return newCategories;
    });
  };

  // Filter contacts based on search and categories
  useEffect(() => {
    let filtered = contacts;
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(contact => 
        contact.categories && 
        selectedCategories.some(cat => contact.categories.includes(cat))
      );
    }
    
    // Filter by search
    if (contactFilter.search) {
      const searchTerm = contactFilter.search.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name?.toLowerCase().includes(searchTerm) ||
        contact.phone?.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredContacts(filtered);
    setRecipientCount(filtered.length);
  }, [contacts, selectedCategories, contactFilter.search]);

  // Fetch broadcast progress
  const fetchBroadcastProgress = async (broadcastId) => {
    try {
      const response = await broadcastsAPI.getBroadcastProgress(broadcastId);
      if (response.data.success) {
        setProgressData(prev => ({
          ...prev,
          [broadcastId]: response.data.progress
        }));
      }
    } catch (error) {
      console.error('Failed to fetch broadcast progress:', error);
    }
  };

  // Create broadcast
  const handleCreateBroadcast = async () => {
    try {
      // Prepare final data based on stepper choices
      const finalData = {
        name: formData.name,
        description: formData.description,
        message: messageType === 'custom' ? formData.message : (selectedTemplate?.message || ''),
        template_id: messageType === 'template' ? selectedTemplate?.id : null,
        contact_filter: {
          search: contactFilter.search,
          categories: selectedCategories
        },
        scheduled_at: scheduleType === 'later' ? scheduledAt : null,
        recipient_count: recipientCount,
        sender_ids: selectedSenders
      };

      const response = await broadcastsAPI.createBroadcast(finalData);
      if (response.data.success) {
        setSuccess('Broadcast created successfully');
        handleReset();
        fetchBroadcasts();
        // Navigate back to broadcasts list
        navigate('/broadcasts');
      } else {
        setError(response.data.error || 'Failed to create broadcast');
      }
    } catch (error) {
      setError('Failed to create broadcast');
    }
  };

  // Start broadcast
  const handleStartBroadcast = async (broadcastId) => {
    try {
      const response = await broadcastsAPI.startBroadcast(broadcastId);
      if (response.data.success) {
        setSuccess('Broadcast started successfully');
        fetchBroadcasts();
        // Start polling for progress
        const interval = setInterval(() => {
          fetchBroadcastProgress(broadcastId);
        }, 2000);
        setTimeout(() => clearInterval(interval), 60000); // Stop after 1 minute
      } else {
        setError(response.data.error || 'Failed to start broadcast');
      }
    } catch (error) {
      setError('Failed to start broadcast');
    }
  };

  // Pause broadcast
  const handlePauseBroadcast = async (broadcastId) => {
    try {
      const response = await broadcastsAPI.stopBroadcast(broadcastId);
      if (response.data.success) {
        setSuccess('Broadcast paused successfully');
        fetchBroadcasts();
      } else {
        setError(response.data.error || 'Failed to pause broadcast');
      }
    } catch (error) {
      setError('Failed to pause broadcast');
    }
  };

  // Stop broadcast
  const handleStopBroadcast = async (broadcastId) => {
    try {
      const response = await broadcastsAPI.stopBroadcast(broadcastId);
      if (response.data.success) {
        setSuccess('Broadcast stopped successfully');
        fetchBroadcasts();
      } else {
        setError(response.data.error || 'Failed to stop broadcast');
      }
    } catch (error) {
      setError('Failed to stop broadcast');
    }
  };

  // Delete broadcast
  const handleDeleteBroadcast = async (broadcastId) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) {
      return;
    }
    try {
      const response = await broadcastsAPI.deleteBroadcast(broadcastId);
      if (response.data.success) {
        setSuccess('Broadcast deleted successfully');
        fetchBroadcasts();
      } else {
        setError(response.data.error || 'Failed to delete broadcast');
      }
    } catch (error) {
      setError('Failed to delete broadcast');
    }
  };

  // Handle menu open
  const handleMenuOpen = (event, broadcastId) => {
    setAnchorEl(event.currentTarget);
    setSelectedBroadcastId(broadcastId);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBroadcastId(null);
  };

  // Get status chip
  const getStatusChip = (status) => {
    const statusConfig = {
      draft: { color: 'default', icon: <RadioButtonUnchecked />, label: 'Draft' },
      running: { color: 'primary', icon: <PlayArrow />, label: 'Running' },
      paused: { color: 'warning', icon: <Pause />, label: 'Paused' },
      completed: { color: 'success', icon: <CheckCircle />, label: 'Completed' },
      stopped: { color: 'error', icon: <Stop />, label: 'Stopped' },
      failed: { color: 'error', icon: <Error />, label: 'Failed' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchBroadcasts();
    fetchTemplates();
    fetchContacts();
    fetchPhoneNumbers();
    fetchBroadcastQueue();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Create Mode - Full Page Stepper */}
        {isCreateMode ? (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1">
                Create New Broadcast
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/broadcasts')}
              >
                Back to Broadcasts
              </Button>
            </Box>

            {/* Error/Success Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Horizontal Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              <Step>
                <StepLabel>Basic Information</StepLabel>
              </Step>
              <Step>
                <StepLabel>Message Content</StepLabel>
              </Step>
              <Step>
                <StepLabel>Recipients & Schedule</StepLabel>
              </Step>
            </Stepper>

            {/* Step Content */}
            <Box sx={{ mt: 3 }}>
              {/* Step 1: Basic Information */}
              {activeStep === 0 && (
                <Card sx={{ maxWidth: '100%', width: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Broadcast Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={2}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Message Type</InputLabel>
                          <Select
                            value={messageType}
                            onChange={(e) => setMessageType(e.target.value)}
                          >
                            <MenuItem value="custom">Custom Message</MenuItem>
                            <MenuItem value="template">Use Template</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Message Content */}
              {activeStep === 1 && (
                <Card sx={{ maxWidth: '100%', width: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Message Content
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        {messageType === 'custom' ? (
                          <TextField
                            fullWidth
                            label="Message"
                            multiline
                            rows={4}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Enter your message here. Use {name}, {phone}, etc. for placeholders."
                            required
                          />
                        ) : (
                          <FormControl fullWidth>
                            <InputLabel>Select Template</InputLabel>
                            <Select
                              value={selectedTemplate?.id || ''}
                              onChange={(e) => {
                                const template = templates.find(t => t.id === e.target.value);
                                setSelectedTemplate(template);
                              }}
                            >
                              {templates.map((template) => (
                                <MenuItem key={template.id} value={template.id}>
                                  {template.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          WhatsApp Preview:
                        </Typography>
                        {/* WhatsApp Preview Box */}
                        <Box
                          sx={{
                            backgroundColor: '#e5ddd5',
                            borderRadius: 2,
                            padding: 2,
                            maxWidth: 350,
                            margin: '0 auto',
                            position: 'relative'
                          }}
                        >
                          <Box
                            sx={{
                              backgroundColor: '#dcf8c6',
                              borderRadius: 2,
                              padding: 1.5,
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: -7,
                                width: 0,
                                height: 0,
                                borderTop: '10px solid transparent',
                                borderBottom: '10px solid transparent',
                                borderRight: '10px solid #dcf8c6'
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {messagePreview || 'Your message will appear here...'}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Preview with sample data: name: "John Doe", phone: "+62812345678"
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Recipients & Schedule */}
              {activeStep === 2 && (
                <Card sx={{ maxWidth: '100%', width: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Recipients & Schedule
                    </Typography>
                    <Grid container spacing={3}>
                      {/* Sender Selection */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Sender Numbers:
                        </Typography>
                        <Box sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          maxHeight: 200,
                          overflow: 'auto'
                        }}>
                          {/* Select All Option */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: 'white',
                              border: '1px solid #e0e0e0',
                              '&:hover': {
                                bgcolor: 'grey.100',
                                borderColor: '#1976d2'
                              },
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            <Checkbox
                              checked={selectAllSenders}
                              onChange={handleSelectAllSenders}
                              size="small"
                              sx={{ mr: 1.5 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Send with All Online Numbers
                            </Typography>
                            <Chip
                              label={`${phoneNumbers.filter(p => p.is_connected === true).length} available`}
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          </Box>

                          {/* Individual Phone Numbers */}
                          {phoneNumbers.map((phone) => (
                            <Box
                              key={phone.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: 'white',
                                border: '1px solid #e0e0e0',
                                opacity: phone.is_connected === true ? 1 : 0.6,
                                '&:hover': phone.is_connected === true ? {
                                  bgcolor: 'grey.100',
                                  borderColor: '#1976d2'
                                } : {},
                                transition: 'all 0.2s ease-in-out'
                              }}
                            >
                              <Checkbox
                                checked={selectedSenders.includes(phone.id)}
                                onChange={() => handleSenderChange(phone.id)}
                                size="small"
                                sx={{ mr: 1.5 }}
                                disabled={phone.is_connected !== true}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: selectedSenders.includes(phone.id) ? 'medium' : 'normal' }}>
                                  {phone.phone_number}
                                  {phone.device_name && ` - ${phone.device_name}`}
                                </Typography>
                              </Box>
                              <Chip
                                label={phone.is_connected === true ? 'ON' : 'OFF'}
                                size="small"
                                color={phone.is_connected === true ? 'success' : 'default'}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          ))}
                        </Box>
                        {selectedSenders.length === 0 && (
                          <Typography variant="caption" color="error.main" sx={{ mt: 1 }}>
                            Please select at least one sender number
                          </Typography>
                        )}
                      </Grid>

                      {/* Left Column - Contact Selection */}
                      <Grid item xs={12} md={8}>
                        {/* Search Contacts */}
                        <TextField
                          fullWidth
                          label="Search Contacts"
                          value={contactFilter.search}
                          onChange={(e) => setContactFilter({ ...contactFilter, search: e.target.value })}
                          placeholder="Search by name, phone, or email"
                          sx={{ mb: 2 }}
                        />

                        {/* Categories Filter */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Filter by Categories:
                          </Typography>
                          <Box sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            p: 2,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            maxHeight: 300,
                            overflow: 'auto'
                          }}>
                            {getUniqueCategories().map((category) => (
                              <Box
                                key={category}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  p: 1.5,
                                  borderRadius: 1,
                                  bgcolor: 'white',
                                  border: '1px solid #e0e0e0',
                                  '&:hover': {
                                    bgcolor: 'grey.100',
                                    borderColor: '#1976d2'
                                  },
                                  transition: 'all 0.2s ease-in-out'
                                }}
                              >
                                <Checkbox
                                  checked={selectedCategories.includes(category)}
                                  onChange={() => handleCategoryChange(category)}
                                  size="small"
                                  sx={{ mr: 1.5 }}
                                />
                                <Badge
                                  badgeContent={
                                    contacts.filter(contact => 
                                      contact.categories && contact.categories.includes(category)
                                    ).length
                                  }
                                  color="primary"
                                  max={999}
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      fontSize: '0.7rem',
                                      height: 16,
                                      minWidth: 16
                                    }
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: selectedCategories.includes(category) ? 'medium' : 'normal' }}>
                                    {category}
                                  </Typography>
                                </Badge>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                        {/* Recipient Count */}
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="h6" color="primary">
                            Total Recipients: {recipientCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedCategories.length > 0 
                              ? `Filtered by ${selectedCategories.length} categor${selectedCategories.length > 1 ? 'ies' : 'y'}`
                              : 'All contacts'
                            }
                          </Typography>
                        </Box>

                        {/* Sample Contacts Preview */}
                        <Typography variant="subtitle2" gutterBottom>
                          Sample Recipients:
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                          {filteredContacts.slice(0, 5).map((contact) => (
                            <Box key={contact.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="body2">
                                <strong>{contact.name}</strong> - {contact.phone}
                                {contact.categories && (
                                  <Box component="span" sx={{ ml: 1 }}>
                                    {contact.categories.map((cat, idx) => (
                                      <Chip
                                        key={idx}
                                        label={cat}
                                        size="small"
                                        sx={{ ml: 0.5 }}
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Typography>
                            </Box>
                          ))}
                          {filteredContacts.length > 5 && (
                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                              ... and {filteredContacts.length - 5} more contacts
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      {/* Right Column - Schedule */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Schedule Options:
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>When to Send</InputLabel>
                          <Select
                            value={scheduleType}
                            onChange={(e) => setScheduleType(e.target.value)}
                          >
                            <MenuItem value="now">Send Now</MenuItem>
                            <MenuItem value="later">Schedule Later</MenuItem>
                          </Select>
                        </FormControl>
                        
                        {scheduleType === 'later' && (
                          <DatePicker
                            label="Schedule Date & Time"
                            value={scheduledAt}
                            onChange={setScheduledAt}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                          />
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Summary */}
                        <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Broadcast Summary:
                          </Typography>
                          <Typography variant="body2">
                            <strong>Name:</strong> {formData.name}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Message Type:</strong> {messageType === 'custom' ? 'Custom Message' : 'Template'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Senders:</strong> {selectedSenders.length} number{selectedSenders.length !== 1 ? 's' : ''}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Recipients:</strong> {recipientCount} contacts
                          </Typography>
                          <Typography variant="body2">
                            <strong>Schedule:</strong> {scheduleType === 'now' ? 'Send Now' : `Scheduled for ${formatDate(scheduledAt)}`}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={activeStep === 2 ? handleCreateBroadcast : handleNext}
                disabled={
                  (activeStep === 0 && !formData.name) ||
                  (activeStep === 1 && (messageType === 'custom' ? !formData.message : !selectedTemplate)) ||
                  (activeStep === 2 && (selectedSenders.length === 0 || recipientCount === 0))
                }
              >
                {activeStep === 2 ? 'Create Broadcast' : 'Next'}
              </Button>
            </Box>
          </Box>
        ) : (
          /* List Mode - Broadcasts Table */
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1">
                Broadcast Messages
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(runningBroadcasts.length > 0 || broadcastQueue.length > 0) && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<TrendingUp />}
                    onClick={() => setShowDashboard(!showDashboard)}
                  >
                    {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/broadcasts/create')}
                >
                  Create Broadcast
                </Button>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Total Contacts</TableCell>
                      <TableCell>Sent</TableCell>
                      <TableCell>Failed</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {broadcasts.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell onClick={() => {
                   navigate(`/broadcasts/${broadcast.id}`);
                }}>
                          <Typography variant="body1" fontWeight="medium">
                            {broadcast.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {broadcast.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(broadcast.status)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <People fontSize="small" />
                            {broadcast.total_contacts || 0}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle fontSize="small" color="success" />
                            {broadcast.sent_count || 0}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Error fontSize="small" color="error" />
                            {broadcast.failed_count || 0}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(broadcast.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {broadcast.status === 'draft' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<PlayArrow />}
                                onClick={() => handleStartBroadcast(broadcast.id)}
                              >
                                Start
                              </Button>
                            )}
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, broadcast.id)}
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Real-time Broadcast Dashboard */}
            {showDashboard && (runningBroadcasts.length > 0 || broadcastQueue.length > 0) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5" gutterBottom>
                  🚀 Running Broadcasts
                </Typography>
                <Grid container spacing={2}>
                  {runningBroadcasts.map((broadcast) => (
                    <Grid item xs={12} md={6} key={broadcast.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {broadcast.name}
                          </Typography>
                          
                          {/* Progress Bar */}
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">
                                Progress: {broadcast.progress || 0}%
                              </Typography>
                              <Typography variant="body2">
                                {broadcast.sent_count || 0} / {broadcast.total_contacts || 0}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={broadcast.progress || 0}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>

                          {/* Status Tabs */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Recipient Status:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={`Sent: ${broadcast.sent_count || 0}`}
                                color="success"
                                size="small"
                                icon={<CheckCircle />}
                              />
                              <Chip
                                label={`Pending: ${broadcast.pending_count || 0}`}
                                color="warning"
                                size="small"
                                icon={<RadioButtonUnchecked />}
                              />
                              <Chip
                                label={`Failed: ${broadcast.failed_count || 0}`}
                                color="error"
                                size="small"
                                icon={<Error />}
                              />
                            </Box>
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Stop />}
                              onClick={() => handleStopBroadcast(broadcast.id)}
                            >
                              Stop
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Visibility />}
                              onClick={() => {
                                setSelectedBroadcast(broadcast);
                                setViewDialogOpen(true);
                              }}
                            >
                              Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Queue Status */}
            {showDashboard && broadcastQueue.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5" gutterBottom>
                  ⏳ Queue Status
                </Typography>
                <Card>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      {broadcastQueue.length} broadcasts in queue
                    </Typography>
                    {broadcastQueue.slice(0, 5).map((queued) => (
                      <Box key={queued.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2">
                          <strong>{queued.name}</strong> - {queued.total_contacts} recipients
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            Scheduled: {formatDate(queued.scheduled_at)}
                          </Typography>
                        </Typography>
                      </Box>
                    ))}
                    {broadcastQueue.length > 5 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        ... and {broadcastQueue.length - 5} more in queue
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuList>
                <MenuItemComponent onClick={() => {
                  setSelectedBroadcast(broadcasts.find(b => b.id === selectedBroadcastId));
                  setViewDialogOpen(true);
                  navigate(`/broadcasts/${selectedBroadcastId}`);
                }}>
                  <ListItemIcon><Visibility /></ListItemIcon>
                  <ListItemText>View Details</ListItemText>
                </MenuItemComponent>
                <MenuItemComponent onClick={() => {
                  handleStopBroadcast(selectedBroadcastId);
                  handleMenuClose();
                }}>
                  <ListItemIcon><Stop /></ListItemIcon>
                  <ListItemText>Stop</ListItemText>
                </MenuItemComponent>
                <MenuItemComponent onClick={() => {
                  handleDeleteBroadcast(selectedBroadcastId);
                  handleMenuClose();
                }}>
                  <ListItemIcon><Delete /></ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItemComponent>
              </MenuList>
            </Menu>

            {/* View Broadcast Dialog */}
            <Dialog
              open={viewDialogOpen}
              onClose={() => setViewDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Broadcast Details</DialogTitle>
              <DialogContent>
                {selectedBroadcast && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedBroadcast.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      {getStatusChip(selectedBroadcast.status)}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Message
                      </Typography>
                      <Typography variant="body2">
                        {selectedBroadcast.message}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Contacts
                      </Typography>
                      <Typography variant="body1">
                        {selectedBroadcast.total_contacts || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Sent
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {selectedBroadcast.sent_count || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Failed
                      </Typography>
                      <Typography variant="body1" color="error.main">
                        {selectedBroadcast.failed_count || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedBroadcast.created_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Started
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedBroadcast.started_at)}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Broadcasts;
