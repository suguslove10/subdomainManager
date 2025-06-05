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
  Https as HttpsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { subdomainApi } from '../services/api';

function SubdomainList() {
  const [subdomains, setSubdomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const fetchSubdomains = async () => {
    setLoading(true);
    try {
      const response = await subdomainApi.getAll();
      setSubdomains(response.data);
    } catch (error) {
      console.error('Error fetching subdomains:', error);
      enqueueSnackbar('Failed to fetch subdomains', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubdomains();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subdomain?')) {
      return;
    }

    try {
      await subdomainApi.delete(id);
      enqueueSnackbar('Subdomain deleted successfully', { variant: 'success' });
      fetchSubdomains();
    } catch (error) {
      console.error('Error deleting subdomain:', error);
      enqueueSnackbar('Failed to delete subdomain', { variant: 'error' });
    }
  };

  const handleCheckWebServer = async (id) => {
    try {
      const response = await subdomainApi.checkWebServer(id);
      const { hasWebServer, serverType } = response.data;

      enqueueSnackbar(
        hasWebServer
          ? `Web server detected: ${serverType}`
          : 'No web server detected',
        { variant: hasWebServer ? 'success' : 'warning' }
      );

      fetchSubdomains();
    } catch (error) {
      console.error('Error checking web server:', error);
      enqueueSnackbar('Failed to check web server status', { variant: 'error' });
    }
  };

  const handleIssueCertificate = async (id) => {
    try {
      await subdomainApi.issueCertificate(id);
      enqueueSnackbar('SSL certificate issuance started', { variant: 'info' });
      fetchSubdomains();
    } catch (error) {
      console.error('Error issuing SSL certificate:', error);
      enqueueSnackbar('Failed to issue SSL certificate', { variant: 'error' });
    }
  };

  const getSslStatusChip = (status) => {
    switch (status) {
      case 'valid':
        return <Chip icon={<CheckIcon />} label="Valid" color="success" size="small" />;
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" />;
      case 'error':
        return <Chip icon={<ErrorIcon />} label="Error" color="error" size="small" />;
      default:
        return <Chip label="None" size="small" />;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Subdomains</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSubdomains}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            component={RouterLink}
            to="/subdomains/create"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Subdomain
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Web Server</TableCell>
              <TableCell>SSL Status</TableCell>
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
            ) : subdomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No subdomains found
                </TableCell>
              </TableRow>
            ) : (
              subdomains.map((subdomain) => (
                <TableRow key={subdomain._id}>
                  <TableCell>{subdomain.name}</TableCell>
                  <TableCell>{subdomain.ipAddress}</TableCell>
                  <TableCell>
                    {subdomain.hasWebServer ? (
                      <Chip
                        label={subdomain.webServerType || 'Detected'}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip label="None" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{getSslStatusChip(subdomain.sslStatus)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        component={RouterLink}
                        to={`/subdomains/${subdomain._id}`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Check Web Server">
                      <IconButton
                        size="small"
                        onClick={() => handleCheckWebServer(subdomain._id)}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Issue SSL Certificate">
                      <IconButton
                        size="small"
                        onClick={() => handleIssueCertificate(subdomain._id)}
                        disabled={!subdomain.hasWebServer}
                      >
                        <HttpsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(subdomain._id)}
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

export default SubdomainList; 