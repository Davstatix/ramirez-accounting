'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  FileText,
  MessageSquare,
  Calendar,
  Download,
  Eye,
  Upload,
  BarChart3,
  CheckCircle,
  Package,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

interface Client {
  id: string
  user_id: string
  name: string
  email: string
  auth_email?: string
  phone: string | null
  company_name: string | null
  created_at: string
  quickbooks_info: any | null
  subscription_plan: string | null
  subscription_status: string | null
}

interface Document {
  id: string
  name: string
  file_path: string
  file_type: string
  status: string
  created_at: string
}

interface Message {
  id: string
  subject: string
  message: string
  read: boolean
  created_at: string
  thread_id?: string | null
  sender: {
    email: string
  }
}

interface Report {
  id: string
  type: 'profit_loss' | 'balance_sheet' | 'reconciliation'
  name: string
  file_path: string
  period_start: string | null
  period_end: string | null
  created_at: string
}

interface Stats {
  totalDocuments: number
  pendingDocuments: number
  unreadMessages: number
  totalReports: number
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    pendingDocuments: 0,
    unreadMessages: 0,
    totalReports: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadClientData()
  }, [clientId])

  // Reload data when page becomes visible (e.g., after returning from import)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadClientData()
      }
    }

    // Also reload when window gains focus (user returns to tab)
    const handleFocus = () => {
      loadClientData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [clientId])

  // Reload when URL changes (e.g., returning from import with refresh param)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('refresh') || urlParams.get('qb_connected')) {
      loadClientData()
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (urlParams.get('qb_error')) {
      setError(`QuickBooks connection failed: ${urlParams.get('qb_error')}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadClientData = async () => {
    try {
      // Load client info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError
      
      // Fetch auth email
      if (clientData.user_id) {
        const response = await fetch('/api/clients/get-auth-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: [clientData.user_id] }),
        })
        const { emails } = await response.json()
        clientData.auth_email = emails?.[clientData.user_id] || clientData.email
      }
      
      setClient(clientData)

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (documentsError) throw documentsError
      setDocuments(documentsData || [])

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        setMessages([])
      } else {
        // Load sender emails separately
        const senderIds = Array.from(new Set((messagesData || []).map((msg: any) => msg.sender_id).filter(Boolean)))
        let sendersMap: Record<string, any> = {}
        
        if (senderIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', senderIds)
          
          if (profilesData) {
            sendersMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = { email: profile.email }
              return acc
            }, {} as Record<string, any>)
          }
        }
        
        const transformedMessages = (messagesData || []).map((msg: any) => ({
          ...msg,
          sender: sendersMap[msg.sender_id] || { email: 'Unknown' },
        }))
        setMessages(transformedMessages)
      }

      // Load reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (reportsError) {
        console.error('Error loading reports:', reportsError)
        setReports([])
      } else {
        setReports(reportsData || [])
      }

      // Calculate stats
      const allDocuments = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)

      const allMessages = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', clientId)

      const allReports = await supabase
        .from('reports')
        .select('*')
        .eq('client_id', clientId)

      const totalDocuments = allDocuments.data?.length || 0
      const pendingDocuments = allDocuments.data?.filter((doc) => doc.status === 'pending').length || 0
      const unreadMessages = allMessages.data?.filter((msg) => !msg.read).length || 0
      const totalReports = allReports.data?.length || 0

      setStats({
        totalDocuments,
        pendingDocuments,
        unreadMessages,
        totalReports,
      })
    } catch (err: any) {
      console.error('Error loading client data:', err)
      setError('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('reports').download(filePath)
      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error downloading report:', err)
      alert('Failed to download report')
    }
  }

  const handleViewReport = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('reports').createSignedUrl(filePath, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err: any) {
      console.error('Error viewing report:', err)
      alert('Failed to view report')
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'profit_loss': return 'Profit & Loss'
      case 'balance_sheet': return 'Balance Sheet'
      case 'reconciliation': return 'Reconciliation'
      default: return type
    }
  }

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(filePath)
      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error downloading document:', err)
      alert('Failed to download document')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading client data...</div>
  }

  if (error && !client) {
    return (
      <div>
        <Link
          href="/admin/clients"
          className="text-primary-600 hover:text-primary-800 flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div>
        <Link
          href="/admin/clients"
          className="text-primary-600 hover:text-primary-800 flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Client not found</h3>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/clients"
          className="text-primary-600 hover:text-primary-800 flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            {client.company_name && (
              <p className="text-lg text-gray-600 mt-1">{client.company_name}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/messages"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Send Message
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Documents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDocuments}</p>
              {stats.pendingDocuments > 0 && (
                <p className="text-xs text-yellow-600 mt-1">{stats.pendingDocuments} pending</p>
              )}
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Reports</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReports}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.unreadMessages}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Client Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{client.auth_email || client.email}</p>
              </div>
            </div>
            {client.phone && (
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{client.phone}</p>
                </div>
              </div>
            )}
            {client.company_name && (
              <div className="flex items-start">
                <Building className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="text-gray-900">{client.company_name}</p>
                </div>
              </div>
            )}
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Client Since</p>
                <p className="text-gray-900">
                  {new Date(client.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Subscription
          </h2>
          {client.subscription_plan && PRICING_PLANS[client.subscription_plan as PlanId] ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {PRICING_PLANS[client.subscription_plan as PlanId].name} Plan
                  </p>
                  <p className="text-2xl font-bold text-primary-600">
                    ${(PRICING_PLANS[client.subscription_plan as PlanId].price / 100).toLocaleString()}/mo
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  client.subscription_status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : client.subscription_status === 'canceling'
                    ? 'bg-orange-100 text-orange-800'
                    : client.subscription_status === 'past_due'
                    ? 'bg-yellow-100 text-yellow-800'
                    : client.subscription_status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.subscription_status === 'active' && <CheckCircle className="h-4 w-4 mr-1" />}
                  {client.subscription_status === 'canceling' && <AlertCircle className="h-4 w-4 mr-1" />}
                  {client.subscription_status === 'past_due' && <AlertCircle className="h-4 w-4 mr-1" />}
                  {client.subscription_status === 'cancelled' && <XCircle className="h-4 w-4 mr-1" />}
                  {client.subscription_status === 'canceling' ? 'Canceling (end of period)' : client.subscription_status || 'Unknown'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Plan Features:</p>
                <ul className="space-y-1">
                  {PRICING_PLANS[client.subscription_plan as PlanId].features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No subscription</p>
          )}
        </div>

        {/* QuickBooks Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            QuickBooks Info
          </h2>
          {client.quickbooks_info ? (
            (() => {
              try {
                const qbInfo = JSON.parse(client.quickbooks_info)
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company Name</p>
                      <p className="text-gray-900">{qbInfo.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">QuickBooks Email</p>
                      <p className="text-gray-900">{qbInfo.email || 'N/A'}</p>
                    </div>
                    {qbInfo.accessNotes && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Notes</p>
                        <p className="text-gray-900 whitespace-pre-wrap">{qbInfo.accessNotes}</p>
                      </div>
                    )}
                  </div>
                )
              } catch {
                return <p className="text-gray-500 text-sm">Invalid QuickBooks data</p>
              }
            })()
          ) : (
            <p className="text-gray-500 text-sm">No QuickBooks info provided yet</p>
          )}
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recent Messages
            </h2>
            {stats.unreadMessages > 0 && (
              <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-1 rounded-full">
                {stats.unreadMessages} unread
              </span>
            )}
          </div>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet</p>
          ) : (
            <div className="space-y-3">
              {messages.slice(0, 5).map((msg) => {
                // Get thread_id for linking
                const threadId = (msg as any).thread_id || msg.id
                return (
                  <Link
                    key={msg.id}
                    href={`/admin/messages?thread=${threadId}`}
                    className={`block p-3 rounded-lg border ${
                      !msg.read ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                    } hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-gray-900">{msg.subject}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">From: {msg.sender?.email}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{msg.message}</p>
                  </Link>
                )
              })}
            </div>
          )}
          <Link
            href="/admin/messages"
            className="text-primary-600 hover:text-primary-800 text-sm font-medium mt-4 inline-block"
          >
            View all messages →
          </Link>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Recent Documents
          </h2>
        </div>
        {documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500">{doc.file_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                          doc.status === 'processed'
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDownloadDocument(doc.file_path, doc.name)}
                        className="text-primary-600 hover:text-primary-800 flex items-center"
                        title="Download document"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reports */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Reports
          </h2>
          <Link
            href={`/admin/reports?client_id=${client.id}`}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Upload Report →
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="text-gray-500 text-sm">No reports uploaded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Report
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                        report.type === 'profit_loss' ? 'bg-green-100 text-green-800' :
                        report.type === 'balance_sheet' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {getReportTypeLabel(report.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500">
                        {report.period_start && report.period_end
                          ? `${new Date(report.period_start).toLocaleDateString()} - ${new Date(report.period_end).toLocaleDateString()}`
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewReport(report.file_path)}
                          className="text-primary-600 hover:text-primary-800"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report.file_path, report.name)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

