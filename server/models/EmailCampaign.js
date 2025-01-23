// src/models/EmailCampaign.js
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: true,
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'],
    default: 'draft'
  },
  scheduledDate: {
    type: Date
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export default mongoose.model('EmailCampaign', campaignSchema);