const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const awsCredentialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accessKeyId: {
    type: String,
    required: true,
    trim: true
  },
  secretAccessKey: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true,
    default: 'us-east-1'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Encrypt the AWS secret access key before saving
awsCredentialSchema.pre('save', async function(next) {
  // Only hash the secret if it's modified (or new)
  if (!this.isModified('secretAccessKey')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.secretAccessKey = await bcrypt.hash(this.secretAccessKey, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare encrypted secrets
awsCredentialSchema.methods.compareSecret = async function(candidateSecret) {
  return await bcrypt.compare(candidateSecret, this.secretAccessKey);
};

const AwsCredential = mongoose.model('AwsCredential', awsCredentialSchema);

module.exports = AwsCredential; 