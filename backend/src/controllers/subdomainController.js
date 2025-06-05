const Subdomain = require('../models/Subdomain');
const ipDetectionService = require('../services/ipDetectionService');
const certificateService = require('../services/certificateService');
const awsService = require('../services/awsService');

/**
 * Controller for subdomain-related operations
 */
class SubdomainController {
  /**
   * Get all subdomains
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllSubdomains(req, res) {
    try {
      const subdomains = await Subdomain.find();
      res.status(200).json(subdomains);
    } catch (error) {
      console.error('Error fetching subdomains:', error);
      res.status(500).json({ error: 'Failed to fetch subdomains' });
    }
  }

  /**
   * Get a specific subdomain by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getSubdomainById(req, res) {
    try {
      const subdomain = await Subdomain.findById(req.params.id);
      
      if (!subdomain) {
        return res.status(404).json({ error: 'Subdomain not found' });
      }
      
      res.status(200).json(subdomain);
    } catch (error) {
      console.error(`Error fetching subdomain ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch subdomain' });
    }
  }

  /**
   * Create a new subdomain
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createSubdomain(req, res) {
    try {
      const { name, domain, awsCredentialId } = req.body;
      
      if (!name || !domain) {
        return res.status(400).json({ error: 'Subdomain name and domain are required' });
      }
      
      // Generate full subdomain
      const fullSubdomain = name.includes(domain) ? name : `${name}.${domain}`;
      
      // Check if subdomain already exists
      const existingSubdomain = await Subdomain.findOne({ name: fullSubdomain });
      
      if (existingSubdomain) {
        return res.status(400).json({ error: 'Subdomain already exists' });
      }
      
      // Detect server's public IP
      const ipAddress = await ipDetectionService.getPublicIp();
      
      // Create new subdomain record
      const newSubdomain = new Subdomain({
        name: fullSubdomain,
        domain,
        ipAddress
      });
      
      await newSubdomain.save();
      
      // If AWS credential is provided, update Route53
      if (awsCredentialId) {
        console.log(`Attempting to update Route53 record for ${fullSubdomain} with credential ID ${awsCredentialId} and IP ${ipAddress}`);
        
        try {
          // Try to create or update Route53 record up to 3 times
          let route53Updated = false;
          let attemptCount = 0;
          const maxAttempts = 3;
          
          while (!route53Updated && attemptCount < maxAttempts) {
            attemptCount++;
            console.log(`Route53 update attempt ${attemptCount} of ${maxAttempts} for ${fullSubdomain}`);
            
            route53Updated = await awsService.updateRoute53Record(
              awsCredentialId,
              domain,
              name,
              ipAddress
            );
            
            if (route53Updated) {
              console.log(`Successfully updated Route53 record for ${fullSubdomain} on attempt ${attemptCount}`);
              break;
            } else {
              console.warn(`Failed to update Route53 record for ${fullSubdomain} on attempt ${attemptCount}`);
              // Wait before retrying
              if (attemptCount < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
          
          // Update the subdomain with Route53 status
          newSubdomain.dnsConfigured = route53Updated;
          await newSubdomain.save();
          
          if (!route53Updated) {
            console.error(`All attempts to update Route53 record for ${fullSubdomain} failed`);
          }
        } catch (error) {
          console.error(`AWS Route53 error for ${fullSubdomain}:`, error.message);
          // Continue with subdomain creation even if Route53 update fails
        }
      }
      
      // Check if web server is running
      const webServerCheck = await ipDetectionService.checkWebServer(fullSubdomain);
      
      // Update the subdomain with web server info
      newSubdomain.hasWebServer = webServerCheck.hasWebServer;
      newSubdomain.webServerType = webServerCheck.serverType;
      await newSubdomain.save();
      
      // If web server is detected, issue SSL certificate
      if (webServerCheck.hasWebServer) {
        // Issue certificate asynchronously
        certificateService.issueCertificate(fullSubdomain)
          .then(success => {
            console.log(`Certificate issuance for ${fullSubdomain}: ${success ? 'Success' : 'Failed'}`);
          })
          .catch(err => {
            console.error(`Error issuing certificate for ${fullSubdomain}:`, err);
          });
      }
      
      res.status(201).json(newSubdomain);
    } catch (error) {
      console.error('Error creating subdomain:', error);
      res.status(500).json({ error: 'Failed to create subdomain' });
    }
  }

  /**
   * Update a subdomain
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateSubdomain(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Don't allow changing the name or domain
      delete updateData.name;
      delete updateData.domain;
      
      const updatedSubdomain = await Subdomain.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      
      if (!updatedSubdomain) {
        return res.status(404).json({ error: 'Subdomain not found' });
      }
      
      res.status(200).json(updatedSubdomain);
    } catch (error) {
      console.error(`Error updating subdomain ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update subdomain' });
    }
  }

  /**
   * Delete a subdomain
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteSubdomain(req, res) {
    try {
      const { id } = req.params;
      const subdomain = await Subdomain.findById(id);
      
      if (!subdomain) {
        return res.status(404).json({ error: 'Subdomain not found' });
      }
      
      // Delete the subdomain
      await Subdomain.findByIdAndDelete(id);
      
      res.status(200).json({ message: 'Subdomain deleted successfully' });
    } catch (error) {
      console.error(`Error deleting subdomain ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete subdomain' });
    }
  }

  /**
   * Check web server status for a subdomain
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkWebServer(req, res) {
    try {
      const { id } = req.params;
      const subdomain = await Subdomain.findById(id);
      
      if (!subdomain) {
        return res.status(404).json({ error: 'Subdomain not found' });
      }
      
      // Check web server status
      const webServerCheck = await ipDetectionService.checkWebServer(subdomain.name);
      
      // Update the subdomain with web server info
      subdomain.hasWebServer = webServerCheck.hasWebServer;
      subdomain.webServerType = webServerCheck.serverType;
      await subdomain.save();
      
      res.status(200).json({
        hasWebServer: webServerCheck.hasWebServer,
        serverType: webServerCheck.serverType
      });
    } catch (error) {
      console.error(`Error checking web server for subdomain ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to check web server status' });
    }
  }

  /**
   * Issue SSL certificate for a subdomain
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async issueSSLCertificate(req, res) {
    try {
      const { id } = req.params;
      const subdomain = await Subdomain.findById(id);
      
      if (!subdomain) {
        return res.status(404).json({ error: 'Subdomain not found' });
      }
      
      // Check if web server is running
      if (!subdomain.hasWebServer) {
        // Check again to be sure
        const webServerCheck = await ipDetectionService.checkWebServer(subdomain.name);
        
        if (!webServerCheck.hasWebServer) {
          return res.status(400).json({ 
            error: 'Cannot issue SSL certificate: No web server detected for this subdomain' 
          });
        }
        
        // Update the subdomain with web server info
        subdomain.hasWebServer = true;
        subdomain.webServerType = webServerCheck.serverType;
        await subdomain.save();
      }
      
      // Start certificate issuance process
      res.status(202).json({ 
        message: 'SSL certificate issuance started',
        status: 'pending'
      });
      
      // Issue certificate asynchronously
      const success = await certificateService.issueCertificate(subdomain.name);
      console.log(`Certificate issuance for ${subdomain.name}: ${success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error(`Error issuing SSL certificate for subdomain ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to issue SSL certificate' });
    }
  }

  /**
   * Check web server status for all subdomains
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkAllWebServers(req, res) {
    try {
      console.log('Checking web server status for all subdomains...');
      const subdomains = await Subdomain.find();
      const results = {};
      
      // Check each subdomain
      for (const subdomain of subdomains) {
        console.log(`Checking web server for ${subdomain.name}...`);
        
        // Check web server status
        const webServerCheck = await ipDetectionService.checkWebServer(subdomain.name);
        console.log(`Web server check result for ${subdomain.name}:`, webServerCheck);
        
        // Update the subdomain with web server info
        subdomain.hasWebServer = webServerCheck.hasWebServer;
        subdomain.webServerType = webServerCheck.serverType;
        await subdomain.save();
        
        // Add to results
        results[subdomain.name] = {
          hasWebServer: webServerCheck.hasWebServer,
          serverType: webServerCheck.serverType
        };
      }
      
      res.status(200).json({
        message: 'Web server check completed for all subdomains',
        results
      });
    } catch (error) {
      console.error('Error checking web servers for all subdomains:', error);
      res.status(500).json({ error: 'Failed to check web server status' });
    }
  }
}

module.exports = new SubdomainController(); 