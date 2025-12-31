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

    // If no customer ID, try to find by email
    if (!customerId && client.email) {
      const customers = await stripe.customers.list({
        email: client.email,
        limit: 1,
      })
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      }
    }

    if (!customerId) {
      return NextResponse.json({ 
        error: 'No Stripe customer found. Please complete checkout first.',
        hasCustomer: false 
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

      if (priceAmount) {
        // Match by price amount
        for (const [id, plan] of Object.entries(PRICING_PLANS)) {
          if (plan.price === priceAmount) {
            planId = id as PlanId
            break
          }
        }
      }
    }

    if (!planId) {
      return NextResponse.json({ 
        error: 'Could not determine plan from subscription',
        subscription: subscription.id 
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

