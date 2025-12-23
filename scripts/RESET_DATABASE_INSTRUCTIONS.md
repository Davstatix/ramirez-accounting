# How to Reset Database and Create Admin in Supabase

Follow these steps to reset your database and create a new admin account directly in Supabase.

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

## Step 2: Delete All Data

Run this SQL to delete all data (in the correct order to avoid foreign key errors):

```sql
-- Delete all data (order matters due to foreign keys)
DELETE FROM messages;
DELETE FROM invoices;
DELETE FROM documents;
DELETE FROM required_documents;
DELETE FROM quickbooks_connections;
DELETE FROM reports;
DELETE FROM clients;
DELETE FROM profiles;
DELETE FROM invite_codes;
```

## Step 3: Delete All Auth Users

**Use the Supabase Dashboard (This is the correct method):**

Supabase doesn't allow direct SQL deletion of auth users for security reasons. You must use the dashboard:

1. Go to "Authentication" → "Users" in Supabase dashboard
2. You'll see a list of all users
3. For each user:
   - Click the three dots (⋯) or the menu icon next to the user
   - Click "Delete user"
   - Confirm deletion
4. Repeat until all users are deleted

**Tip:** If you have many users, you can:

- Use the search/filter to find specific users
- Delete them in batches
- Or use the Supabase Management API if you have programmatic access

## Step 4: Create New Admin User

1. Go to "Authentication" → "Users" in Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter:
   - **Email**: Your admin email (e.g., `david@ramirezaccountingny.com`)
   - **Password**: Your secure password (at least 8 characters)
   - **Auto Confirm User**: ✅ Check this box
4. Click "Create user"
5. **Copy the User ID** that's displayed (you'll need it for the next step)

## Step 5: Create Admin Profile

Go back to SQL Editor and run this (replace `YOUR_USER_ID` with the actual user ID from Step 4):

```sql
-- Create admin profile
INSERT INTO profiles (id, email, role)
VALUES (
    '758a275a-9bdc-4ebf-858b-c012176a5d08',  -- Replace with actual user ID from Step 4
    'david@ramirezaccountingny.com',  -- Replace with your admin email
    'admin'
);
```

## Step 6: Create Test Invite Code (Optional)

If you want to test the onboarding process, create a test invite code:

```sql
-- Create test invite code
INSERT INTO invite_codes (code, email, used, created_by)
VALUES (
    'TEST-ONBOARDING-2024',  -- The invite code
    NULL,  -- Not tied to specific email
    false,  -- Not used yet
    'YOUR_USER_ID'  -- Replace with your admin user ID
);
```

## Step 7: Verify Everything

Run these queries to verify:

```sql
-- Check admin profile
SELECT * FROM profiles WHERE role = 'admin';

-- Check invite codes
SELECT * FROM invite_codes;

-- Check that all other tables are empty
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM documents;
SELECT COUNT(*) FROM invoices;
SELECT COUNT(*) FROM messages;
```

## Step 8: Test Login

1. Go to your website's `/login` page
2. Log in with your admin credentials
3. You should be redirected to `/admin`

## Next Steps: Test Onboarding

1. **Create an invite code** from the admin dashboard (or use the test code you created)
2. **Sign up as a test client** at `/signup` using the invite code
3. **Complete onboarding**:
   - Upload 4 required documents
   - Enter QuickBooks info (or "N/A")
   - Select and pay for a plan (use Stripe test card: `4242 4242 4242 4242`)
   - Review and complete

## Troubleshooting

### If you get foreign key errors:

- Make sure you're deleting in the correct order (messages → invoices → documents → required_documents → clients → profiles)

### If you can't delete auth users:

- Use the Supabase dashboard to manually delete users
- Or contact Supabase support if you need to bulk delete

### If admin login doesn't work:

- Verify the profile was created: `SELECT * FROM profiles WHERE email = 'your-email@example.com'`
- Check that the role is 'admin' (not 'client')
- Make sure the user ID in profiles matches the auth user ID

### If invite code doesn't work:

- Check that `used = false`
- Verify the code matches exactly (case-sensitive)
- Make sure `created_by` is set to your admin user ID
