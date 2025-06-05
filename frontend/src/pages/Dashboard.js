import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  Language as LanguageIcon,
  CloudCircle as CloudIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { subdomainApi, awsCredentialApi } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    subdomains: { total: 0, loading: true },
    certificates: { valid: 0, pending: 0, error: 0, loading: true },
    awsCredentials: { total: 0, loading: true },
  });

  useEffect(() => {
    // Fetch subdomains
    subdomainApi.getAll()
      .then(response => {
        const subdomains = response.data;
        const validCerts = subdomains.filter(sd => sd.sslStatus === 'valid').length;
        const pendingCerts = subdomains.filter(sd => sd.sslStatus === 'pending').length;
        const errorCerts = subdomains.filter(sd => sd.sslStatus === 'error').length;
        
        setStats(prev => ({
          ...prev,
          subdomains: { total: subdomains.length, loading: false },
          certificates: { 
            valid: validCerts, 
            pending: pendingCerts, 
            error: errorCerts, 
            loading: false 
          },
        }));
      })
      .catch(error => {
        console.error('Error fetching subdomains:', error);
        setStats(prev => ({
          ...prev,
          subdomains: { total: 0, loading: false },
          certificates: { valid: 0, pending: 0, error: 0, loading: false },
        }));
      });
    
    // Fetch AWS credentials
    awsCredentialApi.getAll()
      .then(response => {
        setStats(prev => ({
          ...prev,
          awsCredentials: { total: response.data.length, loading: false },
        }));
      })
      .catch(error => {
        console.error('Error fetching AWS credentials:', error);
        setStats(prev => ({
          ...prev,
          awsCredentials: { total: 0, loading: false },
        }));
      });
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Subdomains card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LanguageIcon color="primary" fontSize="large" />
                <Typography variant="h6">Subdomains</Typography>
              </Stack>
              <Typography variant="h3" align="center" my={3}>
                {stats.subdomains.loading ? (
                  <CircularProgress size={40} />
                ) : (
                  stats.subdomains.total
                )}
              </Typography>
              <Button
                component={RouterLink}
                to="/subdomains"
                variant="outlined"
                fullWidth
              >
                Manage Subdomains
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* SSL Certificates card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SSL Certificates
              </Typography>
              {stats.certificates.loading ? (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={2} my={2}>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CheckIcon color="success" />
                      <Typography>Valid: {stats.certificates.valid}</Typography>
                    </Stack>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PendingIcon color="warning" />
                      <Typography>Pending: {stats.certificates.pending}</Typography>
                    </Stack>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ErrorIcon color="error" />
                      <Typography>Error: {stats.certificates.error}</Typography>
                    </Stack>
                  </Paper>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* AWS Credentials card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CloudIcon color="primary" fontSize="large" />
                <Typography variant="h6">AWS Credentials</Typography>
              </Stack>
              <Typography variant="h3" align="center" my={3}>
                {stats.awsCredentials.loading ? (
                  <CircularProgress size={40} />
                ) : (
                  stats.awsCredentials.total
                )}
              </Typography>
              <Button
                component={RouterLink}
                to="/aws-credentials"
                variant="outlined"
                fullWidth
              >
                Manage AWS Credentials
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    component={RouterLink}
                    to="/subdomains/create"
                    variant="contained"
                    fullWidth
                    startIcon={<LanguageIcon />}
                  >
                    Add Subdomain
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    component={RouterLink}
                    to="/aws-credentials/create"
                    variant="contained"
                    fullWidth
                    startIcon={<CloudIcon />}
                  >
                    Add AWS Credential
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 