const mongoose = require('mongoose');

const subdomainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  hasWebServer: {
    type: Boolean,
    default: false
  },
  webServerType: {
    type: String,
    enum: ['apache', 'nginx', 'nodejs', 'other', 'unknown'],
    default: 'unknown'
  },
  sslStatus: {
    type: String,
    enum: ['none', 'pending', 'valid', 'expired', 'error'],
    default: 'none'
  },
  sslExpiryDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
subdomainSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Subdomain = mongoose.model('Subdomain', subdomainSchema);

module.exports = Subdomain; 