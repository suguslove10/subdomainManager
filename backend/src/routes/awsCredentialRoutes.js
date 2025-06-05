const express = require('express');
const awsCredentialController = require('../controllers/awsCredentialController');

const router = express.Router();

// GET /api/aws-credentials - Get all AWS credentials
router.get('/', awsCredentialController.getAllCredentials);

// GET /api/aws-credentials/:id - Get a specific AWS credential
router.get('/:id', awsCredentialController.getCredentialById);

// POST /api/aws-credentials - Create a new AWS credential
router.post('/', awsCredentialController.createCredential);

// PUT /api/aws-credentials/:id - Update an AWS credential
router.put('/:id', awsCredentialController.updateCredential);

// DELETE /api/aws-credentials/:id - Delete an AWS credential
router.delete('/:id', awsCredentialController.deleteCredential);

// POST /api/aws-credentials/validate - Validate AWS credentials
router.post('/validate', awsCredentialController.validateCredential);

module.exports = router; 