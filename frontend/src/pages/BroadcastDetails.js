import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Badge,
  Stack,
  Avatar
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Error,
  RadioButtonUnchecked,
  Schedule,
  Send,
  People,
  TrendingUp,
  Refresh,
  Stop,
  PlayArrow,
  Pause,
  Phone,
  AccessTime
} from '@mui/icons-material';
import { broadcastsAPI } from '../services/api';

const BroadcastDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [broadcast, setBroadcast] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Tab filters
  const [sentRecipients, setSentRecipients] = useState([]);
  const [failedRecipients, setFailedRecipients] = useState([]);
  const [pendingRecipients, setPendingRecipients] = useState([]);

  // Load broadcast details
  const fetchBroadcastDetails = async () => {
    try {
      setLoading(true);
      const response = await broadcastsAPI.getBroadcast(id);
      if (response.data.success) {
        setBroadcast(response.data.broadcast);
      } else {
        setError(response.data.error || 'Failed to load broadcast details');
      }
    } catch (error) {
      setError('Failed to load broadcast details');
    } finally {
      setLoading(false);
    }
  };

  // Load recipients
  const fetchRecipients = async () => {
    try {
      const response = await broadcastsAPI.getBroadcastRecipients(id);
      if (response.data.success) {
        const allRecipients = response.data.recipients || [];
        setRecipients(allRecipients);
        
        // Filter by status
        setSentRecipients(allRecipients.filter(r => r.status === 'sent'));
        setFailedRecipients(allRecipients.filter(r => r.status === 'failed'));
        setPendingRecipients(allRecipients.filter(r => r.status === 'pending'));
      }
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchBroadcastDetails(),
      fetchRecipients()
    ]);
    setRefreshing(false);
  };

  // Start broadcast
  const handleStart = async () => {
    try {
      const response = await broadcastsAPI.startBroadcast(id);
      if (response.data.success) {
        await fetchBroadcastDetails();
        await fetchRecipients();
      } else {
        setError(response.data.error || 'Failed to start broadcast');
      }
    } catch (error) {
      setError('Failed to start broadcast');
    }
  };

  // Stop broadcast
  const handleStop = async () => {
    try {
      const response = await broadcastsAPI.stopBroadcast(id);
      if (response.data.success) {
        await fetchBroadcastDetails();
        await fetchRecipients();
      } else {
        setError(response.data.error || 'Failed to stop broadcast');
      }
    } catch (error) {
      setError('Failed to stop broadcast');
    }
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
        size="medium"
      />
    );
  };

  // Calculate percentages
  const getProgressPercentage = () => {
    if (!broadcast) return 0;
    const total = broadcast.total_contacts || 0;
    const sent = broadcast.sent_count || 0;
    return total > 0 ? Math.round((sent / total) * 100) : 0;
  };

  const getSuccessRate = () => {
    if (!broadcast) return 0;
    const total = broadcast.total_contacts || 0;
    const sent = broadcast.sent_count || 0;
    const failed = broadcast.failed_count || 0;
    const processed = sent + failed;
    return processed > 0 ? Math.round((sent / processed) * 100) : 0;
  };

  useEffect(() => {
    if (id) {
      fetchBroadcastDetails();
      fetchRecipients();
    }
  }, [id]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading broadcast details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/broadcasts')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1">
              📢 Broadcast Dashboard
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {broadcast?.status === 'draft' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={handleStart}
              >
                Start Broadcast
              </Button>
            )}
            {(broadcast?.status === 'running' || broadcast?.status === 'paused') && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={handleStop}
              >
                Stop Broadcast
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {broadcast && (
        <Grid container spacing={3}>
          {/* Broadcast Overview */}
          <Grid item xs={12} lg={4}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <Send />
                  </Avatar>
                  <Typography variant="h6" component="h2">
                    {broadcast.name}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  {getStatusChip(broadcast.status)}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Progress
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {getProgressPercentage()}% Complete
                      </Typography>
                      <Typography variant="body2">
                        {broadcast.sent_count || 0} / {broadcast.total_contacts || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressPercentage()}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Schedule
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Created:</strong> {new Date(broadcast.created_at).toLocaleString()}
                      </Typography>
                      {broadcast.started_at && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Started:</strong> {new Date(broadcast.started_at).toLocaleString()}
                        </Typography>
                      )}
                      {broadcast.scheduled_at && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Scheduled:</strong> {new Date(broadcast.scheduled_at).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Stats Cards */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'success.main', mb: 1, mx: 'auto' }}>
                          <CheckCircle />
                        </Avatar>
                      </Box>
                      <Typography variant="h4" color="success.main">
                        {broadcast.sent_count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ✅ Messages Sent
                      </Typography>
                      <Chip
                        label={`${getSuccessRate()}% success rate`}
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'warning.main', mb: 1, mx: 'auto' }}>
                          <RadioButtonUnchecked />
                        </Avatar>
                      </Box>
                      <Typography variant="h4" color="warning.main">
                        {broadcast.pending_count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ⏳ Pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'error.main', mb: 1, mx: 'auto' }}>
                          <Error />
                        </Avatar>
                      </Box>
                      <Typography variant="h4" color="error.main">
                        {broadcast.failed_count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ❌ Failed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'info.main', mb: 1, mx: 'auto' }}>
                          <People />
                        </Avatar>
                      </Box>
                      <Typography variant="h4" color="info.main">
                        {broadcast.total_contacts || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📋 Total Recipients
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recipients Details */}
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      👥 Recipients Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recipients.length} total recipients
                    </Typography>
                  </Box>

                  {/* Tabs */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                      <Tab 
                        label={
                          <Badge badgeContent={sentRecipients.length} color="success">
                            <span>✅ Sent ({sentRecipients.length})</span>
                          </Badge>
                        } 
                      />
                      <Tab 
                        label={
                          <Badge badgeContent={pendingRecipients.length} color="warning">
                            <span>⏳ Pending ({pendingRecipients.length})</span>
                          </Badge>
                        } 
                      />
                      <Tab 
                        label={
                          <Badge badgeContent={failedRecipients.length} color="error">
                            <span>❌ Failed ({failedRecipients.length})</span>
                          </Badge>
                        } 
                      />
                    </Tabs>
                  </Box>

                  {/* Tab Content */}
                  <Box sx={{ mt: 2 }}>
                    {/* Sent Recipients */}
                    {activeTab === 0 && (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Sent At</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sentRecipients.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                                  <Typography variant="body1" color="text.secondary">
                                    No sent recipients yet
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              sentRecipients.map((recipient) => (
                                <TableRow key={recipient.id}>
                                  <TableCell>{recipient.name}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Phone sx={{ mr: 1, fontSize: 16 }} />
                                      {recipient.phone}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label="Sent"
                                      color="success"
                                      size="small"
                                      icon={<CheckCircle />}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : '-'}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    {/* Pending Recipients */}
                    {activeTab === 1 && (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Created At</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pendingRecipients.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                                  <Typography variant="body1" color="text.secondary">
                                    No pending recipients
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              pendingRecipients.map((recipient) => (
                                <TableRow key={recipient.id}>
                                  <TableCell>{recipient.name}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Phone sx={{ mr: 1, fontSize: 16 }} />
                                      {recipient.phone}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label="Pending"
                                      color="warning"
                                      size="small"
                                      icon={<RadioButtonUnchecked />}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {recipient.created_at ? new Date(recipient.created_at).toLocaleString() : '-'}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    {/* Failed Recipients */}
                    {activeTab === 2 && (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Error Message</TableCell>
                              <TableCell>Failed At</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {failedRecipients.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                  <Typography variant="body1" color="text.secondary">
                                    No failed recipients
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              failedRecipients.map((recipient) => (
                                <TableRow key={recipient.id}>
                                  <TableCell>{recipient.name}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Phone sx={{ mr: 1, fontSize: 16 }} />
                                      {recipient.phone}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label="Failed"
                                      color="error"
                                      size="small"
                                      icon={<Error />}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="error.main" sx={{ maxWidth: 200 }}>
                                      {recipient.error_message || 'Unknown error'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {recipient.failed_at ? new Date(recipient.failed_at).toLocaleString() : '-'}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default BroadcastDetails;