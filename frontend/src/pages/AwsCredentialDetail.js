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
import { awsCredentialApi } from '../services/api';

function AwsCredentialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        const response = await awsCredentialApi.getById(id);
        setCredential(response.data);
      } catch (error) {
        console.error('Error fetching AWS credential:', error);
        enqueueSnackbar('Failed to fetch AWS credential details', { variant: 'error' });
        navigate('/aws-credentials');
      } finally {
        setLoading(false);
      }
    };

    fetchCredential();
  }, [id, navigate, enqueueSnackbar]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!credential) {
    return (
      <Typography variant="h5" color="error">
        AWS credential not found
      </Typography>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">AWS Credential Details</Typography>
        <Button variant="outlined" onClick={() => navigate('/aws-credentials')}>
          Back to List
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5">{credential.name}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Access Key ID</Typography>
              <Typography>
                {credential.accessKeyId.slice(0, 4)}...{credential.accessKeyId.slice(-4)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Region</Typography>
              <Typography>{credential.region}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Status</Typography>
              <Chip
                label={credential.isActive ? 'Active' : 'Inactive'}
                color={credential.isActive ? 'success' : 'default'}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2">Created At</Typography>
              <Typography>
                {new Date(credential.createdAt).toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2">Last Updated</Typography>
              <Typography>
                {new Date(credential.updatedAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AwsCredentialDetail; 