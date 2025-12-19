'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  FileText,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle,
} from 'lucide-react'

interface Report {
  id: string
  type: 'profit_loss' | 'balance_sheet' | 'reconciliation'
  name: string
  file_path: string
  period_start: string | null
  period_end: string | null
  notes: string | null
  created_at: string
}

const REPORT_TYPES = {
  profit_loss: { 
    label: 'Profit & Loss', 
    color: 'bg-green-100 text-green-800',
    icon: TrendingUp,
    description: 'Income and expenses summary'
  },
  balance_sheet: { 
    label: 'Balance Sheet', 
    color: 'bg-blue-100 text-blue-800',
    icon: DollarSign,
    description: 'Assets, liabilities, and equity'
  },
  reconciliation: { 
    label: 'Reconciliation', 
    color: 'bg-purple-100 text-purple-800',
    icon: CheckCircle,
    description: 'Bank account reconciliation'
  },
}

export default function ClientReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get client ID
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!client) return

      // Load reports for this client
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])

      // Extract unique months from reports (based on period_end or created_at)
      const months = new Set<string>()
      ;(data || []).forEach((report: Report) => {
        const date = report.period_end ? new Date(report.period_end) : new Date(report.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months.add(monthKey)
      })
      setAvailableMonths(Array.from(months).sort().reverse())
    } catch (err) {
      console.error('Error loading reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (report: Report) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(report.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err) {
      console.error('Error viewing report:', err)
      alert('Failed to view report')
    }
  }

  const handleDownload = async (report: Report) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(report.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = report.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading report:', err)
      alert('Failed to download report')
    }
  }

  const filteredReports = reports.filter(r => {
    // Filter by type
    if (filterType && r.type !== filterType) return false
    
    // Filter by month
    if (filterMonth) {
      const date = r.period_end ? new Date(r.period_end) : new Date(r.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthKey !== filterMonth) return false
    }
    
    return true
  })

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Group reports by type for summary
  const reportCounts = {
    profit_loss: reports.filter(r => r.type === 'profit_loss').length,
    balance_sheet: reports.filter(r => r.type === 'balance_sheet').length,
    reconciliation: reports.filter(r => r.type === 'reconciliation').length,
  }

  if (loading) {
    return <div className="text-center py-12">Loading reports...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-1">View your Profit & Loss statements, Balance Sheets, and Reconciliation reports</p>
      </div>

      {/* Report Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(REPORT_TYPES).map(([type, config]) => {
          const Icon = config.icon
          const count = reportCounts[type as keyof typeof reportCounts]
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? '' : type)}
              className={`p-4 rounded-lg border-2 transition-all ${
                filterType === type 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 text-left">
                    <p className="font-semibold text-gray-900">{config.label}</p>
                    <p className="text-xs text-gray-500">{config.description}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Month Filter */}
      {availableMonths.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMonth('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterMonth === ''
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Months
            </button>
            {availableMonths.map((month) => (
              <button
                key={month}
                onClick={() => setFilterMonth(filterMonth === month ? '' : month)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMonth === month
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatMonthLabel(month)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No reports available yet</p>
          <p className="text-sm text-gray-400">
            Your accountant will upload reports here once they&apos;re ready
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const typeConfig = REPORT_TYPES[report.type]
            const Icon = typeConfig.icon
            return (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className={`p-3 rounded-lg ${typeConfig.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-gray-900">{report.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        {report.period_start && report.period_end && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-sm text-gray-400">
                          Uploaded {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {report.notes && (
                        <p className="text-sm text-gray-500 mt-2">{report.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleView(report)}
                      className="px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg flex items-center text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(report)}
                      className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center text-sm font-medium"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

