const https = require('https');
const http = require('http');

/**
 * Service for detecting the server's public IP address
 */
class IpDetectionService {
  /**
   * Get the public IP address of the server
   * Tries multiple methods for redundancy
   * @returns {Promise<string>} The public IP address
   */
  async getPublicIp() {
    try {
      // Try using the public-ip package with dynamic import
      // Dynamic import returns a promise that resolves to the module
      const publicIpModule = await import('public-ip');
      return await publicIpModule.publicIp.v4();
    } catch (error) {
      console.log('Failed to get IP using public-ip package, trying fallback methods...');
      
      // Try fallback methods
      try {
        return await this.getIpFromService('https://api.ipify.org');
      } catch (fallbackError) {
        try {
          return await this.getIpFromService('http://ifconfig.me');
        } catch (finalError) {
          throw new Error('Failed to detect public IP address after multiple attempts');
        }
      }
    }
  }

  /**
   * Get IP from a third-party service
   * @param {string} url - URL of the IP detection service
   * @returns {Promise<string>} The public IP address
   */
  getIpFromService(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            // Verify this looks like an IP address
            const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            const ip = data.trim();
            
            if (ipRegex.test(ip)) {
              resolve(ip);
            } else {
              reject(new Error(`Response does not appear to be an IP address: ${ip}`));
            }
          } else {
            reject(new Error(`Failed to get IP: Status code ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        reject(new Error(`Failed to get IP: ${err.message}`));
      });
    });
  }
  
  /**
   * Check if a web server is running on a specific domain/subdomain
   * @param {string} domain - Domain or subdomain to check
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<{hasWebServer: boolean, serverType: string}>}
   */
  async checkWebServer(domain, timeout = 5000) {
    const result = {
      hasWebServer: false,
      serverType: 'unknown'
    };
    
    try {
      // Try HTTPS first
      const httpsResponse = await this.makeRequest(`https://${domain}`, timeout);
      result.hasWebServer = true;
      result.serverType = this.detectServerType(httpsResponse.headers);
      return result;
    } catch (httpsError) {
      try {
        // Fall back to HTTP
        const httpResponse = await this.makeRequest(`http://${domain}`, timeout);
        result.hasWebServer = true;
        result.serverType = this.detectServerType(httpResponse.headers);
        return result;
      } catch (httpError) {
        // No web server detected
        return result;
      }
    }
  }
  
  /**
   * Make an HTTP/HTTPS request with a timeout
   * @param {string} url - URL to request
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<{statusCode: number, headers: object}>}
   */
  makeRequest(url, timeout) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        // We only need the status code and headers
        resolve({
          statusCode: res.statusCode,
          headers: res.headers
        });
        
        // Consume the response to free up memory
        res.resume();
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });
  }
  
  /**
   * Detect the type of web server based on response headers
   * @param {object} headers - HTTP response headers
   * @returns {string} The detected server type
   */
  detectServerType(headers) {
    const server = headers['server'] || '';
    
    if (server.toLowerCase().includes('nginx')) {
      return 'nginx';
    } else if (server.toLowerCase().includes('apache')) {
      return 'apache';
    } else if (headers['x-powered-by'] && headers['x-powered-by'].toLowerCase().includes('express')) {
      return 'nodejs';
    } else if (server) {
      return 'other';
    } else {
      return 'unknown';
    }
  }
}

module.exports = new IpDetectionService(); 