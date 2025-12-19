import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendWelcomeEmail, sendAdminNewClientEmail } from '@/lib/email'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company_name, password, invite_code } = body

    if (!name || !email || !password || !invite_code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client at runtime
    const supabase = createAdminClient()

    // Verify the invite code is still valid
    const { data: codeData, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', invite_code.toUpperCase())
      .eq('used', false)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 400 }
      )
    }

    // Check expiration
    if (new Date(codeData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invite code has expired' },
        { status: 400 }
      )
    }

    // Check if email is restricted to this code
    if (codeData.email && codeData.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite code is assigned to a different email' },
        { status: 400 }
      )
    }

    // Create auth user with email_confirm: true to skip email verification
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since they have valid invite code
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Create client profile with pending onboarding status
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        phone: phone || null,
        company_name: company_name || null,
        onboarding_status: 'pending',
      })
      .select()
      .single()

    if (clientError) {
      console.error('Error creating client:', clientError)
      // Clean up auth user if client creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: clientError.message },
        { status: 400 }
      )
    }

    // Initialize required documents for onboarding (all 4 are required)
    const requiredDocs = [
      { document_type: 'tax_id_ein', is_required: true },
      { document_type: 'tax_id_ssn', is_required: true },
      { document_type: 'bank_statement', is_required: true },
      { document_type: 'business_license', is_required: true },
    ]

    await supabase.from('required_documents').insert(
      requiredDocs.map((doc) => ({
        client_id: clientData.id,
        ...doc,
        status: 'pending',
      }))
    )

    // Mark invite code as used
    await supabase
      .from('invite_codes')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by: authData.user.id,
      })
      .eq('id', codeData.id)

    // Send welcome email to client
    const clientEmail = process.env.USE_TEST_EMAIL === 'true' ? 'delivered@resend.dev' : email
    sendWelcomeEmail(clientEmail, name).catch(err => console.error('Failed to send welcome email:', err))

    // Notify admin of new signup
    sendAdminNewClientEmail(name, email).catch(err => console.error('Failed to send admin notification:', err))

    return NextResponse.json({
      success: true,
      client_id: clientData.id,
      user_id: authData.user.id,
    })
  } catch (error: any) {
    console.error('Error in client signup:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

