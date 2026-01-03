import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendAdminDocumentUploadedEmail } from '@/lib/email'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { clientId, documentName } = await request.json()

    if (!clientId || !documentName) {
      return NextResponse.json(
        { error: 'clientId and documentName are required' },
        { status: 400 }
      )
    }

    // Create Supabase client at runtime
    const supabase = createAdminClient()

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Send email notification to admin
    await sendAdminDocumentUploadedEmail(client.name, documentName)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending document uploaded email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

