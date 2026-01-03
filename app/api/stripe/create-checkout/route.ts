import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-server'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { planId, clientId } = await request.json()

    if (!planId || !PRICING_PLANS[planId as PlanId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plan = PRICING_PLANS[planId as PlanId]

    // Initialize Stripe at runtime
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is required' }, { status: 500 })
    }
    
    // Detect if we're in test mode
    const isTestMode = stripeSecretKey.startsWith('sk_test_')
    const isLiveMode = stripeSecretKey.startsWith('sk_live_')
    
    if (isTestMode) {
      console.log('⚠️ WARNING: Using Stripe TEST mode. Real cards entered will be charged!')
    } else if (isLiveMode) {
      console.log('✅ Using Stripe LIVE mode')
    } else {
      console.warn('⚠️ Unknown Stripe key format - cannot determine test/live mode')
    }
    
    const stripe = new Stripe(stripeSecretKey)

    // Get client info
    const supabase = createAdminClient()
    const { data: client } = await supabase
      .from('clients')
      .select('email, name, subscription_status, subscription_plan, stripe_subscription_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // CRITICAL: Prevent duplicate subscriptions
    // Check if client already has an active subscription
    if (client.subscription_status === 'active' && client.stripe_subscription_id) {
      console.warn(`⚠️ Blocked duplicate subscription attempt for client ${clientId}`)
      return NextResponse.json(
        { 
          error: 'You already have an active subscription. Please manage your subscription in Settings.',
          hasActiveSubscription: true,
          subscriptionId: client.stripe_subscription_id,
        },
        { status: 400 }
      )
    }

    // Also check in Stripe directly for any active subscriptions
    // IMPORTANT: Only check if client already has a stripe_customer_id in database
    // This prevents blocking new clients who reuse an email that had a previous subscription
    // If client doesn't have stripe_customer_id, they're a new client and should be allowed to subscribe
    if (client.email) {
      // First check if this client already has a Stripe customer ID
      const { data: clientWithStripe } = await supabase
        .from('clients')
        .select('stripe_customer_id')
        .eq('id', clientId)
        .single()

      // Only check Stripe if client has an existing Stripe customer ID
      // This means they've already subscribed before
      if (clientWithStripe?.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: clientWithStripe.stripe_customer_id,
          status: 'active',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          console.warn(`⚠️ Blocked duplicate subscription - found active Stripe subscription for client ${clientId}`)
          return NextResponse.json(
            {
              error: 'You already have an active subscription. Please manage your subscription in Settings.',
              hasActiveSubscription: true,
              subscriptionId: subscriptions.data[0].id,
            },
            { status: 400 }
          )
        }
      }
      // If client doesn't have stripe_customer_id, they're new - allow subscription even if email was used before
      // The old Stripe customer/subscription from previous account is separate
    }

    // CRITICAL: For new clients (no stripe_customer_id), create a NEW Stripe customer
    // Do NOT reuse existing customers by email - this prevents using old saved payment methods
    // Only reuse customer if client already has stripe_customer_id in database
    
    let customerId: string | null = null
    
    // Check if client already has a Stripe customer ID in database
    const { data: clientWithStripe } = await supabase
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', clientId)
      .single()

    if (clientWithStripe?.stripe_customer_id) {
      // Client already has a Stripe customer - use it
      customerId = clientWithStripe.stripe_customer_id
      
      // Check for saved payment methods and detach them to force fresh entry
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId || undefined,
        type: 'card',
      })
      if (paymentMethods.data.length > 0 && !isTestMode) {
        console.warn('⚠️ CRITICAL: Customer has saved payment methods that could bypass CVV validation!')
        console.warn('⚠️ Detaching saved payment methods to force fresh card entry...')
        
        for (const pm of paymentMethods.data) {
          try {
            await stripe.paymentMethods.detach(pm.id)
            console.log(`✅ Detached payment method: ${pm.id}`)
          } catch (err) {
            console.error(`❌ Failed to detach payment method ${pm.id}:`, err)
          }
        }
      }
    }
    // If client doesn't have stripe_customer_id, don't create/find customer here
    // Let Stripe create a new customer during checkout - this ensures fresh payment entry

    // Auto-detect localhost for development
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://ramirezaccountingny.com')

    // Create checkout session for subscription
    // CRITICAL SECURITY FIX: Do NOT pass customer_email for new clients
    // When customer_email is passed, Stripe may find existing customer by email
    // and use their saved payment methods, bypassing CVV/expiration validation
    // 
    // Additionally, Stripe may recognize card numbers from previous transactions
    // even across different customers (card fingerprinting). We need to ensure
    // CVV/expiration are ALWAYS validated regardless of card recognition.
    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      // Ensure CVV is always required and payment is properly validated
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic', // Require 3D Secure when possible for additional security
          // Note: Stripe may still recognize cards by number, but CVV should still be validated
        },
      },
      // CRITICAL: Don't pass customer_email - this prevents Stripe from finding old customers
      // and using saved payment methods. Stripe will create a new customer during checkout.
      // The webhook will link the customer to our client record after payment.
      //
      // IMPORTANT: Even without customer_email, Stripe may recognize card numbers
      // from previous transactions. This is why Stripe Dashboard Radar rules are critical.
    }
    
    // For new clients (no stripe_customer_id), don't pass customer_email
    // This ensures Stripe creates a completely new customer and requires fresh card entry
    if (!clientWithStripe?.stripe_customer_id) {
      console.log('📧 New client - Stripe will create new anonymous customer (no email passed to prevent linking to old customers)')
      console.warn('⚠️ WARNING: Stripe may still recognize card numbers from previous transactions. Ensure Radar rules are enabled!')
    } else {
      // Existing client - still don't pass customer to force fresh entry
      console.log('🔄 Existing client - forcing fresh payment entry (not using saved methods)')
    }
    
    const session = await stripe.checkout.sessions.create({
      ...sessionConfig,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Plan - Ramirez Accounting`,
              description: plan.description,
            },
            unit_amount: plan.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/client?subscription=success`,
      cancel_url: `${baseUrl}/client?subscription=cancelled&error=payment_cancelled`,
      metadata: {
        client_id: clientId,
        plan_id: planId,
        test_mode: isTestMode ? 'true' : 'false',
      },
      // Don't save payment method automatically - require fresh entry each time
      payment_method_collection: 'always',
    })
    
    console.log('Stripe checkout session created:', {
      sessionId: session.id,
      url: session.url,
      mode: isTestMode ? 'TEST' : 'LIVE',
      amount: plan.price,
      plan: plan.name,
      warning: isTestMode ? '⚠️ TEST MODE - Real cards will be charged if entered!' : null,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

