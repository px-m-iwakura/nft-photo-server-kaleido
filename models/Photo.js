const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  instagram_photo_url: {
    type: String,
    maxlength: 500
  },
  blockchain_account_address: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  likes: {
    type: Number,
    default: 0
  },
  upload_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  token_id: {
    type: String,
    maxlength: 255
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Photo', photoSchema);
