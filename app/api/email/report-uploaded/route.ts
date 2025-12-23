import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendNewReportEmail } from '@/lib/email'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { clientId, reportType, reportName } = await request.json()

    // Create Supabase client at runtime
    const supabase = createAdminClient()

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('name, email, user_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get auth email (the actual login email) - always use actual client email
    const { data: authUser } = await supabase.auth.admin.getUserById(client.user_id)
    const email = authUser?.user?.email || client.email

    // Send email
    const result = await sendNewReportEmail(email, client.name, reportType, reportName)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending report email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

