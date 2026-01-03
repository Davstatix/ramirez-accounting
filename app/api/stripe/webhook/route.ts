import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'
import { sendAdminSubscriptionChangeEmail } from '@/lib/email'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

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

      console.log('📦 checkout.session.completed event received:', {
        clientId,
        planId,
        customer: session.customer,
        subscription: session.subscription,
        mode: session.mode,
      })

      if (clientId && planId && session.mode === 'subscription') {
        // Update client with subscription info
        // Clear trial_end if it exists (trial is now converted to paid)
        const { data, error } = await supabase
          .from('clients')
          .update({
            subscription_plan: planId,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_started_at: new Date().toISOString(),
            trial_end: null, // Clear trial_end when subscription is created
          })
          .eq('id', clientId)
          .select()

        if (error) {
          console.error('❌ Error updating client subscription:', error)
        } else {
          console.log(`✅ Subscription activated for client ${clientId}: ${planId}`, data)
        }
        
        // Also update subscription metadata in Stripe for future reference (helps with sync)
        if (session.subscription) {
          try {
            await stripe.subscriptions.update(session.subscription as string, {
              metadata: { plan_id: planId, client_id: clientId },
            })
            console.log('✅ Updated subscription metadata in Stripe')
          } catch (metaError) {
            console.error('❌ Failed to update subscription metadata:', metaError)
          }
        }
      } else {
        console.warn('⚠️ Missing required data in checkout.session.completed:', {
          clientId: !!clientId,
          planId: !!planId,
          mode: session.mode,
        })
        
        // If we have subscription but missing metadata, try to find client by customer email
        if (session.customer && !clientId && session.subscription) {
          console.log('⚠️ Attempting to find client by Stripe customer ID...')
          try {
            const customer = await stripe.customers.retrieve(session.customer as string)
            if (customer && !customer.deleted && 'email' in customer && customer.email) {
              const { data: clientByEmail } = await supabase
                .from('clients')
                .select('id')
                .eq('email', customer.email)
                .maybeSingle()
              
              if (clientByEmail && planId) {
                console.log(`✅ Found client by email, updating subscription...`)
                const { error: updateError } = await supabase
                  .from('clients')
                  .update({
                    subscription_plan: planId,
                    subscription_status: 'active',
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                    subscription_started_at: new Date().toISOString(),
                  })
                  .eq('id', clientByEmail.id)
                
                if (updateError) {
                  console.error('❌ Error updating client found by email:', updateError)
                } else {
                  console.log(`✅ Subscription activated for client ${clientByEmail.id} (found by email)`)
                  // Update subscription metadata
                  await stripe.subscriptions.update(session.subscription as string, {
                    metadata: { plan_id: planId, client_id: clientByEmail.id },
                  })
                }
              }
            }
          } catch (findError) {
            console.error('❌ Error finding client by customer:', findError)
          }
        }
      }
      break
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('📦 customer.subscription.created event received:', {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
        items: subscription.items.data,
      })

      // Find client by stripe customer ID
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (clientError) {
        console.error('❌ Error finding client by customer ID:', clientError)
        break
      }

      if (client) {
        // Extract plan ID from subscription items
        const priceId = subscription.items.data[0]?.price?.id
        // We need to map price ID to plan ID, or get it from metadata
        // For now, let's try to get it from the subscription metadata or find it by price
        let planId: string | null = subscription.metadata?.plan_id || null

        // If we don't have plan_id in metadata, try to infer from price
        if (!planId && priceId) {
          // This is a fallback - ideally plan_id should be in metadata
          console.warn('⚠️ Plan ID not found in subscription metadata, attempting to infer from price')
        }

        if (planId) {
          const { data: updateData, error: updateError } = await supabase
            .from('clients')
            .update({
              subscription_plan: planId,
              subscription_status: subscription.status,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_started_at: new Date(subscription.created * 1000).toISOString(),
              trial_end: null, // Clear trial_end when subscription is created
            })
            .eq('id', client.id)
            .select()

          if (updateError) {
            console.error('❌ Error updating client subscription:', updateError)
          } else {
            console.log(`✅ Subscription created/updated for client ${client.id}: ${planId}`, updateData)
          }
        } else {
          console.warn('⚠️ Could not determine plan_id for subscription:', subscription.id)
        }
      } else {
        console.warn('⚠️ Client not found for customer ID:', customerId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('📦 customer.subscription.updated event received:', {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
      })

      // Find client by stripe customer ID
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name, email, subscription_plan, subscription_status')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (clientError) {
        console.error('❌ Error finding client by customer ID:', clientError)
        break
      }

      if (client) {
        // Get old plan name
        const oldPlanId = client.subscription_plan as PlanId | null
        const oldPlanName = oldPlanId ? PRICING_PLANS[oldPlanId]?.name || oldPlanId : null

        // Extract new plan ID from subscription
        let newPlanId: PlanId | null = subscription.metadata?.plan_id as PlanId || null
        
        // If no plan_id in metadata, try to infer from price
        if (!newPlanId) {
          const priceAmount = subscription.items.data[0]?.price?.unit_amount
          if (priceAmount) {
            for (const [id, plan] of Object.entries(PRICING_PLANS)) {
              if (plan.price === priceAmount) {
                newPlanId = id as PlanId
                break
              }
            }
          }
        }

        const newPlanName = newPlanId ? PRICING_PLANS[newPlanId]?.name || newPlanId : null

        // Determine change type
        let changeType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' = 'upgrade'
        const oldStatus = client.subscription_status
        const newStatus = subscription.cancel_at_period_end && subscription.status === 'active' 
          ? 'canceling' 
          : subscription.status

        if (newStatus === 'canceled' || newStatus === 'canceling') {
          changeType = 'cancel'
        } else if (oldStatus === 'canceled' || oldStatus === 'canceling') {
          changeType = 'reactivate'
        } else if (oldPlanId && newPlanId) {
          // Determine if upgrade or downgrade based on price
          const oldPrice = PRICING_PLANS[oldPlanId]?.price || 0
          const newPrice = PRICING_PLANS[newPlanId]?.price || 0
          changeType = newPrice > oldPrice ? 'upgrade' : 'downgrade'
        }

        // Check if subscription is set to cancel at period end
        let status: string = subscription.status as string
        if (subscription.cancel_at_period_end && subscription.status === 'active') {
          status = 'canceling'
        }
        
        // Update client subscription
        const { data: updateData, error: updateError } = await supabase
          .from('clients')
          .update({
            subscription_status: status,
            subscription_plan: newPlanId,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', client.id)
          .select()

        if (updateError) {
          console.error('❌ Error updating subscription status:', updateError)
        } else {
          console.log(`✅ Subscription updated for client ${client.id}:`, {
            status,
            plan: newPlanId,
            changeType,
          })

          // Send admin notification for subscription changes
          // Only send if there's an actual change (not just status update)
          if (oldPlanId !== newPlanId || changeType === 'cancel' || changeType === 'reactivate') {
            try {
              await sendAdminSubscriptionChangeEmail(
                client.name,
                client.email,
                changeType,
                oldPlanName,
                newPlanName,
                subscription.id
              )
              console.log(`✅ Admin notification sent for subscription ${changeType}`)
            } catch (emailError) {
              console.error('❌ Error sending admin notification:', emailError)
            }
          }
        }
      } else {
        console.warn('⚠️ Client not found for customer ID:', customerId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('📦 customer.subscription.deleted event received:', {
        subscriptionId: subscription.id,
        customerId,
      })

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (clientError) {
        console.error('❌ Error finding client by customer ID:', clientError)
        break
      }

      if (client) {
        const { data: updateData, error: updateError } = await supabase
          .from('clients')
          .update({
            subscription_status: 'cancelled',
            subscription_cancelled_at: new Date().toISOString(),
          })
          .eq('id', client.id)
          .select()

        if (updateError) {
          console.error('❌ Error updating subscription cancellation:', updateError)
        } else {
          console.log(`✅ Subscription cancelled for client ${client.id}`, updateData)
        }
      } else {
        console.warn('⚠️ Client not found for customer ID:', customerId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      console.log('📦 invoice.payment_failed event received:', {
        invoiceId: invoice.id,
        customerId,
      })

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (clientError) {
        console.error('❌ Error finding client by customer ID:', clientError)
        break
      }

      if (client) {
        const { data: updateData, error: updateError } = await supabase
          .from('clients')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', client.id)
          .select()

        if (updateError) {
          console.error('❌ Error updating subscription status to past_due:', updateError)
        } else {
          console.log(`✅ Subscription status set to past_due for client ${client.id}`, updateData)
        }
      } else {
        console.warn('⚠️ Client not found for customer ID:', customerId)
      }
      break
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`)
      break
  }

  return NextResponse.json({ received: true })
}

