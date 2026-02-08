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
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Send,
  Code,
  Preview
} from '@mui/icons-material';
import { templatesAPI } from '../services/api';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general',
    variables: []
  });
  const [previewData, setPreviewData] = useState({
    template: null,
    variables: {}
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await templatesAPI.getTemplates();
      setTemplates(response.data.templates || []);
    } catch (error) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await templatesAPI.updateTemplate(editingTemplate.id, formData);
        setSuccess('Template updated successfully');
      } else {
        await templatesAPI.createTemplate(formData);
        setSuccess('Template created successfully');
      }
      
      setDialogOpen(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        content: '',
        category: 'general',
        variables: []
      });
      fetchTemplates();
    } catch (error) {
      setError('Failed to save template');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      variables: template.variables || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templatesAPI.deleteTemplate(templateId);
        setSuccess('Template deleted successfully');
        fetchTemplates();
      } catch (error) {
        setError('Failed to delete template');
      }
    }
  };

  const handlePreview = async (template) => {
    try {
      const variables = {};
      template.variables?.forEach(variable => {
        variables[variable] = `[${variable}]`;
      });
      
      const response = await templatesAPI.processTemplate(template.id, { variables });
      setPreviewData({
        template: response.data.template,
        variables
      });
      setPreviewDialogOpen(true);
    } catch (error) {
      setError('Failed to process template');
    }
  };

  const extractVariables = (content) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(regex) || [];
    return matches.map(match => match.replace(/[{}]/g, ''));
  };

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content,
      variables: extractVariables(content)
    });
  };

  const categories = ['general', 'welcome', 'notification', 'marketing', 'support'];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Message Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Create Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={4} lg={12} key={template.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {template.name}
                </Typography>
                <Chip 
                  label={template.category} 
                  size="small" 
                  color="primary" 
                  sx={{ mb: 2 }}
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    height: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {template.content}
                </Typography>
                {template.variables && template.variables.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Variables: {template.variables.join(', ')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Tooltip title="Preview">
                  <IconButton 
                    size="small" 
                    onClick={() => handlePreview(template)}
                  >
                    <Preview />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(template)}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Template Content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  required
                  multiline
                  rows={6}
                  margin="normal"
                  helperText="Use {{variable_name}} for variables (e.g., {{name}}, {{order_id}})"
                />
              </Grid>
              {formData.variables.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detected Variables:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {formData.variables.map((variable, index) => (
                      <Chip
                        key={index}
                        label={`{{${variable}}}`}
                        size="small"
                        color="secondary"
                        icon={<Code />}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {previewData.template && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {previewData.template.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category: {previewData.template.category}
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                  {previewData.template.processedContent}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
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

export default Templates;
