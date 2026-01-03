import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Use verified domain for production emails
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Ramirez Accounting <contact@updates.ramirezaccountingny.com>'

// Admin email for replies (all client-facing emails should reply to this)
const ADMIN_REPLY_EMAIL = process.env.ADMIN_EMAIL || 'david@ramirezaccountingny.com'

export async function sendWelcomeEmail(to: string, clientName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: ADMIN_REPLY_EMAIL,
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
      replyTo: ADMIN_REPLY_EMAIL,
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
      replyTo: ADMIN_REPLY_EMAIL,
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

export async function sendInviteCodeEmail(
  to: string, 
  clientName: string, 
  inviteCode: string, 
  expiresAt: Date,
  recommendedPlan?: { name: string; price: number; description: string } | null,
  engagementLetter?: { path: string; name: string } | null
) {
  console.log('📧 Sending invite code email:', { to, clientName, inviteCode, expiresAt, recommendedPlan, engagementLetter })
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set!')
    return { success: false, error: 'RESEND_API_KEY environment variable is not configured' }
  }
  
  try {
    // Use your business email for replies (domain is verified in Resend)
    const replyToEmail = process.env.ADMIN_EMAIL || 'david@ramirezaccountingny.com'
    console.log('📧 Sending invite code email with replyTo:', replyToEmail)
    
    // Download engagement letter from Supabase Storage if provided
    let attachment: { filename: string; content: string } | undefined
    if (engagementLetter) {
      try {
        const { createAdminClient } = await import('./supabase-server')
        const supabase = createAdminClient()
        
        const { data, error } = await supabase.storage
          .from('documents')
          .download(engagementLetter.path)
        
        if (error) {
          console.error('Error downloading engagement letter:', error)
        } else if (data) {
          // Convert Blob to base64
          const arrayBuffer = await data.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64Content = buffer.toString('base64')
          
          attachment = {
            filename: engagementLetter.name,
            content: base64Content,
          }
          console.log('✅ Engagement letter prepared for attachment')
        }
      } catch (err: any) {
        console.error('Error preparing engagement letter attachment:', err)
        // Continue without attachment if there's an error
      }
    }
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: replyToEmail, // Replies go to your business email (domain verified)
      subject: 'Thank You for the Discovery Call - Your Invite Code',
      attachments: attachment ? [attachment] : undefined,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
            Thank You for the Discovery Call!
          </h1>
          <p>Hi ${clientName},</p>
          <p>Thank you so much for taking the time to speak with me today! I really enjoyed our conversation and learning more about your business and how we can help you with your bookkeeping needs.</p>
          
          <p>As we discussed, I'm excited to get you set up with Ramirez Accounting. Here's your personal invite code to create your account and begin the onboarding process:</p>
          
          <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">Your Invite Code:</p>
            <p style="font-size: 36px; font-family: monospace; letter-spacing: 4px; margin: 0; color: #0ea5e9; font-weight: bold;">
              ${inviteCode}
            </p>
            <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 12px;">
              Expires: ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          ${recommendedPlan ? `
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0;">
            <h3 style="color: #111827; margin-top: 0; margin-bottom: 8px;">📋 Recommended Plan</h3>
            <p style="color: #374151; margin: 0 0 8px 0;">
              Based on our conversation, I recommend the <strong>${recommendedPlan.name} Plan</strong> for your business needs.
            </p>
            <p style="color: #374151; margin: 0 0 8px 0; font-size: 14px;">
              <strong>${recommendedPlan.name} Plan</strong> - $${(recommendedPlan.price / 100).toLocaleString()}/month
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 13px; font-style: italic;">
              ${recommendedPlan.description}
            </p>
            <p style="color: #374151; margin: 12px 0 0 0; font-size: 14px;">
              <strong>Please select the ${recommendedPlan.name} Plan</strong> during the onboarding process when you reach the plan selection step.
            </p>
          </div>
          ` : ''}
          
          <div style="background-color: #ffffff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 24px 0;">
            <h3 style="color: #111827; margin-top: 0;">Next Steps:</h3>
            <ol style="color: #374151; line-height: 1.8; padding-left: 20px;">
              <li>Click the button below to create your account</li>
              <li>Enter your invite code when prompted (or it will be pre-filled)</li>
              <li>Complete the onboarding process:
                <ul style="margin-top: 8px;">
                  <li>Review and sign the engagement letter${engagementLetter ? ' (attached to this email)' : ''}</li>
                  <li>Upload required documents (Tax ID, Bank Statement, Business License, Signed Engagement Letter)</li>
                  <li>Provide QuickBooks access information (if applicable)</li>
                  <li>Select your subscription plan${recommendedPlan ? ` (we recommend the ${recommendedPlan.name} Plan)` : ''}</li>
                  <li>Review and complete setup</li>
                </ul>
              </li>
              ${engagementLetter ? `
              <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
                <h3 style="color: #111827; margin-top: 0; margin-bottom: 8px;">📄 Engagement Letter</h3>
                <p style="color: #374151; margin: 0;">
                  Please review and sign the engagement letter attached to this email. You'll need to upload the signed copy during onboarding.
                </p>
              </div>
              ` : ''}
            </ol>
          </div>
          
          <p style="text-align: center; margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ramirezaccountingny.com'}/signup?code=${inviteCode}" 
               style="display: inline-block; background-color: #0ea5e9; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Create Your Account Now
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            If you have any questions or need assistance during the signup process, please don't hesitate to reach out. I'm here to help!
          </p>
          
          <p>Looking forward to working with you!</p>
          <p>Best regards,<br><strong>David Ramirez</strong><br>Ramirez Accounting<br>Phone: (516) 595-3637</p>
        </div>
      `,
    })
    
    console.log('✅ Invite code email sent successfully:', result)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error sending invite code email:', error)
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Email to client when document is rejected
export async function sendDocumentRejectedEmail(to: string, clientName: string, documentName: string, reason: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: ADMIN_REPLY_EMAIL,
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
      replyTo: ADMIN_REPLY_EMAIL,
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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'david@ramirezaccountingny.com'

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
  // Calendly URL format: https://calendly.com/{username}/{event-type}
  // Example: https://calendly.com/ramirez-accounting/30min
  const calendarUrl = process.env.CALENDLY_BOOKING_URL || process.env.CALENDAR_BOOKING_URL || 'https://calendly.com/ramirez-accounting/30min'
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      replyTo: ADMIN_REPLY_EMAIL,
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
            If you have any questions before our call, feel free to reply to this email. We&apos;ll get back to you as soon as possible.
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

export async function sendAdminSubscriptionChangeEmail(
  clientName: string,
  clientEmail: string,
  changeType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate',
  oldPlan: string | null,
  newPlan: string | null,
  subscriptionId: string
) {
  try {
    const changeLabels = {
      upgrade: 'Upgraded',
      downgrade: '⚠️ DOWNGRADED',
      cancel: 'Cancelled',
      reactivate: 'Reactivated',
    }

    const changeColors = {
      upgrade: '#10b981', // green
      downgrade: '#ef4444', // red
      cancel: '#f59e0b', // amber
      reactivate: '#3b82f6', // blue
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_REPLY_EMAIL,
      replyTo: ADMIN_REPLY_EMAIL,
      subject: `Subscription ${changeLabels[changeType]}: ${clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${changeColors[changeType]};">Subscription ${changeLabels[changeType]}</h1>
          <p><strong>Client:</strong> ${clientName} (${clientEmail})</p>
          <p><strong>Change Type:</strong> ${changeLabels[changeType]}</p>
          ${oldPlan ? `<p><strong>Previous Plan:</strong> ${oldPlan}</p>` : ''}
          ${newPlan ? `<p><strong>New Plan:</strong> ${newPlan}</p>` : ''}
          <p><strong>Stripe Subscription ID:</strong> ${subscriptionId}</p>
          ${changeType === 'downgrade' ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0;"><strong>⚠️ IMPORTANT:</strong> Client has downgraded their subscription. 
              Please review their account to ensure you're not providing services outside their tier.</p>
            </div>
          ` : ''}
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ramirezaccountingny.com'}/admin/clients" 
               style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Client in Admin Portal
            </a>
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated notification from your subscription management system.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending admin subscription change email:', error)
    return { success: false, error }
  }
}

