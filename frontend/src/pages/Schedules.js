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
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  Schedule,
  Send,
  AccessTime,
  CheckCircle,
  Error,
  Pending
} from '@mui/icons-material';
import { schedulesAPI, phonesAPI } from '../services/api';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    phoneId: '',
    to: '',
    content: '',
    scheduledAt: '',
    type: 'text'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSchedules();
    fetchPhones();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await schedulesAPI.getSchedules();
      setSchedules(response.data.schedules || []);
    } catch (error) {
      setError('Failed to fetch schedules');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await schedulesAPI.updateSchedule(editingSchedule.id, formData);
        setSuccess('Schedule updated successfully');
      } else {
        await schedulesAPI.createSchedule(formData);
        setSuccess('Schedule created successfully');
      }
      
      setDialogOpen(false);
      setEditingSchedule(null);
      setFormData({
        phoneId: '',
        to: '',
        content: '',
        scheduledAt: '',
        type: 'text'
      });
      fetchSchedules();
    } catch (error) {
      setError('Failed to save schedule');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      phoneId: schedule.phone_id,
      to: schedule.to_number,
      content: schedule.content,
      scheduledAt: new Date(schedule.scheduled_at).toISOString().slice(0, 16),
      type: schedule.message_type
    });
    setDialogOpen(true);
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this scheduled message?')) {
      try {
        await schedulesAPI.deleteSchedule(scheduleId);
        setSuccess('Schedule deleted successfully');
        fetchSchedules();
      } catch (error) {
        setError('Failed to delete schedule');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Pending color="warning" />;
      case 'processing':
        return <AccessTime color="info" />;
      case 'sent':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      default:
        return <Schedule />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'sent':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80
    },
    {
      field: 'device_name',
      headerName: 'Device',
      width: 150,
      valueGetter: (params) => params.row.device_name || 'Unknown'
    },
    {
      field: 'to_number',
      headerName: 'To',
      width: 150
    },
    {
      field: 'content',
      headerName: 'Message',
      width: 250,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Box
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            {params.value}
          </Box>
        </Tooltip>
      )
    },
    {
      field: 'scheduled_at',
      headerName: 'Scheduled At',
      width: 180,
      valueGetter: (params) => formatDateTime(params.value)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {params.row.status === 'pending' && (
            <>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => handleEdit(params.row)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(params.row.id)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Scheduled Messages
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Schedule Message
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={schedules}
          columns={columns}
          loading={loading}
          pageSize={25}
          rowsPerPageOptions={[25, 50, 100]}
          disableSelectionOnClick
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSchedule ? 'Edit Scheduled Message' : 'Schedule New Message'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Recipient Number"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  required
                  margin="normal"
                  placeholder="+628123456789"
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Schedule Date & Time"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  required
                  margin="normal"
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Message Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Message Type"
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="image">Image</MenuItem>
                    <MenuItem value="document">Document</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingSchedule ? 'Update' : 'Schedule'}
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

export default Schedules;
