import EmailCampaign from '../models/EmailCampaign.js';
import Contact from '../models/Contact.js';
import emailService from '../services/emailService.js';

export const createCampaign = async (req, res) => {
  try {
    const { name, template, contacts, scheduledDate } = req.body;

    // Validate contacts
    const validRecipients = await Contact.find({ _id: { $in: contacts } });
    if (validRecipients.length !== contacts.length) {
      return res.status(400).json({ error: 'Invalid contacts provided' });
    }

    const campaign = await EmailCampaign.create({
      name,
      template,
      contacts,
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
    const { status, include, search } = req.query

    const query = {}
    if (status) {
      query.status = status
    }
    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    let campaignsQuery = EmailCampaign.find(query).sort({ createdAt: -1 })

    if (include === "contacts") {
      campaignsQuery = campaignsQuery.populate("contacts")
    }
    const campaigns = await campaignsQuery

    res.json({ campaigns })
  } catch (error) {
    console.error("Error in getCampaigns:", error)
    res.status(500).json({ error: error.message })
  }
}

export const getCampaignById = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('template')
      .populate('contacts');

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
    const { name, templateId, contactTags, scheduledDate } = req.body;
    
    // Only allow updates if campaign is in draft status
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Can only update draft campaigns' });
    }

    // Update contacts if tags provided
    let contacts = campaign.contacts;
    if (contactTags) {
      const newRecipients = await Contact.find({
        tags: { $in: contactTags },
        isActive: true
      }).select('_id');
      contacts = newRecipients.map(r => r._id);
    }

    const updatedCampaign = await EmailCampaign.findByIdAndUpdate(
      req.params.id,
      {
        name: name || campaign.name,
        template: templateId || campaign.template,
        contacts,
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
    const campaign = await EmailCampaign.findById(req.params.id).populate("template").populate("contacts")

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

    const results = await emailService.sendBulkEmail(campaign.contacts, campaign.template, campaign.template.content)

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
        .populate('contacts');
      
      if (campaign && campaign.status === 'scheduled') {
        await processCampaign(campaign);
      }
    } catch (error) {
      console.error('Error executing scheduled campaign:', error);
    }
  }, scheduledTime);
}