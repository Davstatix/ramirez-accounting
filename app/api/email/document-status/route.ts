import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDocumentApprovedEmail, sendDocumentRejectedEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { clientId, documentName, status, reason } = await request.json()

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('name, email, user_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get auth email
    const { data: authUser } = await supabase.auth.admin.getUserById(client.user_id)
    const email = process.env.USE_TEST_EMAIL === 'true' 
      ? 'delivered@resend.dev' 
      : (authUser?.user?.email || client.email)

    if (status === 'approved') {
      await sendDocumentApprovedEmail(email, client.name, documentName)
    } else if (status === 'rejected') {
      await sendDocumentRejectedEmail(email, client.name, documentName, reason || 'Please upload a clearer version')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending document status email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

