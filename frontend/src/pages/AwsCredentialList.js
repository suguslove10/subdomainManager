import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { awsCredentialApi } from '../services/api';

function AwsCredentialList() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const response = await awsCredentialApi.getAll();
      setCredentials(response.data);
    } catch (error) {
      console.error('Error fetching AWS credentials:', error);
      enqueueSnackbar('Failed to fetch AWS credentials', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this AWS credential?')) {
      return;
    }

    try {
      await awsCredentialApi.delete(id);
      enqueueSnackbar('AWS credential deleted successfully', { variant: 'success' });
      fetchCredentials();
    } catch (error) {
      console.error('Error deleting AWS credential:', error);
      enqueueSnackbar('Failed to delete AWS credential', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">AWS Credentials</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCredentials}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            component={RouterLink}
            to="/aws-credentials/create"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add AWS Credential
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Access Key ID</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : credentials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No AWS credentials found
                </TableCell>
              </TableRow>
            ) : (
              credentials.map((credential) => (
                <TableRow key={credential._id}>
                  <TableCell>{credential.name}</TableCell>
                  <TableCell>
                    {credential.accessKeyId.slice(0, 4)}...{credential.accessKeyId.slice(-4)}
                  </TableCell>
                  <TableCell>{credential.region}</TableCell>
                  <TableCell>
                    <Chip
                      label={credential.isActive ? 'Active' : 'Inactive'}
                      color={credential.isActive ? 'success' : 'default'}
                      size="small"
                      icon={credential.isActive ? <CheckIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        component={RouterLink}
                        to={`/aws-credentials/${credential._id}`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(credential._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AwsCredentialList; 