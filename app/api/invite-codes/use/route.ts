import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, user_id } = body

    if (!code || !user_id) {
      return NextResponse.json(
        { error: 'Code and user_id are required' },
        { status: 400 }
      )
    }

    // Mark the code as used
    const { data, error } = await supabase
      .from('invite_codes')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by: user_id,
      })
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to use invite code' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error using invite code:', error)
    return NextResponse.json(
      { error: 'Failed to use invite code' },
      { status: 500 }
    )
  }
}

