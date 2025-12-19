import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds } = body

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 })
    }

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

