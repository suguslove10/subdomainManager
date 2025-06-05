const express = require('express');
const subdomainController = require('../controllers/subdomainController');

const router = express.Router();

// GET /api/subdomains - Get all subdomains
router.get('/', subdomainController.getAllSubdomains);

// GET /api/subdomains/:id - Get a specific subdomain
router.get('/:id', subdomainController.getSubdomainById);

// POST /api/subdomains - Create a new subdomain
router.post('/', subdomainController.createSubdomain);

// PUT /api/subdomains/:id - Update a subdomain
router.put('/:id', subdomainController.updateSubdomain);

// DELETE /api/subdomains/:id - Delete a subdomain
router.delete('/:id', subdomainController.deleteSubdomain);

// POST /api/subdomains/:id/check-webserver - Check web server status
router.post('/:id/check-webserver', subdomainController.checkWebServer);

// POST /api/subdomains/:id/issue-certificate - Issue SSL certificate
router.post('/:id/issue-certificate', subdomainController.issueSSLCertificate);

// POST /api/subdomains/check-all-webservers - Check all subdomains for web servers
router.post('/check-all-webservers', subdomainController.checkAllWebServers);

module.exports = router; 