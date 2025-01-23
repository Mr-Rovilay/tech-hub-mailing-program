import EmailCampaign from '../models/EmailCampaign.js';
import Contact from '../models/Contact.js';
import emailService from '../services/emailService.js';

export const createCampaign = async (req, res) => {
  try {
    const { name, template, recipients, scheduledDate } = req.body;

    // Validate recipients
    const validRecipients = await Contact.find({ _id: { $in: recipients } });
    if (validRecipients.length !== recipients.length) {
      return res.status(400).json({ error: 'Invalid recipients provided' });
    }

    const campaign = await EmailCampaign.create({
      name,
      template,
      recipients,
      scheduledDate,
      status: scheduledDate && new Date(scheduledDate) > new Date() ? 'scheduled' : 'draft'
    });

    if (campaign.status === 'scheduled') {
      scheduleCampaign(campaign._id, scheduledDate);
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const campaigns = await EmailCampaign.find(query)
      .populate('template', 'name subject')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await EmailCampaign.countDocuments(query);

    res.json({
      campaigns,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('template')
      .populate('recipients');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { name, templateId, recipientTags, scheduledDate } = req.body;
    
    // Only allow updates if campaign is in draft status
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Can only update draft campaigns' });
    }

    // Update recipients if tags provided
    let recipients = campaign.recipients;
    if (recipientTags) {
      const newRecipients = await Contact.find({
        tags: { $in: recipientTags },
        isActive: true
      }).select('_id');
      recipients = newRecipients.map(r => r._id);
    }

    const updatedCampaign = await EmailCampaign.findByIdAndUpdate(
      req.params.id,
      {
        name: name || campaign.name,
        template: templateId || campaign.template,
        recipients,
        scheduledDate: scheduledDate || campaign.scheduledDate,
        status: scheduledDate && new Date(scheduledDate) > new Date() ? 'scheduled' : 'draft'
      },
      { new: true }
    );

    if (updatedCampaign.status === 'scheduled') {
      scheduleCampaign(updatedCampaign._id, updatedCampaign.scheduledDate);
    }

    res.json(updatedCampaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft campaigns' });
    }

    // Use deleteOne instead of remove
    await EmailCampaign.deleteOne({ _id: req.params.id });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const executeCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id).populate("template").populate("recipients")

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" })
    }

    if (!campaign.template) {
      return res.status(400).json({ error: "Campaign template is missing" })
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return res.status(400).json({ error: "Campaign cannot be executed" })
    }

    // Update status to sending
    campaign.status = "sending"
    campaign.lastExecuted = new Date()
    await campaign.save()

    // Execute campaign in background
    processCampaign(campaign).catch(console.error)

    res.json({ message: "Campaign execution started" })
  } catch (error) {
    console.error("Error executing campaign:", error)
    res.status(500).json({ error: error.message })
  }
}

// Helper function to process campaign
async function processCampaign(campaign) {
  try {
    if (!campaign.template) {
      throw new Error("Campaign template is missing")
    }

    const results = await emailService.sendBulkEmail(campaign.recipients, campaign.template, campaign.template.content)

    // Update campaign stats
    campaign.stats.sent += results.successful.length
    campaign.stats.failed += results.failed.length
    campaign.status = "completed"
    await campaign.save()
  } catch (error) {
    console.error(`Error processing campaign ${campaign._id}:`, error)
    campaign.status = "failed"
    await campaign.save()
  }
}

// Helper function to schedule campaign
async function scheduleCampaign(campaignId, scheduledDate) {
  const scheduledTime = new Date(scheduledDate).getTime() - Date.now();
  setTimeout(async () => {
    try {
      const campaign = await EmailCampaign.findById(campaignId)
        .populate('template')
        .populate('recipients');
      
      if (campaign && campaign.status === 'scheduled') {
        await processCampaign(campaign);
      }
    } catch (error) {
      console.error('Error executing scheduled campaign:', error);
    }
  }, scheduledTime);
}