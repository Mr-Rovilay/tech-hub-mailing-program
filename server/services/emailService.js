import nodemailer from "nodemailer"
import dotenv from "dotenv"
import Template from "../models/EmailTemplate.js"

dotenv.config()

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, // Use SSL/TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendBulkEmail(contacts, templateId, customVariables) {
    const results = {
      successful: [],
      failed: [],
    }

    const template = await Template.findById(templateId)
    if (!template) {
      throw new Error("Template not found")
    }

    for (const contact of contacts) {
      try {
        await this.transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
          to: contact.email,
          subject: template.subject,
          html: this.personalizeEmail(template.content, contact, customVariables),
          text: this.stripHtml(template.content),
        })

        results.successful.push(contact.email)
      } catch (error) {
        console.error(`Error sending email to ${contact.email}:`, error)
        results.failed.push({
          email: contact.email,
          error: error.message,
        })
      }
    }

    return results
  }

  async sendSingleEmail(contact, templateId, customVariables) {
    try {
      const template = await Template.findById(templateId)
      if (!template) {
        throw new Error("Template not found")
      }

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject: template.subject,
        html: this.personalizeEmail(template.content, contact, customVariables),
        text: this.stripHtml(this.personalizeEmail(template.content, contact, customVariables)),
      }

      console.log("Attempting to send email with options:", mailOptions)

      const info = await this.transporter.sendMail(mailOptions)
      console.log("Message sent: %s", info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error("Error sending single email:", error)
      return { success: false, error: error.message }
    }
  }

  personalizeEmail(template, contact, customVariables) {
    let personalizedContent = template.replace(/{{name}}/g, contact.name || "").replace(/{{email}}/g, contact.email)

    // Replace custom variables
    for (const [key, value] of Object.entries(customVariables)) {
      personalizedContent = personalizedContent.replace(new RegExp(`{{${key}}}`, "g"), value)
    }

    return personalizedContent
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, "")
  }
}

export default new EmailService()

