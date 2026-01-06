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
    const { userId, clientId } = body

    // Use service role client for admin operations
    const serviceClient = createAdminClient()

    // If clientId is provided, delete the client first (which cascades to related data)
    if (clientId) {
      const { error: clientDeleteError } = await serviceClient
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (clientDeleteError) {
        return NextResponse.json({ 
          error: 'Failed to delete client: ' + clientDeleteError.message 
        }, { status: 400 })
      }
    }

    // Delete the auth user (this will also cascade delete the profile if CASCADE is set up)
    if (userId) {
      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

