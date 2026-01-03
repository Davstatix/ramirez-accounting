# Subscription Management Strategy

## The Problem

Users can currently manage their subscriptions through Stripe's billing portal, but this creates a risk:

- **Downgrades without notification**: Users could downgrade their plan without you knowing
- **Service mismatch**: You might continue providing services outside their tier
- **Revenue loss**: Downgrades happen without your knowledge or approval

## Recommended Solution

**Disable plan switching in Stripe Dashboard**

- Users can only cancel subscriptions
- All upgrades/downgrades require contacting you
- You maintain full control
- No risk of service/tier mismatches

## Implementation

We've implemented comprehensive tracking and notifications for subscription changes:

### 1. **Stripe Dashboard Configuration**

**IMPORTANT:** Configure your Stripe Customer Portal to restrict plan switching:

1. Go to Stripe Dashboard → **Settings** → **Billing** → **Customer Portal**
2. Under **Subscriptions** section:
   - **Disable "Allow customers to switch plans"**
   - This ensures users can only cancel, not upgrade/downgrade
3. Save changes

**Result:** Users can only cancel subscriptions through the portal. All plan changes must go through you.

### 2. **Webhook Tracking**

The webhook (`app/api/stripe/webhook/route.ts`) now:

- ✅ Detects plan changes (upgrades/downgrades)
- ✅ Tracks subscription cancellations/reactivations
- ✅ Updates database with new plan
- ✅ Sends email notification to admin for ALL changes

### 3. **Email Notifications**

When a subscription changes, you receive an email with:

- Client name and email
- Change type (upgrade/downgrade/cancel/reactivate)
- Old plan → New plan
- Stripe subscription ID
- **Special warning for downgrades** (highlighted in red)

### 4. **Change Detection**

The system detects:

- **Upgrade**: Plan price increased
- **Downgrade**: Plan price decreased ⚠️ (highlighted in email)
- **Cancel**: Subscription cancelled
- **Reactivate**: Subscription reactivated after cancellation

## What Happens When a Change Occurs

1. **User changes subscription** in Stripe portal
2. **Stripe sends webhook** to your server
3. **Webhook handler:**
   - Updates database with new plan
   - Determines change type (upgrade/downgrade/etc.)
   - Sends email notification to admin
4. **You receive email** with all details
5. **You can review** and take action if needed

## Recommendations

1. **Disable plan switching in Stripe Dashboard** ✅

   - Users can only cancel
   - All upgrades/downgrades require contacting you
   - You maintain full control

2. **Create custom upgrade/downgrade flow** (future enhancement)
   - Custom UI in your admin portal
   - Requires admin approval
   - Better user experience than email-only

## Email Notification Details

**Subject:** `Subscription [UPGRADED/DOWNGRADED/CANCELLED]: [Client Name]`

**Content:**

- Client information
- Change type
- Old plan → New plan
- Stripe subscription ID
- Link to admin portal
- **Special warning for downgrades**

## Code Changes

### Files Modified:

1. **`app/api/stripe/webhook/route.ts`**

   - Added plan change detection
   - Added email notification calls
   - Tracks old vs new plan

2. **`lib/email.ts`**

   - Added `sendAdminSubscriptionChangeEmail()` function
   - Sends formatted notifications with warnings for downgrades

3. **`app/api/stripe/create-portal/route.ts`**
   - Added comments about Dashboard configuration
   - Portal restrictions must be set in Stripe Dashboard

## Testing

To test the notification system:

1. **Create a test subscription**
2. **Change the plan** in Stripe Dashboard (or via portal)
3. **Check your email** - you should receive notification
4. **Check database** - plan should be updated
5. **Check logs** - webhook should show change detection

## Future Enhancements

1. **Custom upgrade/downgrade UI**

   - Build custom interface in admin portal
   - Require admin approval for downgrades
   - Auto-approve upgrades

2. **Service tier enforcement**

   - Automatically restrict features based on plan
   - Alert when providing services outside tier

3. **Downgrade prevention**
   - Require admin approval before downgrade
   - Contact client before allowing downgrade

## Current Status

✅ **Implemented:**

- Webhook tracking of all subscription changes
- Email notifications for all changes
- Plan change detection (upgrade/downgrade)
- Database updates with new plan

⚠️ **Requires Manual Configuration:**

- Stripe Dashboard portal settings: **Disable "Allow customers to switch plans"**

📋 **Next Steps:**

1. ✅ Configure Stripe Dashboard: Disable plan switching
2. ✅ Test notification system (for cancellations)
3. Consider custom upgrade/downgrade flow for better UX (future)
