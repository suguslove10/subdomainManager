const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const subdomainRoutes = require('./routes/subdomainRoutes');
const awsCredentialRoutes = require('./routes/awsCredentialRoutes');
const authRoutes = require('./routes/authRoutes');

// Import services
const certificateService = require('./services/certificateService');
const ipDetectionService = require('./services/ipDetectionService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subdomain-manager')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Routes
app.use('/api/subdomains', subdomainRoutes);
app.use('/api/aws-credentials', awsCredentialRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Schedule certificate renewal check
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled certificate renewal check');
  try {
    await certificateService.renewAllCertificates();
  } catch (error) {
    console.error('Certificate renewal failed:', error);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Detect and log public IP on startup
  try {
    const publicIp = await ipDetectionService.getPublicIp();
    console.log(`Server public IP: ${publicIp}`);
  } catch (error) {
    console.error('Failed to detect public IP:', error);
  }
});

module.exports = app; 