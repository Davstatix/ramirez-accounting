import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Use verified domain for production emails
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Ramirez Accounting <contact@updates.ramirezaccountingny.com>'

export async function sendWelcomeEmail(to: string, clientName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Ramirez Bookkeeping!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">Welcome to Ramirez Bookkeeping!</h1>
          <p>Hi ${clientName},</p>
          <p>Thank you for choosing Ramirez Bookkeeping. We're excited to help you manage your finances!</p>
          <p>Your account has been set up and you can now access your client portal to:</p>
          <ul>
            <li>View your financial reports</li>
            <li>Upload documents</li>
            <li>Message our team</li>
            <li>Manage your subscription</li>
          </ul>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Access Your Portal
            </a>
          </p>
          <p>If you have any questions, feel free to reach out through the messaging system in your portal.</p>
          <p>Best regards,<br>The Ramirez Bookkeeping Team</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error }
  }
}

export async function sendNewReportEmail(to: string, clientName: string, reportType: string, reportName: string) {
  const reportTypeLabels: Record<string, string> = {
    profit_loss: 'Profit & Loss Statement',
    balance_sheet: 'Balance Sheet',
    reconciliation: 'Bank Reconciliation',
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New ${reportTypeLabels[reportType] || reportType} Available`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">New Report Available</h1>
          <p>Hi ${clientName},</p>
          <p>A new <strong>${reportTypeLabels[reportType] || reportType}</strong> has been uploaded to your account:</p>
          <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
            <strong>${reportName}</strong>
          </p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/reports" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Report
            </a>
          </p>
          <p>Best regards,<br>The Ramirez Bookkeeping Team</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending report email:', error)
    return { success: false, error }
  }
}

export async function sendNewMessageEmail(to: string, clientName: string, subject: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New Message: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">You Have a New Message</h1>
          <p>Hi ${clientName},</p>
          <p>You have received a new message from Ramirez Bookkeeping:</p>
          <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
            <strong>Subject:</strong> ${subject}
          </p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/messages" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Message
            </a>
          </p>
          <p>Best regards,<br>The Ramirez Bookkeeping Team</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending message email:', error)
    return { success: false, error }
  }
}

export async function sendInviteCodeEmail(to: string, clientName: string, inviteCode: string, expiresAt: Date) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Ramirez Bookkeeping Invite Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">Welcome to Ramirez Bookkeeping!</h1>
          <p>Hi ${clientName},</p>
          <p>Thank you for your interest in our bookkeeping services! Here's your invite code to create your account:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-family: monospace; letter-spacing: 4px; margin: 0; color: #1e40af;">
              <strong>${inviteCode}</strong>
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code expires on ${expiresAt.toLocaleDateString()}.
          </p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup?code=${inviteCode}" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Create Your Account
            </a>
          </p>
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <p>Best regards,<br>The Ramirez Bookkeeping Team</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending invite code email:', error)
    return { success: false, error }
  }
}

// Email to client when document is rejected
export async function sendDocumentRejectedEmail(to: string, clientName: string, documentName: string, reason: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Action Required: Document Rejected - ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Document Requires Re-upload</h1>
          <p>Hi ${clientName},</p>
          <p>Your document <strong>${documentName}</strong> has been reviewed and requires a new upload.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
          </div>
          <p>Please log in to your portal and upload a new version of this document.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/documents" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Upload New Document
            </a>
          </p>
          <p>If you have questions about why your document was rejected, please message us through your portal.</p>
          <p>Best regards,<br>The Ramirez Bookkeeping Team</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending document rejected email:', error)
    return { success: false, error }
  }
}

// Email to client when document is approved
export async function sendDocumentApprovedEmail(to: string, clientName: string, documentName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Document Approved: ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Document Approved ✓</h1>
          <p>Hi ${clientName},</p>
          <p>Great news! Your document <strong>${documentName}</strong> has been reviewed and approved.</p>
          <p>No further action is required for this document.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/documents" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Your Documents
            </a>
          </p>
          <p>Best regards,<br>The Ramirez Bookkeeping Team</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending document approved email:', error)
    return { success: false, error }
  }
}

// ============ ADMIN NOTIFICATIONS ============

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ramirez-bookkeeping.com'

// Email to admin when new client signs up
export async function sendAdminNewClientEmail(clientName: string, clientEmail: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Client Signed Up: ${clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">New Client Registration</h1>
          <p>A new client has signed up for Ramirez Bookkeeping:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${clientName}</p>
            <p style="margin: 0;"><strong>Email:</strong> ${clientEmail}</p>
          </div>
          <p>They will now go through the onboarding process to upload documents and select a subscription plan.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clients" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Clients
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending admin new client email:', error)
    return { success: false, error }
  }
}

// Email to admin when client sends a message
export async function sendAdminNewMessageEmail(clientName: string, subject: string, messagePreview: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Message from ${clientName}: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">New Client Message</h1>
          <p>You have received a new message from <strong>${clientName}</strong>:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 0; color: #4b5563;">${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}</p>
          </div>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/messages" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Message
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending admin message email:', error)
    return { success: false, error }
  }
}

// Email to admin when client uploads a document
export async function sendAdminDocumentUploadedEmail(clientName: string, documentName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Document Uploaded: ${documentName} from ${clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">New Document Upload</h1>
          <p><strong>${clientName}</strong> has uploaded a new document:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Document:</strong> ${documentName}</p>
          </div>
          <p>Please review and approve or reject this document.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/documents" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Review Documents
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending admin document email:', error)
    return { success: false, error }
  }
}

// Email to admin when client completes onboarding
export async function sendAdminOnboardingCompleteEmail(clientName: string, planName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Client Onboarding Complete: ${clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Onboarding Complete ✓</h1>
          <p><strong>${clientName}</strong> has completed their onboarding!</p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Selected Plan:</strong> ${planName}</p>
          </div>
          <p>They have uploaded all required documents and subscribed to a plan. You can now begin providing services.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clients" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Client Profile
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending admin onboarding email:', error)
    return { success: false, error }
  }
}

// Thank you email to client after discovery call form submission
export async function sendDiscoveryCallThankYouEmail(clientName: string, clientEmail: string) {
  const calendarUrl = process.env.CALENDAR_BOOKING_URL || 'https://calendly.com/ramirez-accounting/discovery-call'
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: 'Thank You for Your Interest - Schedule Your Free Discovery Call',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
            Thank You for Your Interest!
          </h1>
          <p>Hi ${clientName},</p>
          <p>Thank you for reaching out to Ramirez Accounting! We're excited to learn more about your business and how we can help you with your bookkeeping needs.</p>
          
          <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
            <h2 style="color: #0ea5e9; margin-top: 0;">Schedule Your Free Discovery Call</h2>
            <p style="color: #374151; margin-bottom: 20px;">Let's find a time that works for you. During this call, we'll:</p>
            <ul style="text-align: left; color: #374151; margin: 0 auto; display: inline-block;">
              <li>Discuss your business needs and challenges</li>
              <li>Explain how our services can help</li>
              <li>Answer any questions you have</li>
              <li>Determine the best plan for your business</li>
            </ul>
            <p style="margin-top: 24px;">
              <a href="${calendarUrl}" 
                 style="display: inline-block; background-color: #0ea5e9; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📅 Book Your Discovery Call
              </a>
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            If you have any questions before our call, feel free to reply to this email. We typically respond within 24 hours.
          </p>
          
          <p>We look forward to speaking with you soon!</p>
          <p>Best regards,<br><strong>David Ramirez</strong><br>Ramirez Accounting</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending discovery call thank you email:', error)
    return { success: false, error }
  }
}

// Email to admin when client books a discovery call
export async function sendAdminCalendarBookingEmail(clientName: string, clientEmail: string, bookingDetails: {
  eventType?: string
  startTime?: string
  endTime?: string
  timezone?: string
  meetingUrl?: string
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Discovery Call Scheduled: ${clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
            Discovery Call Scheduled
          </h1>
          <p><strong>${clientName}</strong> has scheduled a discovery call!</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #111827; margin-top: 0;">Booking Details</h3>
            <p style="margin: 8px 0;"><strong>Client:</strong> ${clientName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
            ${bookingDetails.startTime ? `<p style="margin: 8px 0;"><strong>Date & Time:</strong> ${bookingDetails.startTime}${bookingDetails.timezone ? ` (${bookingDetails.timezone})` : ''}</p>` : ''}
            ${bookingDetails.endTime ? `<p style="margin: 8px 0;"><strong>Duration:</strong> ${bookingDetails.endTime}</p>` : ''}
            ${bookingDetails.meetingUrl ? `<p style="margin: 8px 0;"><strong>Meeting Link:</strong> <a href="${bookingDetails.meetingUrl}">${bookingDetails.meetingUrl}</a></p>` : ''}
          </div>
          
          <p style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clients" 
               style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Clients
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending admin calendar booking email:', error)
    return { success: false, error }
  }
}

