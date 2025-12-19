import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminOnboardingCompleteEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { clientId, planName } = await request.json()

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Send email to admin
    await sendAdminOnboardingCompleteEmail(client.name, planName)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending onboarding complete email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

