import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewMessageEmail, sendAdminNewMessageEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { clientId, subject, message, senderType } = await request.json()

    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('name, email, user_id')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (senderType === 'admin') {
      // Admin sent message to client - notify client
      const { data: authUser } = await supabase.auth.admin.getUserById(client.user_id)
      const email = process.env.USE_TEST_EMAIL === 'true' 
        ? 'delivered@resend.dev' 
        : (authUser?.user?.email || client.email)
      await sendNewMessageEmail(email, client.name, subject)
    } else {
      // Client sent message - notify admin
      await sendAdminNewMessageEmail(client.name, subject, message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending message notification:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

