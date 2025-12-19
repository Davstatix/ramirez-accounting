import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email } = body

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Create Supabase client at runtime
    const supabase = createAdminClient()

    // Look up the code
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !inviteCode) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invite code' },
        { status: 400 }
      )
    }

    // Check if already used
    if (inviteCode.used) {
      return NextResponse.json(
        { valid: false, error: 'This invite code has already been used' },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'This invite code has expired' },
        { status: 400 }
      )
    }

    // If code is assigned to specific email, verify it matches
    if (inviteCode.email && email && inviteCode.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { valid: false, error: 'This invite code is assigned to a different email' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      invite_code: {
        id: inviteCode.id,
        client_name: inviteCode.client_name,
        email: inviteCode.email,
      }
    })
  } catch (error: any) {
    console.error('Error validating invite code:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invite code' },
      { status: 500 }
    )
  }
}

