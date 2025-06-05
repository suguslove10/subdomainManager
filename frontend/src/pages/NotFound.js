import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';

function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 5,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default NotFound; 