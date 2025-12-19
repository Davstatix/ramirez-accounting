'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Eye,
  Calendar,
  Building,
  Filter,
} from 'lucide-react'

interface Report {
  id: string
  client_id: string
  type: 'profit_loss' | 'balance_sheet' | 'reconciliation'
  name: string
  file_path: string
  period_start: string | null
  period_end: string | null
  notes: string | null
  created_at: string
  client?: {
    name: string
    company_name: string | null
  }
}

interface Client {
  id: string
  name: string
  company_name: string | null
}

const REPORT_TYPES = {
  profit_loss: { label: 'Profit & Loss', color: 'bg-green-100 text-green-800' },
  balance_sheet: { label: 'Balance Sheet', color: 'bg-blue-100 text-blue-800' },
  reconciliation: { label: 'Reconciliation', color: 'bg-purple-100 text-purple-800' },
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterClient, setFilterClient] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  
  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    client_id: '',
    type: 'profit_loss' as 'profit_loss' | 'balance_sheet' | 'reconciliation',
    name: '',
    period_start: '',
    period_end: '',
    notes: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, company_name')
        .order('name')

      if (clientsData) setClients(clientsData)

      // Load reports
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map client names to reports
      const reportsWithClients = (reportsData || []).map(report => ({
        ...report,
        client: clientsData?.find(c => c.id === report.client_id)
      }))

      setReports(reportsWithClients)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.client_id || !uploadData.name) {
      alert('Please fill in all required fields and select a file')
      return
    }

    setUploading(true)
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${uploadData.client_id}/${Date.now()}-${uploadData.type}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Create report record
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          client_id: uploadData.client_id,
          type: uploadData.type,
          name: uploadData.name,
          file_path: fileName,
          period_start: uploadData.period_start || null,
          period_end: uploadData.period_end || null,
          notes: uploadData.notes || null,
        })

      if (insertError) throw insertError

      // Send email notification to client
      const client = clients.find(c => c.id === uploadData.client_id)
      if (client) {
        fetch('/api/email/report-uploaded', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: uploadData.client_id,
            reportType: uploadData.type,
            reportName: uploadData.name,
          }),
        }).catch(err => console.error('Failed to send email:', err))
      }

      // Reset form and reload
      setShowUploadForm(false)
      setUploadData({
        client_id: '',
        type: 'profit_loss',
        name: '',
        period_start: '',
        period_end: '',
        notes: '',
      })
      setSelectedFile(null)
      loadData()
    } catch (err: any) {
      console.error('Error uploading report:', err)
      alert('Failed to upload report: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (report: Report) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([report.file_path])

      // Delete record
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id)

      if (error) throw error
      loadData()
    } catch (err: any) {
      console.error('Error deleting report:', err)
      alert('Failed to delete report')
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

  const filteredReports = reports.filter(report => {
    if (filterClient && report.client_id !== filterClient) return false
    if (filterType && report.type !== filterType) return false
    return true
  })

  if (loading) {
    return <div className="text-center py-12">Loading reports...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Upload and manage P&L, Balance Sheets, and Reconciliation reports from QuickBooks</p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.company_name && `(${client.company_name})`}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
          >
            <option value="">All Types</option>
            <option value="profit_loss">Profit & Loss</option>
            <option value="balance_sheet">Balance Sheet</option>
            <option value="reconciliation">Reconciliation</option>
          </select>
        </div>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select
                  value={uploadData.client_id}
                  onChange={(e) => setUploadData({ ...uploadData, client_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company_name && `(${client.company_name})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
                <select
                  value={uploadData.type}
                  onChange={(e) => setUploadData({ ...uploadData, type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                >
                  <option value="profit_loss">Profit & Loss</option>
                  <option value="balance_sheet">Balance Sheet</option>
                  <option value="reconciliation">Reconciliation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Name *</label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  placeholder="e.g., P&L January 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                  <input
                    type="date"
                    value={uploadData.period_start}
                    onChange={(e) => setUploadData({ ...uploadData, period_start: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                  <input
                    type="date"
                    value={uploadData.period_end}
                    onChange={(e) => setUploadData({ ...uploadData, period_end: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const file = e.dataTransfer.files[0]
                    if (file) setSelectedFile(file)
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-primary-500 bg-primary-50' 
                      : selectedFile 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.xlsx,.xls,.csv"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="text-green-700">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-green-600 mt-1">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">Drag & drop your file here</p>
                      <p className="text-sm mt-1">or click to browse</p>
                      <p className="text-xs text-gray-400 mt-2">PDF, Excel, or CSV files</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={uploadData.notes}
                  onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                  placeholder="Any additional notes about this report"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No reports found</p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="mt-4 text-primary-600 hover:text-primary-800 font-medium"
          >
            Upload your first report
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{report.client?.name || 'Unknown'}</div>
                    {report.client?.company_name && (
                      <div className="text-xs text-gray-500">{report.client.company_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${REPORT_TYPES[report.type].color}`}>
                      {REPORT_TYPES[report.type].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {report.period_start && report.period_end ? (
                      <>
                        {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(report)}
                        className="px-2 py-1 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded text-sm flex items-center gap-1"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm flex items-center gap-1"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(report)}
                        className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm flex items-center gap-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
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
  )
}

