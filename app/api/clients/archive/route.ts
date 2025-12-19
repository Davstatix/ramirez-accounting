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
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Use service role client for admin operations
    const serviceClient = createAdminClient()

    // First, check if archive tables exist, if not, create them on the fly
    // Get client data first
    const { data: clientData, error: clientError } = await serviceClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Try to use the archive function if it exists, otherwise archive directly
    const { error: rpcError } = await serviceClient.rpc('archive_client', {
      client_uuid: clientId,
    })

    if (rpcError) {
      // Function doesn't exist, archive directly in the API
      console.log('Archive function not found, archiving directly...')

      // Check if archive tables exist, create them if needed
      const { error: tableCheckError } = await serviceClient
        .from('archived_clients')
        .select('id')
        .limit(1)

      if (tableCheckError) {
        // Tables don't exist - need to set up archive system first
        return NextResponse.json({
          error: 'Archive system not set up. Please run SETUP_ARCHIVE_SIMPLE.sql in Supabase SQL Editor first. This creates the archive tables needed for 7-year data retention.',
          requiresArchiveSetup: true,
        }, { status: 400 })
      }

      // Archive tables exist, proceed with archiving
      const deleteAfterDate = new Date()
      deleteAfterDate.setFullYear(deleteAfterDate.getFullYear() + 7) // 7 years from now

      // Archive client
      const { error: archiveClientError } = await serviceClient
        .from('archived_clients')
        .insert({
          id: clientData.id,
          user_id: clientData.user_id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          company_name: clientData.company_name,
          delete_after_date: deleteAfterDate.toISOString(),
          original_client_data: clientData,
          created_at: clientData.created_at,
          updated_at: clientData.updated_at,
          subscription_plan: clientData.subscription_plan,
          subscription_status: clientData.subscription_status,
          subscription_started_at: clientData.subscription_started_at,
          subscription_cancelled_at: clientData.subscription_cancelled_at || new Date().toISOString(),
        })

      if (archiveClientError) {
        console.error('Error archiving client:', archiveClientError)
        return NextResponse.json({ error: 'Failed to archive client: ' + archiveClientError.message }, { status: 400 })
      }

      // Archive documents
      const { data: documents } = await serviceClient
        .from('documents')
        .select('*')
        .eq('client_id', clientId)

      if (documents && documents.length > 0) {
        const archivedDocs = documents.map((doc: any) => ({
          id: doc.id,
          client_id: clientData.id,
          name: doc.name,
          file_path: doc.file_path,
          file_type: doc.file_type,
          status: doc.status,
          original_data: doc,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        }))

        await serviceClient
          .from('archived_documents')
          .insert(archivedDocs)
      }

      // Archive reports
      const { data: reports } = await serviceClient
        .from('reports')
        .select('*')
        .eq('client_id', clientId)

      if (reports && reports.length > 0) {
        const archivedReports = reports.map((report: any) => ({
          id: report.id,
          client_id: clientData.id,
          type: report.type,
          name: report.name,
          file_path: report.file_path,
          period_start: report.period_start,
          period_end: report.period_end,
          notes: report.notes,
          created_at: report.created_at,
          uploaded_by: report.uploaded_by,
        }))

        await serviceClient
          .from('archived_reports')
          .insert(archivedReports)
      }

      // Now delete from active tables
      const { error: deleteError } = await serviceClient
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to delete client after archiving' }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, message: 'Client archived successfully' })
  } catch (error: any) {
    console.error('Archive route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

