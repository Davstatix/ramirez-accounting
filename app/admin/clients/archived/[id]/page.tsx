'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Package, Eye, Download, BarChart3 } from 'lucide-react'

interface ArchivedClient {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  archived_at: string
  delete_after_date: string
  created_at: string
  subscription_plan: string | null
  subscription_status: string | null
  subscription_started_at: string | null
  subscription_cancelled_at: string | null
}

interface Document {
  id: string
  name: string
  file_path: string
  file_type: string
  status: string
  created_at: string
}

interface Report {
  id: string
  name: string
  type: string
  file_path: string
  period_start: string | null
  period_end: string | null
  created_at: string
}

export default function ArchivedClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<ArchivedClient | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (clientId) {
      loadArchivedClientData()
    }
  }, [clientId])

  const loadArchivedClientData = async () => {
    try {
      // Load archived client
      const { data: clientData, error: clientError } = await supabase
        .from('archived_clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Load archived documents
      const { data: docsData } = await supabase
        .from('archived_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      setDocuments(docsData || [])

      // Load archived reports
      const { data: reportsData } = await supabase
        .from('archived_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      setReports(reportsData || [])
    } catch (error) {
      console.error('Error loading archived client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Error viewing document:', err)
      alert('Failed to open document')
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
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading document:', err)
      alert('Failed to download document')
    }
  }

  const handleViewReport = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('reports').createSignedUrl(filePath, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Error viewing report:', err)
      alert('Failed to open report')
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
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading report:', err)
      alert('Failed to download report')
    }
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      profit_loss: 'Profit & Loss',
      balance_sheet: 'Balance Sheet',
      reconciliation: 'Reconciliation',
    }
    return labels[type] || type
  }

  const calculateClientDuration = () => {
    if (!client) return 'N/A'
    const start = new Date(client.created_at)
    const end = new Date(client.archived_at)
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (months < 1) return 'Less than 1 month'
    if (months === 1) return '1 month'
    if (months < 12) return `${months} months`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
  }

  if (loading) {
    return <div className="text-center py-12">Loading archived client details...</div>
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Archived client not found</p>
        <Link href="/admin/clients/archived" className="text-primary-600 hover:text-primary-700">
          ← Back to Archived Clients
        </Link>
      </div>
    )
  }

  const daysUntilDeletion = Math.ceil(
    (new Date(client.delete_after_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/clients/archived"
          className="text-primary-600 hover:text-primary-700 flex items-center mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Archived Clients
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Archived Client: {client.name}</h1>
        <p className="text-gray-600 mt-2">Archived on {new Date(client.archived_at).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900 mt-1">{client.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900 mt-1">{client.email}</dd>
            </div>
            {client.phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900 mt-1">{client.phone}</dd>
              </div>
            )}
            {client.company_name && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="text-sm text-gray-900 mt-1">{client.company_name}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Subscription History
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="text-sm text-gray-900 mt-1 capitalize font-medium">
                {client.subscription_plan || 'No subscription'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Subscribed On</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {client.subscription_started_at 
                  ? new Date(client.subscription_started_at).toLocaleDateString()
                  : new Date(client.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cancelled On</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {client.subscription_cancelled_at 
                  ? new Date(client.subscription_cancelled_at).toLocaleDateString()
                  : new Date(client.archived_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration with Us</dt>
              <dd className="text-sm text-gray-900 mt-1 font-medium text-primary-600">
                {calculateClientDuration()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Retention Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Archived Date</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {new Date(client.archived_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Scheduled Deletion</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {new Date(client.delete_after_date).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Days Until Deletion</dt>
              <dd className={`text-sm font-medium mt-1 ${
                daysUntilDeletion < 0
                  ? 'text-red-600'
                  : daysUntilDeletion < 365
                  ? 'text-orange-600'
                  : 'text-gray-900'
              }`}>
                {daysUntilDeletion < 0 ? 'Expired - Ready for deletion' : `${daysUntilDeletion} days`}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Archived Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Archived Documents
            </h2>
            <span className="text-sm text-gray-500">{documents.length} documents</span>
          </div>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents archived</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {doc.file_type} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleViewDocument(doc.file_path)}
                      className="text-primary-600 hover:text-primary-800 p-1"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc.file_path, doc.name)}
                      className="text-gray-600 hover:text-gray-800 p-1"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archived Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Archived Reports
            </h2>
            <span className="text-sm text-gray-500">{reports.length} reports</span>
          </div>
          {reports.length === 0 ? (
            <p className="text-gray-500 text-sm">No reports archived</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{report.name}</p>
                    <p className="text-xs text-gray-500">
                      {getReportTypeLabel(report.type)} • {new Date(report.created_at).toLocaleDateString()}
                    </p>
                    {report.period_start && report.period_end && (
                      <p className="text-xs text-gray-400">
                        Period: {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleViewReport(report.file_path)}
                      className="text-primary-600 hover:text-primary-800 p-1"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.file_path, report.name)}
                      className="text-gray-600 hover:text-gray-800 p-1"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
