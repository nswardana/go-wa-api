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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Upload,
  Download,
  Search,
  PeopleOutlined,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { contactsAPI, categoriesAPI } from '../services/api';

const Contacts = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: Contacts, 1: Categories
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContacts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [searchTerm, selectedCategory]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        category: selectedCategory
      };
      const response = await contactsAPI.getContacts(params);
      setContacts(response.data.contacts);
    } catch (error) {
      setError('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSaveContact = async (contactData) => {
    try {
      if (editingContact) {
        await contactsAPI.updateContact(editingContact.id, contactData);
        setSuccess('Contact updated successfully');
      } else {
        await contactsAPI.createContact(contactData);
        setSuccess('Contact created successfully');
      }
      setDialogOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save contact');
    }
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        await categoriesAPI.updateCategory(editingCategory.id, categoryData);
        setSuccess('Category updated successfully');
      } else {
        await categoriesAPI.createCategory(categoryData);
        setSuccess('Category created successfully');
      }
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactsAPI.deleteContact(id);
        setSuccess('Contact deleted successfully');
        fetchContacts();
      } catch (error) {
        setError('Failed to delete contact');
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesAPI.deleteCategory(id);
        setSuccess('Category deleted successfully');
        fetchCategories();
      } catch (error) {
        setError('Failed to delete category');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
      try {
        await contactsAPI.bulkDelete(selectedContacts);
        setSuccess(`${selectedContacts.length} contacts deleted successfully`);
        setSelectedContacts([]);
        fetchContacts();
      } catch (error) {
        setError('Failed to delete contacts');
      }
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        format: 'csv',
        category: selectedCategory
      };
      await contactsAPI.exportContacts(params);
      setSuccess('Contacts exported successfully');
    } catch (error) {
      setError('Failed to export contacts');
    }
  };

  const handleImport = async (contacts) => {
    try {
      await contactsAPI.importContacts({ contacts });
      setSuccess('Contacts imported successfully');
      fetchContacts();
      setImportDialogOpen(false);
    } catch (error) {
      setError('Failed to import contacts');
    }
  };

  const contactColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'company', headerName: 'Company', width: 150 },
    {
      field: 'categories',
      headerName: 'Categories',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(params.value || []).map((category, index) => (
            <Chip
              key={index}
              label={category}
              size="small"
              sx={{ backgroundColor: '#1976d2', color: 'white' }}
            />
          ))}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => {
              setEditingContact(params.row);
              setDialogOpen(true);
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteContact(params.row.id)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const categoryColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: params.row.color || '#1976d2'
            }}
          />
          <Typography>{params.value}</Typography>
        </Box>
      )
    },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'created_at', headerName: 'Created', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => {
              setEditingCategory(params.row);
              setCategoryDialogOpen(true);
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteCategory(params.row.id)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Contact Management</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Contacts" />
          <Tab label="Categories" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          {/* Header Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
              <TextField
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1 }} />
                }}
                sx={{ minWidth: 300 }}
              />
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setImportDialogOpen(true)}
              >
                Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
              >
                Add Contact
              </Button>
            </Box>
          </Box>

          {/* Bulk Actions */}
          {selectedContacts.length > 0 && (
            <Box sx={{ p: 2, backgroundColor: 'grey.50', mb: 2, borderRadius: 1 }}>
              <Typography variant="body2">
                {selectedContacts.length} contacts selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  onClick={handleBulkDelete}
                  color="error"
                >
                  Delete Selected
                </Button>
              </Box>
            </Box>
          )}

          {/* Contacts Table */}
          <DataGrid
            rows={contacts}
            columns={contactColumns}
            checkboxSelection
            onSelectionModelChange={setSelectedContacts}
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            loading={loading}
            getRowId={(row) => row.id}
          />
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          {/* Category Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Category Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCategoryDialogOpen(true)}
            >
              Add Category
            </Button>
          </Box>

          {/* Categories Table */}
          <DataGrid
            rows={categories}
            columns={categoryColumns}
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50]}
            getRowId={(row) => row.id}
          />
        </Paper>
      )}

      {/* Contact Dialog */}
      <ContactDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingContact(null);
        }}
        contact={editingContact}
        categories={categories}
        onSave={handleSaveContact}
      />

      {/* Category Dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => {
          setCategoryDialogOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
      />
    </Box>
  );
};

// Contact Dialog Component
const ContactDialog = ({ open, onClose, contact, categories, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    notes: '',
    categories: []
  });

  useEffect(() => {
    if (contact) {
      // Convert category names to IDs when loading contact data
      const categoryIds = contact.categories.map(catName => {
        const category = categories.find(cat => cat.name === catName);
        return category ? category.id : catName;
      });
      setFormData({
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        company: contact.company || '',
        address: contact.address || '',
        notes: contact.notes || '',
        categories: categoryIds
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        address: '',
        notes: '',
        categories: []
      });
    }
  }, [contact, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {contact ? 'Edit Contact' : 'Add New Contact'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={formData.categories}
                  onChange={(e) => setFormData({...formData, categories: e.target.value})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={categories.find(cat => cat.id === value)?.name || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {contact ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Category Dialog Component
const CategoryDialog = ({ open, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2'
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#1976d2'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#1976d2'
      });
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? 'Edit Category' : 'Add New Category'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {category ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Import Dialog Component
const ImportDialog = ({ open, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const lines = data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const contacts = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          name: values[0] || '',
          phone: values[1] || '',
          email: values[2] || '',
          company: values[3] || ''
        };
      }).filter(contact => contact.name && contact.phone);
      
      setPreview(contacts.slice(0, 5));
    };
    reader.readAsText(uploadedFile);
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      await onImport(preview);
      setImporting(false);
      onClose();
    } catch (error) {
      setImporting(false);
      console.error('Import error:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import Contacts</DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Choose CSV File
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleFileUpload}
              />
            </Button>
          </Grid>
          
          {preview.length > 0 && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6">Preview (First 5 rows)</Typography>
                <Alert severity="info">
                  CSV format: Name, Phone, Email, Company
                </Alert>
              </Grid>
              
              <Grid item xs={12}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Company</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.phone}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.company}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleImport} 
          variant="contained"
          disabled={preview.length === 0 || importing}
        >
          {importing ? 'Importing...' : `Import ${preview.length} Contacts`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Contacts;
