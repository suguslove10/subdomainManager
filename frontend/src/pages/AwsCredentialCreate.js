import React, { useState } from 'react';
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
  FormHelperText,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { awsCredentialApi } from '../services/api';

const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-east-1',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-south-1',
  'eu-north-1',
  'me-south-1',
  'sa-east-1',
];

function AwsCredentialCreate() {
  const [formData, setFormData] = useState({
    name: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });
  
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Reset validation status when credentials change
    if (name === 'accessKeyId' || name === 'secretAccessKey') {
      setIsValid(null);
    }
  };

  const handleValidate = async () => {
    if (!formData.accessKeyId || !formData.secretAccessKey) {
      enqueueSnackbar('Please enter both Access Key ID and Secret Access Key', { variant: 'warning' });
      return;
    }
    
    setValidating(true);
    
    try {
      const response = await awsCredentialApi.validate({
        accessKeyId: formData.accessKeyId,
        secretAccessKey: formData.secretAccessKey,
        region: formData.region,
      });
      
      setIsValid(response.data.valid);
      enqueueSnackbar(
        response.data.valid
          ? 'AWS credentials are valid'
          : 'AWS credentials are invalid',
        { variant: response.data.valid ? 'success' : 'error' }
      );
    } catch (error) {
      console.error('Error validating AWS credentials:', error);
      setIsValid(false);
      enqueueSnackbar('Failed to validate AWS credentials', { variant: 'error' });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.accessKeyId || !formData.secretAccessKey) {
      enqueueSnackbar('Please fill all required fields', { variant: 'warning' });
      return;
    }
    
    setLoading(true);
    
    try {
      await awsCredentialApi.create(formData);
      enqueueSnackbar('AWS credential created successfully', { variant: 'success' });
      navigate('/aws-credentials');
    } catch (error) {
      console.error('Error creating AWS credential:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Failed to create AWS credential',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New AWS Credential
      </Typography>
      
      <Card>
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            AWS credentials are used for DNS management with Route 53 and other AWS services.
            These credentials will be encrypted before storage.
          </Alert>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Credential Name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="A friendly name to identify this credential"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="accessKeyId"
                  label="Access Key ID"
                  value={formData.accessKeyId}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="secretAccessKey"
                  label="Secret Access Key"
                  type={showSecret ? 'text' : 'password'}
                  value={formData.secretAccessKey}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowSecret(!showSecret)}
                          edge="end"
                        >
                          {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="region-label">Region</InputLabel>
                  <Select
                    labelId="region-label"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    label="Region"
                  >
                    {AWS_REGIONS.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select the AWS region for this credential</FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleValidate}
                    disabled={validating || !formData.accessKeyId || !formData.secretAccessKey}
                    startIcon={validating ? <CircularProgress size={20} /> : <InfoIcon />}
                  >
                    {validating ? 'Validating...' : 'Validate Credentials'}
                  </Button>
                  
                  {isValid !== null && (
                    <Alert severity={isValid ? 'success' : 'error'} sx={{ ml: 2, flex: 1 }}>
                      {isValid
                        ? 'Credentials are valid and working properly'
                        : 'Credentials are invalid or insufficient permissions'}
                    </Alert>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => navigate('/aws-credentials')}
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
                    {loading ? 'Creating...' : 'Create Credential'}
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

export default AwsCredentialCreate; 