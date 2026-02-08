import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Settings = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Typography variant="body1" color="text.secondary">
        Settings page - Coming soon!
      </Typography>
    </Container>
  );
};

export default Settings;
