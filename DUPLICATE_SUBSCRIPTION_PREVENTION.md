# Duplicate Subscription Prevention

## Problem

Users could complete checkout, hit the back button, and create multiple subscriptions for the same account during onboarding.

## Solution

Implemented multi-layer protection to prevent duplicate subscriptions:

### 1. **Backend API Check (Primary Protection)**

**File:** `app/api/stripe/create-checkout/route.ts`

Before creating a checkout session, we now check:

1. **Database Check:**

   - Checks if `subscription_status === 'active'` AND `stripe_subscription_id` exists
   - If found, returns error: "You already have an active subscription"

2. **Stripe Direct Check:**
   - Also checks Stripe directly for active subscriptions
   - This catches cases where database might be out of sync
   - Searches by customer email to find any active subscriptions

**Response:**

```json
{
  "error": "You already have an active subscription. Please manage your subscription in Settings.",
  "hasActiveSubscription": true,
  "subscriptionId": "..."
}
```

### 2. **Frontend Check (Payment Step Only)**

**File:** `app/client/onboarding/page.tsx`

1. **On Page Load:**

   - Loads subscription status when loading client data
   - **Does NOT redirect** - allows users to navigate through onboarding steps
   - Users can go back and change documents, update QuickBooks info, etc.

2. **At Payment Step (Step 3):**
   - Checks subscription status before creating checkout
   - If active subscription found:
     - Shows error: "You already have an active subscription. You can manage it in Settings after completing onboarding."
     - **Allows user to proceed to Step 4 (Review)** to complete onboarding
     - Does NOT redirect to Settings (user can finish onboarding)
   - If API returns `hasActiveSubscription: true`, same behavior - proceed to step 4

### 3. **User Experience**

- **If user has active subscription:**

  - Can navigate through all onboarding steps (Documents, QuickBooks, Plan Selection)
  - At payment step, sees error message but can continue to Review step
  - Can complete onboarding even with existing subscription
  - Can manage existing subscription from Settings after onboarding

- **If user tries to create duplicate:**
  - Backend blocks the request
  - Frontend shows error but allows continuing to Review step
  - No duplicate charges occur
  - User can finish onboarding process

## Code Changes

### Backend (`app/api/stripe/create-checkout/route.ts`)

```typescript
// Check database for active subscription
if (client.subscription_status === "active" && client.stripe_subscription_id) {
  return NextResponse.json(
    {
      error: "You already have an active subscription...",
      hasActiveSubscription: true,
    },
    { status: 400 }
  );
}

// Also check Stripe directly
const subscriptions = await stripe.subscriptions.list({
  customer: customerId,
  status: "active",
  limit: 1,
});
if (subscriptions.data.length > 0) {
  return NextResponse.json(
    {
      error: "You already have an active subscription...",
      hasActiveSubscription: true,
    },
    { status: 400 }
  );
}
```

### Frontend (`app/client/onboarding/page.tsx`)

```typescript
// Load subscription status (but don't redirect - allow navigation)
const { data: client } = await supabase
  .from("clients")
  .select("id, onboarding_status, subscription_status, stripe_subscription_id")
  .eq("user_id", user.id)
  .single();

// At payment step, check subscription before creating checkout
if (currentStep === 3) {
  const { data: currentClient } = await supabase
    .from("clients")
    .select("subscription_status, stripe_subscription_id")
    .eq("id", clientId)
    .single();

  if (
    currentClient?.subscription_status === "active" &&
    currentClient?.stripe_subscription_id
  ) {
    setErrorMessage(
      "You already have an active subscription. You can manage it in Settings after completing onboarding."
    );
    // Allow them to proceed to step 4 (review) even with existing subscription
    setCurrentStep(4);
    return;
  }
}

// Handle API error response
if (data.hasActiveSubscription) {
  setErrorMessage(
    "You already have an active subscription. You can manage it in Settings after completing onboarding."
  );
  // Allow them to proceed to step 4 (review) even with existing subscription
  setCurrentStep(4);
  return;
}
```

## Testing

To test the fix:

1. **Complete a subscription** through onboarding
2. **Hit the back button** to go back to plan selection
3. **Try to select a plan again** and proceed to checkout
4. **Expected result:**
   - Error message appears
   - Redirected to Settings page
   - No duplicate subscription created
   - No duplicate charge

## Edge Cases Handled

1. **Database out of sync:** Stripe direct check catches this
2. **User navigates back:** Frontend check prevents attempt
3. **Multiple rapid clicks:** Backend check blocks all attempts
4. **Browser back button:** Frontend redirects on page load

## Logging

The backend logs all blocked attempts:

```
⚠️ Blocked duplicate subscription attempt for client {clientId}
⚠️ Blocked duplicate subscription - found active Stripe subscription for client {clientId}
```

## Future Enhancements

- Add rate limiting to prevent rapid repeated attempts
- Add admin notification when duplicate attempt is blocked
- Consider adding a "resume onboarding" flow for users with subscriptions
