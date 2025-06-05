import axios from 'axios';

// Create an axios instance with common configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Subdomain API endpoints
export const subdomainApi = {
  // Get all subdomains
  getAll: () => api.get('/subdomains'),
  
  // Get a specific subdomain by ID
  getById: (id) => api.get(`/subdomains/${id}`),
  
  // Create a new subdomain
  create: (data) => api.post('/subdomains', data),
  
  // Update a subdomain
  update: (id, data) => api.put(`/subdomains/${id}`, data),
  
  // Delete a subdomain
  delete: (id) => api.delete(`/subdomains/${id}`),
  
  // Check web server status for a subdomain
  checkWebServer: (id) => api.post(`/subdomains/${id}/check-webserver`),
  
  // Issue SSL certificate for a subdomain
  issueCertificate: (id) => api.post(`/subdomains/${id}/issue-certificate`),
};

// AWS Credential API endpoints
export const awsCredentialApi = {
  // Get all AWS credentials
  getAll: () => api.get('/aws-credentials'),
  
  // Get a specific AWS credential by ID
  getById: (id) => api.get(`/aws-credentials/${id}`),
  
  // Create a new AWS credential
  create: (data) => api.post('/aws-credentials', data),
  
  // Update an AWS credential
  update: (id, data) => api.put(`/aws-credentials/${id}`, data),
  
  // Delete an AWS credential
  delete: (id) => api.delete(`/aws-credentials/${id}`),
  
  // Validate AWS credentials
  validate: (data) => api.post('/aws-credentials/validate', data),
};

// Auth API endpoints (placeholders)
export const authApi = {
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Logout
  logout: () => api.post('/auth/logout'),
};

export default api; 