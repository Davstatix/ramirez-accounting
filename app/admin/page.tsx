'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, FileText, BarChart3, Ticket, MessageSquare } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalReports: 0,
    pendingDocuments: 0,
    unreadMessages: 0,
    activeInviteCodes: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      // Get total reports
      const { count: reportCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })

      // Get pending documents
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get unread messages
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)

      // Get active invite codes
      const { count: inviteCount } = await supabase
        .from('invite_codes')
        .select('*', { count: 'exact', head: true })
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())

      setStats({
        totalClients: clientCount || 0,
        totalReports: reportCount || 0,
        pendingDocuments: docCount || 0,
        unreadMessages: messageCount || 0,
        activeInviteCodes: inviteCount || 0,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: BarChart3,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Documents',
      value: stats.pendingDocuments,
      icon: FileText,
      color: 'bg-orange-500',
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/invite-codes"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <Ticket className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Generate Invite Code</p>
          </a>
          <a
            href="/admin/reports"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Upload Report</p>
          </a>
          <a
            href="/admin/messages"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
          >
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">View Messages</p>
          </a>
        </div>
      </div>
    </div>
  )
}
