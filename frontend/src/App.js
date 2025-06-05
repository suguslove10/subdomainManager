import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Pages
import Dashboard from './pages/Dashboard';
import SubdomainList from './pages/SubdomainList';
import SubdomainCreate from './pages/SubdomainCreate';
import SubdomainDetail from './pages/SubdomainDetail';
import AwsCredentialList from './pages/AwsCredentialList';
import AwsCredentialCreate from './pages/AwsCredentialCreate';
import AwsCredentialDetail from './pages/AwsCredentialDetail';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="subdomains">
            <Route index element={<SubdomainList />} />
            <Route path="create" element={<SubdomainCreate />} />
            <Route path=":id" element={<SubdomainDetail />} />
          </Route>
          <Route path="aws-credentials">
            <Route index element={<AwsCredentialList />} />
            <Route path="create" element={<AwsCredentialCreate />} />
            <Route path=":id" element={<AwsCredentialDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App; 