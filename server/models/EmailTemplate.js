// src/models/EmailTemplate.js
import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    // required: true
  },
  variables: [{
    type: String
  }],
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('EmailTemplate', templateSchema);