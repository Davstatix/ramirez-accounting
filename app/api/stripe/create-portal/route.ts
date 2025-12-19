import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    // Initialize Stripe at runtime
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is required' }, { status: 500 })
    }
    const stripe = new Stripe(stripeSecretKey)

    // Get client's Stripe customer ID
    const supabase = createAdminClient()
    const { data: client } = await supabase
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', clientId)
      .single()

    if (!client?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}

