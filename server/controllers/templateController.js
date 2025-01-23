// src/controllers/templateController.js
import EmailTemplate from '../models/EmailTemplate.js';

export const createTemplate = async (req, res) => {
  try {
    const { name, subject, content, variables, category } = req.body;

    const template = new EmailTemplate({
      name,
      subject,
      content,
      variables,
      category
    });

    await template.save();
    res.status(201).json(template);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Template name must be unique' });
    } else {
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
    res.status(500).json({ error: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { name, subject, content, variables, category } = req.body;
    
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { name, subject, content, variables, category },
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
    res.status(500).json({ error: error.message });
  }
};