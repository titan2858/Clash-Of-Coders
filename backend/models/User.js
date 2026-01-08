const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
  username: 
  { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  email: 
  { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: 
  { 
    type: String, 
    required: true 
  },
  age: { type: Number },
  college: { type: String },
  address: { type: String },
  bio: { type: String, default: "Coding enthusiast ready to battle!" },
  rank: { type: String, default: "Novice" }, 
  wins: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);