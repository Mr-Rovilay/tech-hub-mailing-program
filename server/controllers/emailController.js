import Contact from "../models/Contact.js"
import emailService from "../services/emailService.js"

export const sendBulkEmail = async (req, res) => {
  try {
    const { templateId, tags, customVariables } = req.body

    // Validate required fields
    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" })
    }

    // Build query based on tags
    const query = { isActive: true }
    if (tags && tags.length > 0) {
      query.tags = { $in: tags }
    }

    // Get contacts
    const contacts = await Contact.find(query)

    if (contacts.length === 0) {
      return res.status(404).json({ error: "No contacts found matching the criteria" })
    }

    // Send emails
    const results = await emailService.sendBulkEmail(contacts, templateId, customVariables)

    // Update lastEmailSent for successful sends
    await Contact.updateMany({ email: { $in: results.successful } }, { $set: { lastEmailSent: new Date() } })

    res.json({
      message: "Bulk email process completed",
      results,
    })
  } catch (error) {
    console.error("Error in sendBulkEmail:", error)
    res.status(500).json({ error: error.message })
  }
}

export const sendSingleEmail = async (req, res) => {
  try {
    const { templateId, email, customVariables } = req.body

    // Validate required fields
    if (!templateId || !email) {
      return res.status(400).json({ error: "Template ID and email are required" })
    }
    // Get contact (or create a temporary one if not found)
    let contact = await Contact.findOne({ email })
    if (!contact) {
      contact = { email } // Temporary contact object
    }
    // Send email
    const result = await emailService.sendSingleEmail(contact, templateId, customVariables)

    if (result.success) {
      // Update lastEmailSent for successful send if it's an existing contact
      if (contact._id) {
        await Contact.updateOne({ email }, { $set: { lastEmailSent: new Date() } })
      }
      res.json({ message: "Email sent successfully", messageId: result.messageId })
    } else {
      console.error("Failed to send email:", result.error)
      res.status(500).json({ error: "Failed to send email", details: result.error })
    }
  } catch (error) {
    console.error("Error in sendSingleEmail:", error)
    res.status(500).json({ error: error.message })
  }
}

