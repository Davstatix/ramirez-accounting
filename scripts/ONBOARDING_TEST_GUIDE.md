# Onboarding Process Testing Guide

This guide will help you test the complete onboarding flow from start to finish.

## Step 1: Reset Database and Create Admin

Follow the instructions in `RESET_DATABASE_INSTRUCTIONS.md` to reset your database and create a new admin account directly in Supabase.

**Quick summary:**

1. Open Supabase SQL Editor
2. Delete all data from tables (messages, invoices, documents, etc.)
3. Delete all auth users from Supabase dashboard
4. Create a new user in Authentication → Users
5. Create admin profile in SQL Editor
6. (Optional) Create a test invite code

## Step 2: Log in as Admin

1. Go to `/login`
2. Log in with your admin credentials
3. You should be redirected to `/admin`

## Step 3: Create an Invite Code for Testing

1. In the admin dashboard, navigate to the "Invite Codes" section
2. Create a new invite code for a test client
3. Copy the invite code (you'll need it for signup)

## Step 4: Test Client Signup

1. Go to `/signup` (or use the invite code link: `/signup?code=YOUR_INVITE_CODE`)
2. Fill out the signup form:
   - Name: Test Client
   - Email: test@example.com (or use a test email)
   - Phone: (555) 123-4567
   - Company Name: Test Company LLC
   - Password: (at least 8 characters)
   - Invite Code: (the code you created in Step 3)
3. Submit the form
4. You should be automatically logged in and redirected to `/client/onboarding`

## Step 5: Complete Onboarding - Step 1: Documents

The onboarding has 4 steps. Complete each one:

### Step 1: Upload Required Documents

Upload the following required documents:

- **Tax ID (EIN)**: Upload a test document (PDF or image)
- **Tax ID (SSN)**: Upload a test document (if sole proprietor)
- **Bank Statement**: Upload a test document
- **Business License**: Upload a test document

**Note:** For testing, you can use any PDF or image files. The system will accept them.

After uploading all 4 documents, click "Next" to proceed.

## Step 6: Complete Onboarding - Step 2: QuickBooks Connection

1. Fill in QuickBooks information:

   - **Company Name**: Test Company LLC
   - **Email**: test@example.com
   - **Access Notes**: Any notes about QuickBooks access

   **OR** if you don't have QuickBooks:

   - Enter "N/A" in the fields
   - Add a note that you don't have QuickBooks yet

2. Click "Next" to proceed.

## Step 7: Complete Onboarding - Step 3: Plan Selection

1. Select a pricing plan:

   - **Starter Plan**: $99/month
   - **Professional Plan**: $199/month
   - **Enterprise Plan**: $399/month

2. Click "Subscribe" to proceed to payment
3. **For testing with Stripe:**

   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVC (e.g., 123)
   - Any ZIP code (e.g., 12345)

4. Complete the payment
5. You should be redirected back to onboarding

## Step 8: Complete Onboarding - Step 4: Review

1. Review all the information you've entered
2. Verify all documents are uploaded
3. Click "Complete Setup" to finish onboarding

## Step 9: Verify Onboarding Completion

After completing onboarding:

1. You should be redirected to `/client` (the client dashboard)
2. Check that:
   - Your onboarding status shows as "completed"
   - You can see your documents
   - Your subscription is active
   - You can access all client features

## Step 10: Verify Admin Notifications

As the admin, check that you received:

1. Email notification when the client signed up
2. Email notification when the client completed onboarding

## Troubleshooting

### If signup fails:

- Check that the invite code is valid and not already used
- Verify the email is not already in use
- Check browser console for errors

### If document upload fails:

- Check file size (should be under 10MB)
- Verify file type is accepted (PDF, JPG, PNG)
- Check browser console for errors

### If payment fails:

- Verify Stripe keys are set in environment variables
- Check that you're using Stripe test mode
- Check browser console and network tab for errors

### If onboarding doesn't complete:

- Check browser console for errors
- Verify all required documents are uploaded
- Check that payment was successful
- Verify database connection

## Testing Checklist

- [ ] Admin account created successfully
- [ ] Admin can log in
- [ ] Admin can create invite code
- [ ] Client can sign up with invite code
- [ ] Client is redirected to onboarding
- [ ] Client can upload all 4 required documents
- [ ] Client can enter QuickBooks information
- [ ] Client can select and pay for a plan
- [ ] Client can complete onboarding
- [ ] Client is redirected to dashboard
- [ ] Admin receives signup notification email
- [ ] Admin receives onboarding completion email
- [ ] Client dashboard shows completed onboarding status
- [ ] All uploaded documents are visible
- [ ] Subscription status is correct

## Next Steps After Testing

Once you've verified everything works:

1. Reset the database again if needed
2. Create your actual admin account
3. Start onboarding real clients!
