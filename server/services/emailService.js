import nodemailer from "nodemailer"
import dotenv from "dotenv"
import Template from "../models/EmailTemplate.js"
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

dotenv.config()

// Configure marked for safe HTML conversion
marked.setOptions({
  headerIds: false,
  mangle: false
})

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
}

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

  processVariables(text, variables = {}) {
    let processedText = text
    
    // Replace all variables with their values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}|{{${key}}}`, 'g')
      processedText = processedText.replace(regex, value || '')
    })
    
    return processedText
  }

  processContent(content) {
    // Convert markdown to HTML
    const htmlContent = marked(content)
    
    // Sanitize HTML
    return sanitizeHtml(htmlContent, sanitizeOptions)
  }

  prepareEmailContent(template, variables) {
    // Process subject variables
    const processedSubject = this.processVariables(template.subject, variables)
    
    // Process content variables and convert markdown
    let processedContent = this.processVariables(template.rawContent || template.content, variables)
    processedContent = this.processContent(processedContent)
    
    return {
      subject: processedSubject,
      content: processedContent
    }
  }

  async sendBulkEmail(contacts, templateId, customVariables = {}) {
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
        // Prepare variables for this contact
        const variables = {
          contactName: contact.name,
          contactEmail: contact.email,
          contactOrganization: contact.organization,
          senderName: process.env.EMAIL_FROM_NAME,
          senderTitle: process.env.SENDER_TITLE,
          ...customVariables
        }

        // Process template with variables
        const { subject, content } = this.prepareEmailContent(template, variables)

        await this.transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
          to: contact.email,
          subject: subject,
          html: content,
          text: sanitizeHtml(content, { allowedTags: [] }), // Strip all HTML for text version
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

  async sendSingleEmail(contact, templateId, customVariables = {}) {
    try {
      const template = await Template.findById(templateId)
      if (!template) {
        throw new Error("Template not found")
      }

      // Prepare variables
      const variables = {
        contactName: contact.name,
        contactEmail: contact.email,
        contactOrganization: contact.organization,
        senderName: process.env.EMAIL_FROM_NAME,
        senderTitle: process.env.SENDER_TITLE,
        ...customVariables
      }

      // Process template with variables
      const { subject, content } = this.prepareEmailContent(template, variables)

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject: subject,
        html: content,
        text: sanitizeHtml(content, { allowedTags: [] }), // Strip all HTML for text version
      }
      const info = await this.transporter.sendMail(mailOptions)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error("Error sending single email:", error)
      return { success: false, error: error.message }
    }
  }
}

export default new EmailService()