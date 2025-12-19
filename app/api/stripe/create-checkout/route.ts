import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { planId, clientId } = await request.json()

    if (!planId || !PRICING_PLANS[planId as PlanId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plan = PRICING_PLANS[planId as PlanId]

    // Get client info
    const supabase = createClient()
    const { data: client } = await supabase
      .from('clients')
      .select('email, name')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId: string

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: client.email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.name,
        metadata: {
          client_id: clientId,
        },
      })
      customerId = customer.id
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/onboarding?step=4&subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/onboarding?step=3&subscription=cancelled`,
      metadata: {
        client_id: clientId,
        plan_id: planId,
      },
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

