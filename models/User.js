const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  blockchain_account_address: {
    type: String,
    required: true,
    unique: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  nickname: {
    type: String,
    maxlength: 50
  },
  token_id: {
    type: String,
    maxlength: 255
  }
});

module.exports = mongoose.model('User', userSchema);
