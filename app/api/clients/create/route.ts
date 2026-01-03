import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, company_name, password } = body

    // Use service role client for admin operations
    const serviceClient = createAdminClient()

    // Create auth user with provided password or random password
    const userPassword = password || Math.random().toString(36).slice(-12) + 'A1!'
    
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
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
      // If client creation fails, we should clean up the auth user
      await serviceClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: clientError.message }, { status: 400 })
    }

    // Initialize required documents for onboarding
    // Note: EIN and SSN are not both required - client must upload either one
    const requiredDocs = [
      { document_type: 'engagement_letter', is_required: true },
      { document_type: 'tax_id_ein', is_required: false }, // Either EIN or SSN is required, not both
      { document_type: 'tax_id_ssn', is_required: false }, // Either EIN or SSN is required, not both
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

    return NextResponse.json({ success: true, userId: authData.user.id, clientId: clientData.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

