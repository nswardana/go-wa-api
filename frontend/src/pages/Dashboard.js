import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Container,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People,
  Phone,
  Message,
  Notifications,
  TrendingUp,
  Send,
  WhatsApp,
  Settings,
  Refresh,
  MoreVert,
  Visibility
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { statsAPI } from '../services/api';

// Color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: color
      }}
    />
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp sx={{ color: color, mr: 0.5, fontSize: 16 }} />
              <Typography variant="body2" sx={{ color: color }}>
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ backgroundColor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const RecentActivity = ({ activities }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        {activities.map((activity, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 1,
              borderBottom: index !== activities.length - 1 ? '1px solid #eee' : 'none'
            }}
          >
            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
              {activity.icon}
            </Avatar>
            <Box flex={1}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {activity.title}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {activity.description}
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary">
              {activity.time}
            </Typography>
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const QuickActions = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              border: '1px solid #eee',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <WhatsApp sx={{ fontSize: 32, color: '#25D366', mb: 1 }} />
            <Typography variant="body2" align="center">
              Send Message
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              border: '1px solid #eee',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <Phone sx={{ fontSize: 32, color: '#1976D2', mb: 1 }} />
            <Typography variant="body2" align="center">
              Add Phone
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              border: '1px solid #eee',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <Message sx={{ fontSize: 32, color: '#FF9800', mb: 1 }} />
            <Typography variant="body2" align="center">
              Templates
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              border: '1px solid #eee',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <Settings sx={{ fontSize: 32, color: '#9E9E9E', mb: 1 }} />
            <Typography variant="body2" align="center">
              Settings
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageData, setMessageData] = useState([]);
  const [phoneData, setPhoneData] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data for demonstration
        const mockStats = {
          totalUsers: 1234,
          totalPhones: 56,
          totalMessages: 7890,
          totalTemplates: 23
        };

        const mockMessageData = [
          { month: 'Jan', messages: 1200 },
          { month: 'Feb', messages: 1800 },
          { month: 'Mar', messages: 1500 },
          { month: 'Apr', messages: 2200 },
          { month: 'May', messages: 2800 },
          { month: 'Jun', messages: 3200 }
        ];

        const mockPhoneData = [
          { name: 'Active', value: 45, color: '#00C49F' },
          { name: 'Inactive', value: 8, color: '#FF8042' },
          { name: 'Pending', value: 3, color: '#FFBB28' }
        ];

        const mockActivities = [
          {
            icon: <Send />,
            title: 'Message Sent',
            description: 'To +628123456789',
            time: '2 mins ago'
          },
          {
            icon: <Phone />,
            title: 'Phone Added',
            description: '+628987654321',
            time: '15 mins ago'
          },
          {
            icon: <People />,
            title: 'New User',
            description: 'user@example.com',
            time: '1 hour ago'
          },
          {
            icon: <Message />,
            title: 'Template Created',
            description: 'Welcome Message',
            time: '2 hours ago'
          }
        ];

        setStats(mockStats);
        setMessageData(mockMessageData);
        setPhoneData(mockPhoneData);
        setActivities(mockActivities);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome to ChatFlow Dashboard. Monitor your WhatsApp messaging performance and manage your services.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<People />}
            color="#1976D2"
            subtitle="Active users"
            trend="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Phone Numbers"
            value={stats.totalPhones}
            icon={<Phone />}
            color="#388E3C"
            subtitle="Connected devices"
            trend="+5%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages Sent"
            value={stats.totalMessages.toLocaleString()}
            icon={<Message />}
            color="#F57C00"
            subtitle="This month"
            trend="+25%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Templates"
            value={stats.totalTemplates}
            icon={<Notifications />}
            color="#9C27B0"
            subtitle="Available templates"
            trend="+3%"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Statistics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={messageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#1976D2"
                    strokeWidth={2}
                    dot={{ fill: '#1976D2' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Phone Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={phoneData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {phoneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <RecentActivity activities={activities} />
        </Grid>
        <Grid item xs={12} md={4}>
          <QuickActions />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
