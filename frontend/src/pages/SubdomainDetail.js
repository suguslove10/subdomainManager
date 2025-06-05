import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { subdomainApi } from '../services/api';

function SubdomainDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [subdomain, setSubdomain] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubdomain = async () => {
      try {
        const response = await subdomainApi.getById(id);
        setSubdomain(response.data);
      } catch (error) {
        console.error('Error fetching subdomain:', error);
        enqueueSnackbar('Failed to fetch subdomain details', { variant: 'error' });
        navigate('/subdomains');
      } finally {
        setLoading(false);
      }
    };

    fetchSubdomain();
  }, [id, navigate, enqueueSnackbar]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!subdomain) {
    return (
      <Typography variant="h5" color="error">
        Subdomain not found
      </Typography>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Subdomain Details</Typography>
        <Button variant="outlined" onClick={() => navigate('/subdomains')}>
          Back to List
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5">{subdomain.name}</Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {subdomain.domain}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">IP Address</Typography>
              <Typography>{subdomain.ipAddress}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Web Server</Typography>
              {subdomain.hasWebServer ? (
                <Chip
                  label={subdomain.webServerType || 'Detected'}
                  color="success"
                  size="small"
                />
              ) : (
                <Chip label="None detected" size="small" />
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">SSL Status</Typography>
              <Chip
                label={subdomain.sslStatus || 'None'}
                color={
                  subdomain.sslStatus === 'valid'
                    ? 'success'
                    : subdomain.sslStatus === 'pending'
                    ? 'warning'
                    : subdomain.sslStatus === 'error'
                    ? 'error'
                    : 'default'
                }
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">SSL Expiry</Typography>
              <Typography>
                {subdomain.sslExpiryDate
                  ? new Date(subdomain.sslExpiryDate).toLocaleDateString()
                  : 'N/A'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2">Created At</Typography>
              <Typography>
                {new Date(subdomain.createdAt).toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2">Last Updated</Typography>
              <Typography>
                {new Date(subdomain.updatedAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default SubdomainDetail; 