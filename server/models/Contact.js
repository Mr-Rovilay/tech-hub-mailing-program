// src/models/Contact.js
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastEmailSent: {
    type: Date
  }
});

// Index for efficient querying
contactSchema.index({ email: 1 },{ unique: true });
contactSchema.index({ tags: 1 });

export default mongoose.model('Contact', contactSchema);