import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is required' }, { status: 500 })
    }
    
    const stripe = new Stripe(stripeSecretKey)

    // Get client from database
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email, stripe_customer_id, stripe_subscription_id')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    let customerId = client.stripe_customer_id

    // Get auth email (the actual login email, which might be different from client.email)
    const { data: { user } } = await supabase.auth.getUser()
    const authEmail = user?.email
    const emailsToSearch = new Set<string>()
    
    if (client.email) emailsToSearch.add(client.email.toLowerCase())
    if (authEmail) emailsToSearch.add(authEmail.toLowerCase())
    
    const emailsArray = Array.from(emailsToSearch)
    console.log('🔍 Searching for Stripe customer with emails:', emailsArray)

    // If no customer ID, try to find by all possible emails
    if (!customerId) {
      // Search all emails
      for (const email of emailsArray) {
        console.log(`🔍 Searching for Stripe customer by email: ${email}`)
        const customers = await stripe.customers.list({
          email: email,
          limit: 10,
        })
        
        console.log(`📧 Found ${customers.data.length} customer(s) with email ${email}`)
        
        if (customers.data.length > 0) {
          // Check each customer for active subscriptions
          for (const customer of customers.data) {
            const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'active',
              limit: 1,
            })
            
            if (subscriptions.data.length > 0) {
              customerId = customer.id
              console.log(`✅ Found customer with active subscription: ${customerId} (email: ${email})`)
              break
            }
          }
          
          // If no active subscription found, use the most recent customer anyway
          if (!customerId) {
            customerId = customers.data[0].id
            console.log(`✅ Found customer (no active subscription yet): ${customerId} (email: ${email})`)
          }
          
          if (customerId) break
        }
      }
    }

    // Last resort: search all recent customers (last 20) and check if any have subscriptions
    // This helps when payment email differs from account email
    if (!customerId) {
      console.log('🔍 Last resort: Searching recent Stripe customers with active subscriptions...')
      try {
        const recentCustomers = await stripe.customers.list({
          limit: 20, // Check more recent customers
        })
        
        console.log(`📋 Checking ${recentCustomers.data.length} recent customers...`)
        
        // Check each customer for active subscriptions
        for (const recentCustomer of recentCustomers.data) {
          const customerSubs = await stripe.subscriptions.list({
            customer: recentCustomer.id,
            status: 'active',
            limit: 1,
          })
          
          if (customerSubs.data.length > 0) {
            const customerEmail = recentCustomer.email?.toLowerCase()
            const clientEmail = client.email?.toLowerCase()
            const authEmailLower = authEmail?.toLowerCase()
            
            // Check multiple matching criteria
            const emailMatches = customerEmail && (
              customerEmail === clientEmail || 
              customerEmail === authEmailLower ||
              customerEmail?.includes(clientEmail?.split('@')[0] || '') || // Partial match (johanr2505 vs johan)
              clientEmail?.includes(customerEmail?.split('@')[0] || '')
            )
            
            const metadataMatches = recentCustomer.metadata?.client_id === clientId
            
            if (emailMatches || metadataMatches) {
              customerId = recentCustomer.id
              console.log(`✅ Found customer by ${metadataMatches ? 'metadata' : 'email'} match: ${customerId}`)
              console.log(`   Customer email: ${recentCustomer.email}`)
              console.log(`   Client email: ${client.email}`)
              console.log(`   Auth email: ${authEmail}`)
              break
            }
          }
        }
      } catch (searchError) {
        console.error('Error in last resort customer search:', searchError)
      }
    }

    if (!customerId) {
      console.error('❌ No Stripe customer found for:', {
        clientEmail: client.email,
        clientId: client.id,
        hasStripeCustomerId: !!client.stripe_customer_id,
      })
      return NextResponse.json({ 
        error: 'No Stripe customer found. The webhook may not have fired. Please contact support with your payment confirmation email.',
        hasCustomer: false,
        searchedEmails: [client.email],
        suggestion: 'Check your Stripe Dashboard to find the customer ID, then contact support to manually link it.',
      }, { status: 404 })
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: 'No active subscription found',
        hasSubscription: false 
      }, { status: 404 })
    }

    // Get the most recent active subscription (or the first one)
    const subscription = subscriptions.data.find(sub => sub.status === 'active') || subscriptions.data[0]

    if (!subscription) {
      return NextResponse.json({ 
        error: 'No subscription found',
        hasSubscription: false 
      }, { status: 404 })
    }

    // Extract plan ID from subscription metadata or price
    let planId: PlanId | null = subscription.metadata?.plan_id as PlanId || null

    // If no plan_id in metadata, try to infer from price
    if (!planId) {
      const priceId = subscription.items.data[0]?.price?.id
      const priceAmount = subscription.items.data[0]?.price?.unit_amount

      console.log('⚠️ Plan ID not in subscription metadata, attempting to infer from price:', {
        priceId,
        priceAmount,
      })

      if (priceAmount) {
        // Match by price amount
        for (const [id, plan] of Object.entries(PRICING_PLANS)) {
          if (plan.price === priceAmount) {
            planId = id as PlanId
            console.log(`✅ Matched plan by price: ${planId} (${plan.name})`)
            break
          }
        }
      }
      
      // If still no plan, try to get it from checkout session metadata
      if (!planId && subscription.metadata?.checkout_session_id) {
        try {
          const checkoutSession = await stripe.checkout.sessions.retrieve(
            subscription.metadata.checkout_session_id
          )
          if (checkoutSession.metadata?.plan_id) {
            planId = checkoutSession.metadata.plan_id as PlanId
            console.log(`✅ Found plan ID from checkout session metadata: ${planId}`)
            // Update subscription metadata for future reference
            await stripe.subscriptions.update(subscription.id, {
              metadata: { ...subscription.metadata, plan_id: planId },
            })
          }
        } catch (err) {
          console.error('Error retrieving checkout session:', err)
        }
      }
    }

    if (!planId) {
      return NextResponse.json({ 
        error: 'Could not determine plan from subscription. Please contact support.',
        subscription: subscription.id,
        priceAmount: subscription.items.data[0]?.price?.unit_amount,
        availablePlans: Object.keys(PRICING_PLANS),
      }, { status: 400 })
    }

    // Determine status
    let status: string = subscription.status as string
    if (subscription.cancel_at_period_end && subscription.status === 'active') {
      status = 'canceling'
    }

    // Update client in database
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({
        subscription_plan: planId,
        subscription_status: status,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_started_at: new Date(subscription.created * 1000).toISOString(),
      })
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating client subscription:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update subscription in database',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      client: updatedClient,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planId,
      }
    })
  } catch (error: any) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}

