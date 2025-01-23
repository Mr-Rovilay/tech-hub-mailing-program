import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long']
  },
  subject: {
    type: String,
    required: true,
    minlength: [3, 'Subject must be at least 3 characters long']
  },
  rawContent: {
    type: String,
    required: true,
    minlength: [10, 'Content must be at least 10 characters long']
  },
  content: {
    type: String,
    required: true
  },
  variables: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true,
    enum: {
      values: ['general', 'newsletter', 'promotional', 'notification'],
      message: '{VALUE} is not a valid category'
    },
    default: 'general'
  },
  metadata: {
    hasImages: Boolean,
    hasLinks: Boolean,
    variableCount: Number
  }
}, {
  timestamps: true
});

// Pre-save middleware to update metadata
templateSchema.pre('save', function(next) {
  // Count unique variables
  this.metadata = {
    hasImages: /!\[.*?\]\(.*?\)/.test(this.rawContent), // Check for markdown images
    hasLinks: /\[.*?\]\(.*?\)/.test(this.rawContent),   // Check for markdown links
    variableCount: new Set(this.variables).size
  };
  next();
});

// Instance method to preview template with variables
templateSchema.methods.preview = function(variables = {}) {
  let preview = this.content;
  
  // Replace all variables with their values
  this.variables.forEach(variable => {
    const regex = new RegExp(`{{${variable}}}`, 'g');
    preview = preview.replace(regex, variables[variable] || `{{${variable}}}`);
  });
  
  return preview;
};

// Static method to validate variables
templateSchema.statics.validateVariables = function(variables) {
  if (!Array.isArray(variables)) {
    throw new Error('Variables must be an array');
  }
  
  const invalidVariables = variables.filter(v => !/^[a-zA-Z][a-zA-Z0-9]*$/.test(v));
  if (invalidVariables.length > 0) {
    throw new Error(`Invalid variable names: ${invalidVariables.join(', ')}`);
  }
  
  return true;
};

// Virtual for variable count
templateSchema.virtual('variableCount').get(function() {
  return this.variables.length;
});

// Ensure virtuals are included in JSON output
templateSchema.set('toJSON', { virtuals: true });
templateSchema.set('toObject', { virtuals: true });

const EmailTemplate = mongoose.model('EmailTemplate', templateSchema);

export default EmailTemplate;