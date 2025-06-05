import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { subdomainApi, awsCredentialApi } from '../services/api';

function SubdomainCreate() {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    awsCredentialId: '',
  });
  
  const [awsCredentials, setAwsCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [awsLoading, setAwsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch AWS credentials
    setAwsLoading(true);
    awsCredentialApi.getAll()
      .then(response => {
        setAwsCredentials(response.data);
      })
      .catch(error => {
        console.error('Error fetching AWS credentials:', error);
        enqueueSnackbar('Failed to fetch AWS credentials', { variant: 'error' });
      })
      .finally(() => {
        setAwsLoading(false);
      });
  }, [enqueueSnackbar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.domain) {
      enqueueSnackbar('Please fill all required fields', { variant: 'warning' });
      return;
    }
    
    setLoading(true);
    
    try {
      await subdomainApi.create(formData);
      enqueueSnackbar('Subdomain created successfully', { variant: 'success' });
      navigate('/subdomains');
    } catch (error) {
      console.error('Error creating subdomain:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Failed to create subdomain',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Subdomain
      </Typography>
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Subdomain Name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="e.g. 'blog' for blog.example.com"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="domain"
                  label="Domain"
                  value={formData.domain}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="e.g. 'example.com'"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth disabled={awsLoading}>
                  <InputLabel id="aws-credential-label">AWS Credential (Optional)</InputLabel>
                  <Select
                    labelId="aws-credential-label"
                    name="awsCredentialId"
                    value={formData.awsCredentialId}
                    onChange={handleChange}
                    label="AWS Credential (Optional)"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {awsCredentials.map((credential) => (
                      <MenuItem key={credential._id} value={credential._id}>
                        {credential.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => navigate('/subdomains')}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Creating...' : 'Create Subdomain'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default SubdomainCreate; 