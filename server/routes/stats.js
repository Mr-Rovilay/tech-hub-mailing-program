import express from "express";
import Contact from "../models/Contact.js";
import EmailTemplate from "../models/EmailTemplate.js";
import EmailCampaign from "../models/EmailCampaign.js";


const router = express.Router();

// Get total stats
router.get("/", async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const totalTemplates = await EmailTemplate.countDocuments();
    const totalEmailsSent = await EmailCampaign.countDocuments(); // Change based on your schema

    res.json({
      totalContacts,
      totalTemplates,
      totalEmailsSent,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
