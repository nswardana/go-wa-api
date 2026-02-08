import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Users = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Users Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary">
        User management page - Coming soon!
      </Typography>
    </Container>
  );
};

export default Users;
