const awsService = require('../services/awsService');

/**
 * Controller for AWS credential operations
 */
class AwsCredentialController {
  /**
   * Get all AWS credentials
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllCredentials(req, res) {
    try {
      const credentials = await awsService.getAllCredentials();
      res.status(200).json(credentials);
    } catch (error) {
      console.error('Error fetching AWS credentials:', error);
      res.status(500).json({ error: 'Failed to fetch AWS credentials' });
    }
  }

  /**
   * Get a specific AWS credential by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getCredentialById(req, res) {
    try {
      const credential = await awsService.getCredential(req.params.id);
      
      if (!credential) {
        return res.status(404).json({ error: 'AWS credential not found' });
      }
      
      // Don't send the secret access key to the client
      const { secretAccessKey, ...safeCredential } = credential.toObject();
      
      res.status(200).json(safeCredential);
    } catch (error) {
      console.error(`Error fetching AWS credential ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch AWS credential' });
    }
  }

  /**
   * Create a new AWS credential
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createCredential(req, res) {
    try {
      const { name, accessKeyId, secretAccessKey, region } = req.body;
      
      if (!name || !accessKeyId || !secretAccessKey) {
        return res.status(400).json({ 
          error: 'Name, access key ID, and secret access key are required' 
        });
      }
      
      // Create new credential
      const newCredential = await awsService.createCredential({
        name,
        accessKeyId,
        secretAccessKey,
        region: region || 'us-east-1'
      });
      
      // Don't send the secret access key to the client
      const { secretAccessKey: secret, ...safeCredential } = newCredential.toObject();
      
      res.status(201).json(safeCredential);
    } catch (error) {
      console.error('Error creating AWS credential:', error);
      
      if (error.message === 'Invalid AWS credentials') {
        return res.status(400).json({ error: 'Invalid AWS credentials' });
      }
      
      res.status(500).json({ error: 'Failed to create AWS credential' });
    }
  }

  /**
   * Update an AWS credential
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateCredential(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedCredential = await awsService.updateCredential(id, updateData);
      
      if (!updatedCredential) {
        return res.status(404).json({ error: 'AWS credential not found' });
      }
      
      // Don't send the secret access key to the client
      const { secretAccessKey, ...safeCredential } = updatedCredential.toObject();
      
      res.status(200).json(safeCredential);
    } catch (error) {
      console.error(`Error updating AWS credential ${req.params.id}:`, error);
      
      if (error.message === 'Invalid AWS credentials') {
        return res.status(400).json({ error: 'Invalid AWS credentials' });
      }
      
      res.status(500).json({ error: 'Failed to update AWS credential' });
    }
  }

  /**
   * Delete an AWS credential
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteCredential(req, res) {
    try {
      const { id } = req.params;
      const deleted = await awsService.deleteCredential(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'AWS credential not found' });
      }
      
      res.status(200).json({ message: 'AWS credential deleted successfully' });
    } catch (error) {
      console.error(`Error deleting AWS credential ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete AWS credential' });
    }
  }

  /**
   * Validate AWS credentials
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async validateCredential(req, res) {
    try {
      const { accessKeyId, secretAccessKey, region } = req.body;
      
      if (!accessKeyId || !secretAccessKey) {
        return res.status(400).json({ 
          error: 'Access key ID and secret access key are required' 
        });
      }
      
      const isValid = await awsService.validateAwsCredentials(
        accessKeyId,
        secretAccessKey,
        region || 'us-east-1'
      );
      
      res.status(200).json({ valid: isValid });
    } catch (error) {
      console.error('Error validating AWS credentials:', error);
      res.status(500).json({ error: 'Failed to validate AWS credentials' });
    }
  }
}

module.exports = new AwsCredentialController(); 