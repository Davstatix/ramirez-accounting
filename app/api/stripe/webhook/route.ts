import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Create Supabase client at runtime (not build time)
  const supabase = createAdminClient()
  
  // Initialize Stripe at runtime
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY is required' }, { status: 500 })
  }
  const stripe = new Stripe(stripeSecretKey)
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is required' }, { status: 500 })
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clientId = session.metadata?.client_id
      const planId = session.metadata?.plan_id

      if (clientId && planId) {
        // Update client with subscription info
        await supabase
          .from('clients')
          .update({
            subscription_plan: planId,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_started_at: new Date().toISOString(),
          })
          .eq('id', clientId)

        console.log(`Subscription activated for client ${clientId}: ${planId}`)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Find client by stripe customer ID
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (client) {
        // Check if subscription is set to cancel at period end
        let status: string = subscription.status
        if (subscription.cancel_at_period_end && subscription.status === 'active') {
          status = 'canceling'
        }
        
        await supabase
          .from('clients')
          .update({
            subscription_status: status,
          })
          .eq('id', client.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (client) {
        await supabase
          .from('clients')
          .update({
            subscription_status: 'cancelled',
            subscription_cancelled_at: new Date().toISOString(),
          })
          .eq('id', client.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (client) {
        await supabase
          .from('clients')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', client.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

