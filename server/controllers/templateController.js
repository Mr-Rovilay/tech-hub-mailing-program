import EmailTemplate from '../models/EmailTemplate.js';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Configure marked for safe HTML conversion
marked.setOptions({
  headerIds: false,
  mangle: false
});

// Configure sanitize-html options
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
  ],
  allowedAttributes: {
    'a': ['href', 'name', 'target'],
    'img': ['src', 'alt', 'title'],
    '*': ['style']
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/]
    }
  }
};

// Process template content
const processTemplateContent = (content) => {
  // Convert markdown to HTML
  const htmlContent = marked(content);
  
  // Sanitize HTML
  const sanitizedContent = sanitizeHtml(htmlContent, sanitizeOptions);
  
  return sanitizedContent;
};

// Process variables in text
const processVariables = (text, variables = {}) => {
  let processedText = text;
  
  // Replace all variables with their values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}|{{${key}}}`, 'g');
    processedText = processedText.replace(regex, value || '');
  });
  
  return processedText;
};

// Prepare email for sending
const prepareEmailContent = (template, variables) => {
  // Process subject variables
  const processedSubject = processVariables(template.subject, variables);
  
  // Process content variables and convert markdown
  let processedContent = processVariables(template.rawContent || template.content, variables);
  processedContent = processTemplateContent(processedContent);
  
  return {
    subject: processedSubject,
    content: processedContent
  };
};

export const createTemplate = async (req, res) => {
  try {
    const { name, subject, content, variables, category } = req.body;

    // Store both raw and processed content
    const processedContent = processTemplateContent(content);

    const template = new EmailTemplate({
      name,
      subject,
      content: processedContent,
      rawContent: content,
      variables,
      category
    });

    await template.save();
    res.status(201).json(template);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Template name must be unique' });
    } else {
      console.error('Template creation error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

export const getTemplates = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const templates = await EmailTemplate.find(query)
      .select('name subject category variables createdAt updatedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await EmailTemplate.countDocuments(query);

    res.json({
      templates,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({
      ...template.toObject(),
      content: template.rawContent || template.content
    });
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { name, subject, content, variables, category } = req.body;
    
    // Process the content to convert markdown and sanitize HTML
    const processedContent = processTemplateContent(content);

    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        subject,
        content: processedContent,
        rawContent: content,
        variables,
        category
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Template name must be unique' });
    } else {
      console.error('Template update error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template deletion error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Preview template with variables
export const previewTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { subject, content } = prepareEmailContent(template, variables);

    res.json({ subject, content });
  } catch (error) {
    console.error('Template preview error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export the helper functions for use in other services
export const emailHelpers = {
  processVariables,
  processTemplateContent,
  prepareEmailContent
};