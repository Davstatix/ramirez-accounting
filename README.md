# Ramirez Accounting

A modern bookkeeping platform built with Next.js, React, and Supabase.

## 🚀 Features

- **Client Portal**: Clients can view reports, manage documents, and message their accountant
- **Admin Dashboard**: Manage clients, upload reports, approve documents, handle messages
- **Subscription Billing**: Stripe integration for monthly subscription plans
- **Invite System**: Generate invite codes for new client signups
- **Document Management**: Upload, approve, and reject client documents
- **Reports**: Upload P&L, Balance Sheet, and Reconciliation reports from QuickBooks
- **Messaging**: Threaded conversations with read/unread status

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
│   ├── client/            # Client portal pages
│   │   ├── documents/     # Document management
│   │   ├── messages/      # Messaging
│   │   ├── onboarding/    # Client onboarding flow
│   │   ├── reports/       # View reports
│   │   └── settings/      # Account settings
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── lib/                   # Utility libraries
│   ├── email.ts          # Resend email utilities
│   ├── stripe.ts         # Stripe pricing plans
│   ├── supabase.ts       # Supabase client
│   └── supabase-server.ts # Server-side Supabase
├── database/              # Database SQL scripts
│   ├── schema/           # Database schemas
│   ├── fixes/            # RLS policy fixes
│   └── cleanup/          # Cleanup scripts
└── public/               # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe (Subscriptions, Customer Portal)
- **Email**: Resend

## 📝 Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   RESEND_API_KEY=your_resend_api_key
   ```

3. Run database schemas in Supabase SQL editor:

   - `database/schema/database-schema.sql`
   - `database/schema/ONBOARDING_SCHEMA.sql`
   - `database/schema/REPORTS_SCHEMA.sql`
   - `database/schema/INVITE_CODES_SCHEMA.sql`
   - `database/schema/MESSAGING_ENHANCEMENTS.sql`

4. Apply fixes:

   - Run all SQL files in `database/fixes/`

5. Start dev server:

   ```bash
   npm run dev
   ```

6. For Stripe webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## 💳 Subscription Plans

- **Starter** ($150/mo): Basic bookkeeping for small businesses
- **Growth** ($300/mo): For growing businesses with more transactions
- **Professional** ($500/mo): Full service for established businesses

## 📧 Email Notifications

The platform supports email notifications via Resend for:

- Welcome emails
- New report notifications
- New message alerts
- Invite code delivery

Note: For testing, use `delivered@resend.dev` as the recipient.
