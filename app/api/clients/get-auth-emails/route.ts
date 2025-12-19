import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds } = body

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 })
    }

    // Create Supabase client at runtime (not build time)
    const supabase = createAdminClient()

    // Get auth users
    const emailMap: Record<string, string> = {}

    for (const userId of userIds) {
      const { data, error } = await supabase.auth.admin.getUserById(userId)
      if (!error && data?.user?.email) {
        emailMap[userId] = data.user.email
      }
    }

    return NextResponse.json({ emails: emailMap })
  } catch (error: any) {
    console.error('Error fetching auth emails:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

