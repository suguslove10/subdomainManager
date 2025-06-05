const AWS = require('aws-sdk');
const AwsCredential = require('../models/AwsCredential');
const crypto = require('crypto');

/**
 * Service for handling AWS API interactions
 */
class AwsService {
  /**
   * Get AWS credentials by ID
   * @param {string} credentialId - AWS credential ID
   * @returns {Promise<AwsCredential>} AWS credential document
   */
  async getCredential(credentialId) {
    try {
      return await AwsCredential.findById(credentialId);
    } catch (error) {
      console.error('Error retrieving AWS credential:', error);
      throw error;
    }
  }

  /**
   * Get all AWS credentials
   * @returns {Promise<Array<AwsCredential>>} Array of AWS credential documents
   */
  async getAllCredentials() {
    try {
      return await AwsCredential.find().select('-secretAccessKey');
    } catch (error) {
      console.error('Error retrieving AWS credentials:', error);
      throw error;
    }
  }

  /**
   * Create new AWS credential
   * @param {Object} credentialData - AWS credential data
   * @returns {Promise<AwsCredential>} Created AWS credential document
   */
  async createCredential(credentialData) {
    try {
      // Validate credentials before saving
      const isValid = await this.validateAwsCredentials(
        credentialData.accessKeyId, 
        credentialData.secretAccessKey,
        credentialData.region
      );
      
      if (!isValid) {
        throw new Error('Invalid AWS credentials');
      }
      
      const newCredential = new AwsCredential(credentialData);
      return await newCredential.save();
    } catch (error) {
      console.error('Error creating AWS credential:', error);
      throw error;
    }
  }

  /**
   * Update AWS credential
   * @param {string} credentialId - AWS credential ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<AwsCredential>} Updated AWS credential document
   */
  async updateCredential(credentialId, updateData) {
    try {
      // If updating access keys, validate them first
      if (updateData.accessKeyId && updateData.secretAccessKey) {
        const isValid = await this.validateAwsCredentials(
          updateData.accessKeyId, 
          updateData.secretAccessKey,
          updateData.region || 'us-east-1'
        );
        
        if (!isValid) {
          throw new Error('Invalid AWS credentials');
        }
      }
      
      return await AwsCredential.findByIdAndUpdate(
        credentialId,
        updateData,
        { new: true }
      );
    } catch (error) {
      console.error(`Error updating AWS credential ${credentialId}:`, error);
      throw error;
    }
  }

  /**
   * Delete AWS credential
   * @param {string} credentialId - AWS credential ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCredential(credentialId) {
    try {
      const result = await AwsCredential.findByIdAndDelete(credentialId);
      return !!result;
    } catch (error) {
      console.error(`Error deleting AWS credential ${credentialId}:`, error);
      throw error;
    }
  }

  /**
   * Validate AWS credentials by attempting to use them
   * @param {string} accessKeyId - AWS access key ID
   * @param {string} secretAccessKey - AWS secret access key
   * @param {string} region - AWS region
   * @returns {Promise<boolean>} Whether credentials are valid
   */
  async validateAwsCredentials(accessKeyId, secretAccessKey, region = 'us-east-1') {
    try {
      // Configure AWS with the provided credentials
      AWS.config.update({
        accessKeyId,
        secretAccessKey,
        region
      });
      
      // Try to list S3 buckets as a simple validation
      const s3 = new AWS.S3();
      await s3.listBuckets().promise();
      
      return true;
    } catch (error) {
      console.error('AWS credential validation failed:', error);
      return false;
    }
  }

  /**
   * Use AWS Route 53 to update DNS records for a subdomain
   * @param {string} credentialId - AWS credential ID
   * @param {string} domain - Root domain
   * @param {string} subdomain - Subdomain name
   * @param {string} ipAddress - IP address to point to
   * @returns {Promise<boolean>} Success status
   */
  async updateRoute53Record(credentialId, domain, subdomain, ipAddress) {
    try {
      const credential = await this.getCredential(credentialId);
      
      if (!credential) {
        throw new Error('AWS credential not found');
      }
      
      // Configure AWS with credentials
      // Note: In production, you'd want to decrypt the secret key here
      AWS.config.update({
        accessKeyId: credential.accessKeyId,
        secretAccessKey: this.getDecryptedSecret(credential),
        region: credential.region
      });
      
      const route53 = new AWS.Route53();
      
      // Get the Hosted Zone ID for the domain
      const hostedZones = await route53.listHostedZonesByName({
        DNSName: domain
      }).promise();
      
      if (!hostedZones.HostedZones.length) {
        throw new Error(`No hosted zone found for domain ${domain}`);
      }
      
      const hostedZoneId = hostedZones.HostedZones[0].Id.replace('/hostedzone/', '');
      const recordName = subdomain.endsWith(domain) ? subdomain : `${subdomain}.${domain}`;
      
      // Update the DNS record
      const changeParams = {
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: recordName,
                ResourceRecords: [
                  {
                    Value: ipAddress
                  }
                ],
                TTL: 300,
                Type: 'A'
              }
            }
          ],
          Comment: 'Updated by Subdomain Manager'
        },
        HostedZoneId: hostedZoneId
      };
      
      await route53.changeResourceRecordSets(changeParams).promise();
      
      return true;
    } catch (error) {
      console.error(`Error updating Route53 record for ${subdomain}.${domain}:`, error);
      return false;
    }
  }

  /**
   * Get decrypted AWS secret key (placeholder for actual decryption)
   * @param {AwsCredential} credential - AWS credential document
   * @returns {string} Decrypted secret key
   */
  getDecryptedSecret(credential) {
    // In a real implementation, you would decrypt the stored secret here
    // For this demo, we're just returning the encrypted value
    // IMPORTANT: This is not secure for production use!
    return credential.secretAccessKey;
  }
}

module.exports = new AwsService(); 