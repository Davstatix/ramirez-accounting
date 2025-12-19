'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FileText, DollarSign, BarChart3, MessageSquare, TrendingUp, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ClientDashboard() {
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const onboardingComplete = searchParams.get('onboarding') === 'complete'
  const supabase = createClient()

  useEffect(() => {
    checkRoleAndLoadData()
  }, [])

  const checkRoleAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin - if so, redirect to admin dashboard
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile in client page:', profileError)
        // If we can't get profile, assume client and continue
        await loadClientData()
        return
      }

      const userRole = profile?.role?.toLowerCase()

      if (userRole === 'admin') {
        window.location.replace('/admin')
        return
      }

      // User is a client, load client data
      await loadClientData()
    } catch (error) {
      console.error('Error checking role:', error)
      setLoading(false)
    }
  }

  const loadClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get client profile - use .maybeSingle() instead of .single() to handle no rows gracefully
      let { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() // Returns null instead of error when no rows found

      if (clientError) {
        // Only log if it's not a "no rows" error
        if (clientError.code !== 'PGRST116') {
          console.error('Error loading client:', clientError)
        }
        // If no client record exists, that's fine - show empty state
        setClientData({
          client: null,
          reports: [],
        })
        setLoading(false)
        return
      }

      // If onboarding was just completed, refresh client data
      if (onboardingComplete && client) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: refreshedClient } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (refreshedClient) {
          client = refreshedClient
          router.replace('/client')
        }
      }

      // Check if onboarding is required
      if (client && client.onboarding_status !== 'completed') {
        router.replace('/client/onboarding')
        return
      }

      // Load reports and messages if client exists
      let reports: any[] = []
      let unreadMessages: any[] = []

      if (client?.id) {
        // Get recent reports
        const { data: reps, error: repsError } = await supabase
          .from('reports')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (repsError && repsError.code !== 'PGRST116') {
          console.error('Error loading reports:', repsError)
        }

        reports = reps || []

        // Get unread messages (from admin - where sender is not the client)
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .eq('client_id', client.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5)

        // Filter out messages sent by the client themselves
        unreadMessages = (msgs || []).filter((m: any) => m.sender_id !== user.id)
      }

      setClientData({
        client,
        reports,
        unreadMessages,
      })
    } catch (error) {
      console.error('Error loading client data:', error)
      // Set empty state on error
      setClientData({
        client: null,
        reports: [],
        unreadMessages: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  // If no client record exists, show a message
  if (!clientData?.client) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome!</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-blue-800">
            Your client profile is being set up. Please contact your accountant if you need assistance.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome back{clientData?.client?.name ? `, ${clientData.client.name}` : ''}!
      </h1>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Recent Reports
          </h2>
          <Link
            href="/client/reports"
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View all
          </Link>
        </div>
        {clientData?.reports?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No reports available yet</p>
            <p className="text-sm text-gray-400 mt-1">Your accountant will upload reports here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientData?.reports?.map((report: any) => {
              const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
                profit_loss: { label: 'P&L', color: 'bg-green-100 text-green-800', icon: TrendingUp },
                balance_sheet: { label: 'Balance Sheet', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
                reconciliation: { label: 'Reconciliation', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
              }
              const config = typeConfig[report.type] || { label: report.type, color: 'bg-gray-100 text-gray-800', icon: FileText }
              const Icon = config.icon
              return (
                <Link
                  key={report.id}
                  href="/client/reports"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${config.color} mr-3`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/client/messages"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Send Message</p>
          </Link>
          <Link
            href="/client/documents"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Update Documents</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

