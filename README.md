# Ramirez Accounting

A modern, full-featured bookkeeping platform built with Next.js, React, and Supabase. This platform enables accountants to manage clients, process subscriptions, handle documents, and communicate seamlessly with their clients.

## 🚀 Features

### Client Portal

- **Interactive Dashboard**: View subscription status, recent reports, and quick actions
- **Financial Reports**: View and download Profit & Loss statements, Balance Sheets, and Bank Reconciliations
- **Document Management**: Upload required documents (Engagement Letter, Tax ID EIN/SSN, Bank Statements, Business License) with status tracking
  - Three document categories: Required Documents, Other Documents, QuickBooks Settings
- **Messaging System**: Threaded conversations with read/unread status and email notifications
- **Account Settings**: Manage subscription, update profile, and change password
- **Onboarding Flow**: Step-by-step onboarding with document upload, QuickBooks connection, and plan selection

### Admin Dashboard

- **Client Management**: View, archive, and manage all clients
- **Document Review**: Approve or reject client documents with email notifications
  - **Filtering**: Filter documents by client and document type
- **Report Upload**: Upload financial reports (P&L, Balance Sheet, Reconciliation) for clients
  - **Filtering**: Filter reports by client and report type
- **Invite Code System**: Generate invite codes with recommended plans and engagement letter attachments
  - Automatic email delivery with engagement letter PDF attachment
  - Recommended plan suggestions in email
- **Message Management**: View and respond to client messages
  - **Filtering**: Filter messages by client and status
  - Create new messages to clients
- **Subscription Sync**: Manual sync for Stripe subscription status with intelligent customer matching

### Public Website

- **Landing Page**: Modern, responsive design showcasing services and pricing
- **Interactive Demo**: Full-featured demo portal allowing potential clients to explore the platform before signing up
- **Contact Form**: Integrated contact form with automatic email notifications and Calendly booking links
- **Legal Pages**: Privacy Policy, Terms of Service, and Disclaimer pages

### Payment & Billing

- **Stripe Integration**: Secure subscription billing with Stripe Checkout
- **Subscription Plans**: Starter ($175/mo), Growth ($325/mo), Professional ($550/mo)
- **Customer Portal**: Stripe billing portal for subscription management
- **Webhook Handling**: Automatic subscription status updates via Stripe webhooks

### Email System

- **Resend Integration**: Professional email delivery with custom domain support
- **Automated Emails**:
  - Welcome emails for new clients
  - Discovery call thank you emails with Calendly links
  - Invite code emails with recommended plans
  - Report upload notifications
  - Document status updates (approved/rejected)
  - Message notifications
  - Admin notifications for new clients, bookings, and messages
- **Reply-to Configuration**: Client replies automatically forwarded to business email

### Calendar Integration

- **Calendly Webhooks**: Automatic email notifications when clients book discovery calls
- **Calendar Events**: Admin receives email with booking details and meeting links

## 📁 Project Structure

```
ramirez-bookeeping/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   │   ├── clients/       # Client management
│   │   ├── documents/     # Document review
│   │   ├── invite-codes/  # Invite code management
│   │   ├── messages/      # Client messaging
│   │   └── reports/       # Report uploads
│   ├── api/               # API routes
│   │   ├── calendar/      # Calendly webhook handler
│   │   ├── clients/       # Client CRUD operations
│   │   ├── contact/       # Contact form handler
│   │   ├── email/         # Email notification routes
│   │   ├── invite-codes/  # Invite code management
│   │   └── stripe/        # Stripe webhooks and checkout
│   ├── client/            # Client portal pages
│   │   ├── documents/     # Document management
│   │   ├── messages/      # Messaging
│   │   ├── onboarding/    # Client onboarding flow
│   │   ├── reports/       # View reports
│   │   └── settings/      # Account settings
│   ├── demo/              # Interactive demo page
│   ├── login/             # Login page
│   ├── signup/            # Signup page with invite code
│   ├── privacy/            # Privacy Policy page
│   ├── terms/              # Terms of Service page
│   ├── disclaimer/        # Disclaimer page
│   └── page.tsx           # Landing page
├── components/            # React components
│   └── ContactForm.tsx   # Contact form component
├── lib/                   # Utility libraries
│   ├── email.ts          # Resend email utilities
│   ├── stripe.ts         # Stripe pricing plans
│   ├── supabase.ts       # Client-side Supabase
│   └── supabase-server.ts # Server-side Supabase
├── database/              # Database SQL scripts
│   ├── schema/           # Database schemas
│   ├── fixes/            # RLS policy fixes
│   ├── migrations/       # Database migrations
│   ├── cleanup/          # Database cleanup scripts
│   └── setup/            # Setup scripts
└── public/               # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Payments**: Stripe (Subscriptions, Customer Portal, Webhooks)
- **Email**: Resend (Transactional emails with custom domain)
- **Calendar**: Calendly (Discovery call scheduling)
- **Deployment**: Vercel

## 📝 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Resend account
- Calendly account (optional, for discovery calls)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd ramirez-bookeeping
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables** in `.env.local`:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # Resend
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=Ramirez Accounting <contact@updates.ramirezaccountingny.com>
   ADMIN_EMAIL=david@ramirezaccountingny.com

   # App Configuration
   NEXT_PUBLIC_APP_URL=https://ramirezaccountingny.com
   CALENDLY_BOOKING_URL=https://calendly.com/ramirez-accounting/30min
   ```

4. **Set up Supabase Database**:

   Run these SQL files in order in the Supabase SQL editor:

   - `database/schema/database-schema.sql` - Core database schema
   - `database/schema/ONBOARDING_SCHEMA.sql` - Onboarding tables
   - `database/schema/REPORTS_SCHEMA.sql` - Reports table
   - `database/schema/INVITE_CODES_SCHEMA.sql` - Invite codes table
   - `database/schema/MESSAGING_ENHANCEMENTS.sql` - Messaging improvements
   - `database/migrations/add_recommended_plan_to_invite_codes.sql` - Recommended plan field
   - `database/migrations/add_engagement_letter_to_invite_codes.sql` - Engagement letter support
   - `database/migrations/add_engagement_letter_to_required_documents.sql` - Engagement letter document type

   Then apply all fixes:

   - Run all SQL files in `database/fixes/`

5. **Set up Supabase Storage**:

   - Create a storage bucket named `documents`
   - Set up RLS policies for document access

6. **Create Admin User**:

   - Sign up through the app or create via Supabase Auth
   - Update the `profiles` table to set `role = 'admin'` for your user

7. **Set up Stripe Webhooks**:

   - In Stripe Dashboard, create a webhook endpoint pointing to `/api/stripe/webhook`
   - Subscribe to these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

8. **Set up Calendly Webhooks** (optional):

   - In Calendly, create a webhook pointing to `/api/calendar/webhook`
   - Subscribe to `invitee.created` events

9. **Start development server**:

   ```bash
   npm run dev
   ```

10. **For local Stripe webhook testing**:
    ```bash
    stripe listen --forward-to localhost:3000/api/stripe/webhook
    ```

## 💳 Subscription Plans

- **Starter** ($175/month): For very small businesses with simple bookkeeping needs

  - Monthly bookkeeping (up to 50 transactions)
  - Bank reconciliation (1 account)
  - Monthly Profit & Loss statement
  - Secure client portal access
  - Email support (48-hour response time)
  - Best for: Sole proprietors, freelancers, and early-stage businesses

- **Growth** ($325/month) - Most Popular: For growing businesses that need more visibility

  - Monthly bookkeeping (up to 150 transactions)
  - Bank & credit card reconciliation (up to 3 accounts)
  - Monthly Profit & Loss & Balance Sheet
  - Quarterly financial review call (30 minutes)
  - Secure client portal access
  - Priority email support (24-hour response time)
  - Best for: Small businesses with regular monthly activity

- **Professional** ($550/month): For established businesses that want ongoing financial insight
  - Monthly bookkeeping (up to 300 transactions)
  - Bank & credit card reconciliation (up to 5 accounts)
  - Monthly Profit & Loss & Balance Sheet
  - Monthly financial review call (30 minutes)
  - Year-end close & tax-ready financials
  - Priority support
  - Best for: Established businesses and growing teams

## 📧 Email Features

The platform uses Resend for all email communications:

### Client Emails

- **Welcome Email**: Sent when client completes signup
- **Discovery Call Thank You**: Sent after contact form submission with Calendly link
- **Invite Code Email**: Sent when admin generates invite code (includes recommended plan and engagement letter PDF attachment)
- **Report Notifications**: Sent when new reports are uploaded
- **Document Status**: Sent when documents are approved or rejected
- **Message Notifications**: Sent when admin sends a message

### Admin Emails

- **New Client Signup**: Notification when client completes registration
- **Calendar Booking**: Notification when client books discovery call
- **New Message**: Notification when client sends a message
- **Document Upload**: Notification when client uploads a document (required or other documents)
- **Onboarding Complete**: Notification when client completes onboarding with selected plan

### Email Configuration

- All emails use `replyTo` set to the admin email, so client replies go directly to the business
- Custom domain support via Resend
- Professional HTML email templates

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level security policies
- **Authentication**: Supabase Auth with email/password
- **Encrypted Storage**: Secure document storage in Supabase Storage
- **Secure Payments**: Stripe PCI-compliant payment processing
- **Session Management**: Secure cookie-based sessions

## 🧪 Testing

### Test Stripe Payments

- Use the "Test Plan" ($1) option in the onboarding flow for testing
- Use Stripe test cards: `4242 4242 4242 4242` with any future expiry date
- **Important**: Ensure Stripe Radar rules are configured to block failed CVV checks in production

### Test Email

- All emails are sent to actual client/admin emails (no test mode)
- Ensure Resend domain is verified for production use
- All client replies are automatically forwarded to the admin email via `replyTo` configuration

### Subscription Sync

- If webhook fails, use the "Sync Subscription from Stripe" button in client settings
- The sync feature intelligently matches customers by email (including auth email)
- Handles cases where payment email differs from account email

## 📄 Legal Pages

The platform includes:

- **Privacy Policy** (`/privacy`): Data collection and privacy practices
- **Terms of Service** (`/terms`): Service terms and conditions
- **Disclaimer** (`/disclaimer`): Professional services disclaimer

## 🎨 Demo Page

The interactive demo page (`/demo`) allows potential clients to:

- Explore the full client portal interface
- Experience the complete onboarding flow (Documents, QuickBooks, Plan Selection, Review)
- See how reports, documents, and messages work
- Understand subscription management
- Navigate through all portal features without creating an account
- Experience the platform before committing to a subscription

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:

- All Supabase keys
- All Stripe keys
- Resend API key
- `NEXT_PUBLIC_APP_URL` set to your production domain
- `CALENDLY_BOOKING_URL` (if using Calendly)

## 📚 Additional Resources

- **Database Schema**: See `database/schema/` directory for complete schema definitions
- **Database Migrations**: See `database/migrations/` for recent schema changes
- **Subscription Management**: See `SUBSCRIPTION_MANAGEMENT_STRATEGY.md` for subscription handling details
- **Duplicate Prevention**: See `DUPLICATE_SUBSCRIPTION_PREVENTION.md` for subscription duplicate prevention logic

## 🤝 Support

For questions or issues:

- Email: david@ramirezaccountingny.com
- Phone: (516) 595-3637

## 📝 License

Proprietary - All rights reserved

---
