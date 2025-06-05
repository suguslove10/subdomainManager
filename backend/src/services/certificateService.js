const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');

const Subdomain = require('../models/Subdomain');

// Convert exec to promise-based
const execPromise = util.promisify(exec);

/**
 * Service for managing SSL certificates using Let's Encrypt
 */
class CertificateService {
  constructor() {
    this.certsDir = '/etc/letsencrypt';
    this.webRootPath = '/var/www/html';
    
    // Ensure web root exists
    if (!fs.existsSync(this.webRootPath)) {
      fs.mkdirSync(this.webRootPath, { recursive: true });
    }
  }

  /**
   * Issue a new certificate for a subdomain
   * @param {string} subdomain - Full subdomain (e.g. blog.example.com)
   * @returns {Promise<boolean>} Success status
   */
  async issueCertificate(subdomain) {
    try {
      // Update subdomain status to pending
      await Subdomain.findOneAndUpdate(
        { name: subdomain },
        { sslStatus: 'pending' }
      );

      // Run certbot to issue certificate
      const command = `certbot certonly --webroot -w ${this.webRootPath} -d ${subdomain} --non-interactive --agree-tos --email admin@${subdomain.split('.').slice(-2).join('.')}`;
      
      console.log(`Running certbot command: ${command}`);
      const { stdout, stderr } = await execPromise(command);
      console.log(`Certbot stdout: ${stdout}`);
      
      if (stderr && !stderr.includes('Congratulations!')) {
        console.error(`Certbot stderr: ${stderr}`);
      }
      
      // Check if certificate was issued successfully
      const certPath = path.join(this.certsDir, 'live', subdomain, 'fullchain.pem');
      const keyPath = path.join(this.certsDir, 'live', subdomain, 'privkey.pem');
      
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        // Get certificate expiry date
        const { stdout: certInfo } = await execPromise(`openssl x509 -in ${certPath} -noout -enddate`);
        const expiryDate = this.parseExpiryDate(certInfo);
        
        // Update subdomain with certificate status
        await Subdomain.findOneAndUpdate(
          { name: subdomain },
          { 
            sslStatus: 'valid', 
            sslExpiryDate: expiryDate 
          }
        );
        
        // Configure Nginx for this domain with SSL
        await this.configureNginx(subdomain, certPath, keyPath);
        
        return true;
      } else {
        // Update subdomain with error status
        await Subdomain.findOneAndUpdate(
          { name: subdomain },
          { sslStatus: 'error' }
        );
        
        return false;
      }
    } catch (error) {
      console.error(`Error issuing certificate for ${subdomain}:`, error);
      
      // Update subdomain with error status
      await Subdomain.findOneAndUpdate(
        { name: subdomain },
        { sslStatus: 'error' }
      );
      
      return false;
    }
  }

  /**
   * Renew all certificates that are nearing expiration
   * @returns {Promise<{renewed: number, failed: number}>}
   */
  async renewAllCertificates() {
    try {
      // Get all subdomains with valid certificates
      const subdomains = await Subdomain.find({ sslStatus: 'valid' });
      let renewed = 0, failed = 0;
      
      // Renew each certificate
      for (const subdomain of subdomains) {
        try {
          // Only renew if certificate expires in less than 30 days
          if (subdomain.sslExpiryDate && new Date(subdomain.sslExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
            const command = `certbot renew --cert-name ${subdomain.name} --non-interactive`;
            
            console.log(`Running certbot renew command: ${command}`);
            const { stdout, stderr } = await execPromise(command);
            console.log(`Certbot renew stdout: ${stdout}`);
            
            if (stderr && !stderr.includes('Congratulations!')) {
              console.error(`Certbot renew stderr: ${stderr}`);
            }
            
            // Check if renewal was successful
            const certPath = path.join(this.certsDir, 'live', subdomain.name, 'fullchain.pem');
            
            if (fs.existsSync(certPath)) {
              // Get new expiry date
              const { stdout: certInfo } = await execPromise(`openssl x509 -in ${certPath} -noout -enddate`);
              const expiryDate = this.parseExpiryDate(certInfo);
              
              // Update subdomain with new expiry date
              await Subdomain.findByIdAndUpdate(
                subdomain._id,
                { sslExpiryDate: expiryDate }
              );
              
              renewed++;
            } else {
              failed++;
              
              // Update subdomain with error status
              await Subdomain.findByIdAndUpdate(
                subdomain._id,
                { sslStatus: 'error' }
              );
            }
          }
        } catch (error) {
          console.error(`Error renewing certificate for ${subdomain.name}:`, error);
          failed++;
          
          // Update subdomain with error status
          await Subdomain.findByIdAndUpdate(
            subdomain._id,
            { sslStatus: 'error' }
          );
        }
      }
      
      return { renewed, failed };
    } catch (error) {
      console.error('Error renewing certificates:', error);
      throw error;
    }
  }

  /**
   * Configure Nginx for a subdomain with SSL
   * @param {string} subdomain - Full subdomain (e.g. blog.example.com)
   * @param {string} certPath - Path to the SSL certificate
   * @param {string} keyPath - Path to the SSL private key
   * @returns {Promise<boolean>} Success status
   */
  async configureNginx(subdomain, certPath, keyPath) {
    try {
      const nginxConfDir = '/etc/nginx/conf.d';
      const configPath = path.join(nginxConfDir, `${subdomain}.conf`);
      
      // Create Nginx configuration
      const config = `
server {
    listen 80;
    server_name ${subdomain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${subdomain};
    
    ssl_certificate ${certPath};
    ssl_certificate_key ${keyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Proxy to the actual web server
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
      
      // Write configuration file
      fs.writeFileSync(configPath, config);
      
      // Reload Nginx
      await execPromise('nginx -t && nginx -s reload');
      
      return true;
    } catch (error) {
      console.error(`Error configuring Nginx for ${subdomain}:`, error);
      return false;
    }
  }

  /**
   * Parse the expiry date from OpenSSL output
   * @param {string} certInfo - OpenSSL output containing expiry date
   * @returns {Date} Parsed expiry date
   */
  parseExpiryDate(certInfo) {
    // Example format: notAfter=Jun 15 12:30:45 2023 GMT
    const match = certInfo.match(/notAfter=(.+)/);
    
    if (match && match[1]) {
      return new Date(match[1]);
    }
    
    return null;
  }
}

module.exports = new CertificateService(); 