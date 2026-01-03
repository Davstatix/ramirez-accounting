'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  MessageSquare,
  Settings,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Upload,
  Download,
  Eye,
  Send,
  Calendar,
  X,
  AlertCircle,
  Clock,
  Menu,
  LogOut,
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  Package,
  ExternalLink,
  Edit,
  Trash2,
  XCircle,
  Shield,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

type TabType = 'dashboard' | 'reports' | 'documents' | 'messages' | 'settings' | 'onboarding'

// Mock report data - you can replace these with actual report placeholders later
const MOCK_REPORTS = [
  {
    id: '1',
    type: 'profit_loss' as const,
    name: 'Profit & Loss Statement - January 2026',
    file_path: 'reports/pl-january-2026.pdf', // Placeholder path
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    notes: null,
    created_at: '2026-01-31T10:00:00Z',
  },
  {
    id: '2',
    type: 'balance_sheet' as const,
    name: 'Balance Sheet - January 2026',
    file_path: 'reports/bs-january-2026.pdf', // Placeholder path
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    notes: null,
    created_at: '2026-01-31T10:00:00Z',
  },
  {
    id: '3',
    type: 'reconciliation' as const,
    name: 'Bank Reconciliation - January 2026',
    file_path: 'reports/recon-january-2026.pdf', // Placeholder path
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    notes: null,
    created_at: '2026-01-31T10:00:00Z',
  },
]

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

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('onboarding')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUploadSuccess, setShowUploadSuccess] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [selectedThread, setSelectedThread] = useState<string | null>('thread-1')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [documentsTab, setDocumentsTab] = useState<'required' | 'other' | 'quickbooks'>('required')
  const [qbInfo, setQbInfo] = useState({ companyName: 'Demo Business LLC', email: 'demo@example.com', accessNotes: '' })
  const [qbSaved, setQbSaved] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [onboardingDocs, setOnboardingDocs] = useState<Record<string, { uploaded: boolean; name?: string }>>({
    engagement_letter: { uploaded: false },
    tax_id_ein: { uploaded: false },
    tax_id_ssn: { uploaded: false },
    bank_statement: { uploaded: false },
    business_license: { uploaded: false },
  })
  const [onboardingQbInfo, setOnboardingQbInfo] = useState({ companyName: '', email: '', accessNotes: '' })
  const [onboardingSelectedPlan, setOnboardingSelectedPlan] = useState<PlanId | null>(null)

  const mockReports = MOCK_REPORTS

  const DOCUMENT_TYPES: Record<string, { label: string; description: string }> = {
    engagement_letter: { label: 'Signed Engagement Letter', description: 'Please sign and upload the engagement letter that was sent to you via email' },
    tax_id_ein: { label: 'Tax ID (EIN)', description: 'Employer Identification Number for your business' },
    tax_id_ssn: { label: 'Tax ID (SSN)', description: 'Social Security Number (if sole proprietor)' },
    bank_statement: { label: 'Bank Statement', description: 'Most recent bank statement' },
    business_license: { label: 'Business License', description: 'Current business license or registration' },
  }

  // Document types array for onboarding (matching real onboarding structure)
  const ONBOARDING_DOCUMENT_TYPES = [
    {
      type: 'engagement_letter',
      label: 'Signed Engagement Letter',
      description: 'Please sign and upload the engagement letter that was sent to you via email',
      required: true,
    },
    {
      type: 'tax_id_ein',
      label: 'Tax ID (EIN)',
      description: 'Employer Identification Number for your business',
      required: true,
    },
    {
      type: 'tax_id_ssn',
      label: 'Tax ID (SSN)',
      description: 'Social Security Number (if sole proprietor)',
      required: true,
    },
    {
      type: 'bank_statement',
      label: 'Bank Statement',
      description: 'Most recent bank statement',
      required: true,
    },
    {
      type: 'business_license',
      label: 'Business License',
      description: 'Current business license or registration',
      required: true,
    },
  ]

  // Mock required documents
  const mockRequiredDocuments = [
    {
      id: '1',
      document_type: 'engagement_letter',
      document_id: 'doc-1',
      status: 'uploaded',
      is_required: true,
      document: {
        id: 'doc-1',
        name: 'engagement_letter_signed.pdf',
        file_path: 'demo/engagement_letter_signed.pdf',
        created_at: '2026-01-15T10:00:00Z',
      },
    },
    {
      id: '2',
      document_type: 'tax_id_ein',
      document_id: 'doc-2',
      status: 'verified',
      is_required: true,
      document: {
        id: 'doc-2',
        name: 'EIN_Certificate.pdf',
        file_path: 'demo/ein_certificate.pdf',
        created_at: '2026-01-10T10:00:00Z',
      },
    },
    {
      id: '3',
      document_type: 'tax_id_ssn',
      document_id: null,
      status: 'pending',
      is_required: true,
      document: null,
    },
    {
      id: '4',
      document_type: 'bank_statement',
      document_id: 'doc-3',
      status: 'uploaded',
      is_required: true,
      document: {
        id: 'doc-3',
        name: 'Bank_Statement_Dec_2025.pdf',
        file_path: 'demo/bank_statement_dec_2025.pdf',
        created_at: '2026-01-10T10:00:00Z',
      },
    },
    {
      id: '5',
      document_type: 'business_license',
      document_id: null,
      status: 'pending',
      is_required: true,
      document: null,
    },
  ]

  // Mock other documents
  const mockOtherDocuments = [
    {
      id: 'other-1',
      name: 'Invoice_001.pdf',
      file_path: 'demo/invoice_001.pdf',
      file_type: 'invoice',
      created_at: '2026-01-20T10:00:00Z',
      status: 'processed',
      document_category: 'ad_hoc',
    },
    {
      id: 'other-2',
      name: 'Receipt_Jan_15.pdf',
      file_path: 'demo/receipt_jan_15.pdf',
      file_type: 'receipt',
      created_at: '2026-01-18T10:00:00Z',
      status: 'pending',
      document_category: 'ad_hoc',
    },
  ]

  // Mock messages grouped by thread (matching real portal structure)
  const mockThreads: Record<string, Array<{
    id: string
    subject: string
    message: string
    read: boolean
    created_at: string
    sender_id: string
    sender: { email: string; isAdmin: boolean }
  }>> = {
    'thread-1': [
      {
        id: '1',
        subject: 'Q1 financial review scheduled',
        message: 'Hi! I\'ve scheduled our Q1 financial review call for next week. Please check your calendar.',
        read: false,
        created_at: '2026-01-15T10:00:00Z',
        sender_id: 'admin-1',
        sender: { email: 'david@ramirezaccountingny.com', isAdmin: true },
      },
    ],
    'thread-2': [
      {
        id: '2',
        subject: 'January reports are ready',
        message: 'Your January financial reports have been uploaded and are ready for review. You can download them from the Reports section.',
        read: false,
        created_at: '2026-01-28T14:30:00Z',
        sender_id: 'admin-1',
        sender: { email: 'david@ramirezaccountingny.com', isAdmin: true },
      },
    ],
  }
  
  const mockMessages = Object.entries(mockThreads).map(([threadId, messages]) => ({
    threadId,
    messages,
  }))

  const handleFileUpload = () => {
    setUploadedFile('business_license.pdf')
    setShowUploadSuccess(true)
    setTimeout(() => {
      setShowUploadSuccess(false)
    }, 3000)
  }

  const navItems = [
    { id: 'onboarding' as TabType, label: 'Onboarding', icon: Upload },
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
    { id: 'documents' as TabType, label: 'Documents', icon: FileText },
    { id: 'messages' as TabType, label: 'Messages', icon: MessageSquare },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ]

  // Calculate report counts
  const reportCounts = {
    profit_loss: mockReports.filter(r => r.type === 'profit_loss').length,
    balance_sheet: mockReports.filter(r => r.type === 'balance_sheet').length,
    reconciliation: mockReports.filter(r => r.type === 'reconciliation').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span className="font-medium">Interactive Demo - Explore the Client Portal</span>
          </div>
          <Link
            href="/"
            className="text-white/90 hover:text-white underline"
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-[41px] left-0 z-30 h-[calc(100vh-41px)] w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary-700">Ramirez Accounting</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`flex items-center w-full px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600' : ''
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <Link
            href="/"
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Exit Demo
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 pt-[41px]">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm text-gray-600">demo@example.com</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  Welcome back, Demo Client!
                </h1>

                {/* Recent Reports */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Recent Reports
                    </h2>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {mockReports.slice(0, 2).map((report) => {
                      const typeConfig = REPORT_TYPES[report.type]
                      const Icon = typeConfig.icon
                      return (
                        <div
                          key={report.id}
                          className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                          onClick={() => setActiveTab('reports')}
                        >
                          <div className={`p-2 rounded-lg ${typeConfig.color} mr-3`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{report.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('messages')}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                      <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Send Message</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Update Documents</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
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
                        className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 transition-all"
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

                {/* Reports List */}
                <div className="space-y-4">
                  {mockReports.map((report) => {
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
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              className="px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg flex items-center text-sm font-medium"
                              title="View Report (Demo - placeholder)"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                            <button
                              className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center text-sm font-medium"
                              title="Download Report (Demo - placeholder)"
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
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setDocumentsTab('required')}
                      className={`px-6 py-3 font-medium text-sm ${
                        documentsTab === 'required'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Required Documents
                      {mockRequiredDocuments.filter(d => d.is_required).length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                          {mockRequiredDocuments.filter(d => d.is_required && (d.status === 'uploaded' || d.status === 'verified')).length}/{mockRequiredDocuments.filter(d => d.is_required).length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setDocumentsTab('other')}
                      className={`px-6 py-3 font-medium text-sm ${
                        documentsTab === 'other'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Other Documents ({mockOtherDocuments.length})
                    </button>
                    <button
                      onClick={() => setDocumentsTab('quickbooks')}
                      className={`px-6 py-3 font-medium text-sm ${
                        documentsTab === 'quickbooks'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      QuickBooks Settings
                    </button>
                  </div>
                </div>

                {/* Required Documents Tab */}
                {documentsTab === 'required' && (
                  <div className="space-y-4">
                    {mockRequiredDocuments.map((doc) => {
                      const docType = DOCUMENT_TYPES[doc.document_type] || {
                        label: doc.document_type,
                        description: '',
                      }
                      const isUploaded = doc.status === 'uploaded' || doc.status === 'verified'
                      const document = doc.document

                      return (
                        <div
                          key={doc.id}
                          className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                <h3 className="font-semibold text-gray-900">
                                  {docType.label}
                                  {doc.is_required && <span className="text-red-500 ml-1">*</span>}
                                </h3>
                                {isUploaded && <CheckCircle className="h-5 w-5 text-green-600 ml-2" />}
                                {!isUploaded && doc.is_required && (
                                  <XCircle className="h-5 w-5 text-red-500 ml-2" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{docType.description}</p>

                              {isUploaded && document ? (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-green-800 font-medium flex-1">
                                      {document.name}
                                    </span>
                                    <span className="text-xs text-green-600">
                                      {new Date(document.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      className="px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg border border-primary-200 flex items-center text-sm"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </button>
                                    <label className="px-3 py-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg border border-orange-200 flex items-center text-sm cursor-pointer">
                                      <Upload className="h-4 w-4 mr-2" />
                                      Replace
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={() => {
                                          alert('Demo: File replacement would happen here')
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <label className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Document
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={() => {
                                      alert('Demo: File upload would happen here')
                                    }}
                                    accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.doc,.docx"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Other Documents Tab */}
                {documentsTab === 'other' && (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>Other Documents:</strong> Upload monthly statements, receipts, invoices, or any other financial documents your accountant needs.
                      </p>
                    </div>
                    {mockOtherDocuments.length === 0 ? (
                      <div className="bg-white rounded-lg shadow p-12 text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No other documents yet</h3>
                        <p className="text-gray-500 mb-4">Upload monthly statements, receipts, or other financial documents as needed.</p>
                        <label className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer">
                          <Upload className="h-5 w-5 mr-2" />
                          Upload Document
                          <input
                            type="file"
                            className="hidden"
                            onChange={() => {
                              alert('Demo: File upload would happen here')
                            }}
                            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.doc,.docx"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Uploaded
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {mockOtherDocuments.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                      <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{doc.file_type}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {new Date(doc.created_at).toLocaleDateString()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                      <button
                                        className="text-primary-600 hover:text-primary-900"
                                        title="View document"
                                      >
                                        <Eye className="h-5 w-5" />
                                      </button>
                                      <button
                                        className="text-red-600 hover:text-red-900"
                                        title="Permanently delete this document"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* QuickBooks Settings Tab */}
                {documentsTab === 'quickbooks' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">QuickBooks Information</h2>
                    <p className="text-gray-600 mb-6">
                      Update your QuickBooks information so your accountant can connect to your account.
                    </p>

                    <div className="space-y-4 max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          QuickBooks Company Name *
                        </label>
                        <input
                          type="text"
                          value={qbInfo.companyName}
                          onChange={(e) => setQbInfo({ ...qbInfo, companyName: e.target.value })}
                          placeholder="Your company name in QuickBooks"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          QuickBooks Email *
                        </label>
                        <input
                          type="email"
                          value={qbInfo.email}
                          onChange={(e) => setQbInfo({ ...qbInfo, email: e.target.value })}
                          placeholder="Email associated with your QuickBooks account"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Your accountant will send an invite to this email.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Notes
                        </label>
                        <textarea
                          value={qbInfo.accessNotes}
                          onChange={(e) => setQbInfo({ ...qbInfo, accessNotes: e.target.value })}
                          placeholder="Any additional information about your QuickBooks setup"
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setQbSaved(true)
                          setTimeout(() => setQbSaved(false), 3000)
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          qbSaved
                            ? 'bg-green-600 text-white'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {qbSaved ? '✓ Saved!' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Don&apos;t have QuickBooks?</strong> Enter &quot;N/A&quot; in the fields and let your accountant know in the notes. They can help you set it up.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="flex h-[calc(100vh-200px)] gap-4">
                {/* Thread List Sidebar */}
                <div className="w-80 bg-white rounded-lg shadow overflow-hidden flex flex-col">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center mb-4">
                      <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                      <button
                        onClick={() => setShowNewMessage(true)}
                        className="bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 text-sm flex items-center gap-1"
                      >
                        <Send className="h-4 w-4" />
                        New
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {mockMessages.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No messages yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {mockMessages.map(({ threadId, messages }) => {
                          const firstMessage = messages[0]
                          const lastMessage = messages[messages.length - 1]
                          const unreadCount = messages.filter(m => !m.read && m.sender.isAdmin).length
                          const isSelected = threadId === selectedThread
                          
                          return (
                            <button
                              key={threadId}
                              onClick={() => setSelectedThread(threadId)}
                              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">
                                  {firstMessage.subject}
                                </h3>
                                {unreadCount > 0 && (
                                  <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-1">
                                {lastMessage.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(lastMessage.created_at).toLocaleDateString()}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Thread View */}
                <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
                  {showNewMessage ? (
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">New Message</h2>
                        <button
                          onClick={() => {
                            setShowNewMessage(false)
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                      <form className="flex-1 flex flex-col">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                            placeholder="Enter subject"
                          />
                        </div>
                        <div className="flex-1 mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message
                          </label>
                          <textarea
                            required
                            rows={10}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                            placeholder="Type your message..."
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                        >
                          Send Message
                        </button>
                      </form>
                    </div>
                  ) : selectedThread && mockThreads[selectedThread] ? (
                    <>
                      {/* Thread Header */}
                      <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">{mockThreads[selectedThread][0].subject}</h2>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {mockThreads[selectedThread].map((msg) => {
                          const isFromMe = false // Demo: showing admin messages
                          const isAdmin = msg.sender.isAdmin
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  isFromMe
                                    ? 'bg-primary-600 text-white'
                                    : isAdmin
                                    ? 'bg-gray-200 text-gray-900'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold ${
                                    isFromMe ? 'text-white/90' : 'text-gray-600'
                                  }`}>
                                    {isFromMe ? 'You' : isAdmin ? 'David Ramirez' : msg.sender.email}
                                  </span>
                                  <span className={`text-xs ${
                                    isFromMe ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className={`whitespace-pre-wrap ${
                                  isFromMe ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Reply Input */}
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <textarea
                            placeholder="Type your reply..."
                            rows={2}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                          />
                          <button
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
                          >
                            <Send className="h-5 w-5" />
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Select a conversation or start a new message
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                  <p className="text-gray-600 mt-1">Manage your account and subscription</p>
                </div>

                <div className="grid gap-6">
                  {/* Profile Information */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Profile Information
                      </h2>
                      <button className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Name</label>
                        <p className="text-gray-900">Demo Client</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          demo@example.com
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          (555) 123-4567
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Company</label>
                        <p className="text-gray-900 flex items-center">
                          <Building className="h-4 w-4 mr-1 text-gray-400" />
                          Demo Business LLC
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Member Since</label>
                        <p className="text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date().toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security / Password */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Security
                      </h2>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-3">Change your account password</p>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Subscription
                    </h2>

                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">Growth Plan</h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Active
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-primary-600">
                          $325<span className="text-base font-normal text-gray-500">/month</span>
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Plan Features:</h4>
                      <ul className="space-y-1">
                        <li className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Monthly bookkeeping (up to 150 transactions)
                        </li>
                        <li className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Bank & credit card reconciliation (up to 3 accounts)
                        </li>
                        <li className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Monthly Profit & Loss & Balance Sheet
                        </li>
                        <li className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Quarterly financial review call (30 minutes)
                        </li>
                        <li className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Secure client portal access
                        </li>
                        <li className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Priority email support (24-hour response time)
                        </li>
                      </ul>
                    </div>

                    <button className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center font-medium">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Manage Subscription & Billing
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                      You can update your payment method, view billing history, or cancel your subscription through the Stripe billing portal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Onboarding Tab */}
            {activeTab === 'onboarding' && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Ramirez Accounting</h1>
                  <p className="text-lg text-gray-600">
                    Let&apos;s get you set up. This will only take a few minutes.
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                  <div className="relative flex items-start justify-between">
                    {/* Connecting lines */}
                    <div className="absolute top-6 left-0 right-0 flex items-center px-6">
                      <div className="flex-1 h-1.5 mx-2 rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            onboardingStep > 1 ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                          style={{ width: onboardingStep > 1 ? '100%' : '0%' }}
                        />
                      </div>
                      <div className="flex-1 h-1.5 mx-2 rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            onboardingStep > 2 ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                          style={{ width: onboardingStep > 2 ? '100%' : '0%' }}
                        />
                      </div>
                      <div className="flex-1 h-1.5 mx-2 rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            onboardingStep > 3 ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                          style={{ width: onboardingStep > 3 ? '100%' : '0%' }}
                        />
                      </div>
                    </div>

                    {/* Step indicators */}
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="relative flex flex-col items-center flex-1 z-10">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300 ${
                            step < onboardingStep
                              ? 'bg-green-500 text-white shadow-lg scale-110'
                              : step === onboardingStep
                              ? 'bg-primary-600 text-white shadow-lg scale-110 ring-4 ring-primary-200'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {step < onboardingStep ? <CheckCircle className="h-7 w-7" /> : step}
                        </div>
                        <span
                          className={`mt-3 text-sm font-medium text-center ${
                            step <= onboardingStep ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {step === 1 ? 'Documents' : step === 2 ? 'QuickBooks' : step === 3 ? 'Plan' : 'Review'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-6 mb-8 shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Your Data is Secure</h3>
                      <p className="text-sm text-gray-700">
                        All documents are encrypted with AES-256 encryption (same standard used by banks) and stored
                        securely with SOC 2 Type 2 compliance. Your information is protected with enterprise-grade security.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow p-8">
                  {/* Step 1: Documents */}
                  {onboardingStep === 1 && (
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">Required Documents</h2>
                      <p className="text-lg text-gray-600 mb-6">
                        Upload your required documents below. All documents are required to proceed.
                      </p>

                      {/* Progress Bar */}
                      {(() => {
                        const uploadedCount = Object.values(onboardingDocs).filter(d => d.uploaded).length
                        const totalCount = Object.keys(onboardingDocs).length
                        const progress = (uploadedCount / totalCount) * 100
                        return (
                          <>
                            <div className="bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mb-6">
                              <span className="font-medium">
                                {uploadedCount} of {totalCount} required documents uploaded
                              </span>
                              <span className="font-semibold text-primary-600">{Math.round(progress)}%</span>
                            </div>
                          </>
                        )
                      })()}

                      <div className="space-y-3">
                        {ONBOARDING_DOCUMENT_TYPES.map((docType) => {
                          const doc = onboardingDocs[docType.type]
                          const isUploaded = doc?.uploaded || false
                          return (
                            <div
                              key={docType.type}
                              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                    <h3 className="font-semibold text-gray-900">
                                      {docType.label}
                                      {docType.required && <span className="text-red-500 ml-1">*</span>}
                                    </h3>
                                    {isUploaded && <CheckCircle className="h-5 w-5 text-green-600 ml-2" />}
                                    {!isUploaded && <XCircle className="h-5 w-5 text-red-500 ml-2" />}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{docType.description}</p>
                                  {isUploaded && doc?.name && (
                                    <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                      <span className="text-sm text-green-800 font-medium flex-1">{doc.name}</span>
                                    </div>
                                  )}
                                  <label className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {isUploaded ? 'Replace Document' : 'Upload Document'}
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          setOnboardingDocs(prev => ({
                                            ...prev,
                                            [docType.type]: { uploaded: true, name: file.name }
                                          }))
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: QuickBooks */}
                  {onboardingStep === 2 && (
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">QuickBooks Information</h2>
                      <p className="text-lg text-gray-600 mb-6">
                        Update your QuickBooks information so your accountant can connect to your account.
                      </p>

                      <div className="space-y-4 max-w-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            QuickBooks Company Name *
                          </label>
                          <input
                            type="text"
                            value={onboardingQbInfo.companyName}
                            onChange={(e) => setOnboardingQbInfo({ ...onboardingQbInfo, companyName: e.target.value })}
                            placeholder="Your company name in QuickBooks"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            QuickBooks Email *
                          </label>
                          <input
                            type="email"
                            value={onboardingQbInfo.email}
                            onChange={(e) => setOnboardingQbInfo({ ...onboardingQbInfo, email: e.target.value })}
                            placeholder="Email associated with your QuickBooks account"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Your accountant will send an invite to this email.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes
                          </label>
                          <textarea
                            value={onboardingQbInfo.accessNotes}
                            onChange={(e) => setOnboardingQbInfo({ ...onboardingQbInfo, accessNotes: e.target.value })}
                            placeholder="Any additional information about your QuickBooks setup"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Don&apos;t have QuickBooks?</strong> Enter &quot;N/A&quot; in the fields and let your accountant know in the notes. They can help you set it up.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Plan Selection */}
                  {onboardingStep === 3 && (
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">Select Your Plan</h2>
                      <p className="text-lg text-gray-600 mb-6">
                        Choose the plan that best fits your business needs.
                      </p>

                      <div className="grid md:grid-cols-3 gap-6">
                        {Object.entries(PRICING_PLANS).map(([planId, plan]) => (
                          <div
                            key={planId}
                            onClick={() => setOnboardingSelectedPlan(planId as PlanId)}
                            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                              onboardingSelectedPlan === planId
                                ? 'border-primary-600 bg-primary-50 shadow-lg'
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            {(plan as any).isPopular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                  Most Popular
                                </span>
                              </div>
                            )}
                            <div className="text-center mb-4">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                              <p className="text-3xl font-bold text-primary-600">
                                ${(plan.price / 100).toLocaleString()}
                                <span className="text-base font-normal text-gray-500">/month</span>
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 text-center">{plan.description}</p>
                            <ul className="space-y-2 mb-4">
                              {plan.features.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="flex items-start text-sm text-gray-600">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            <div className="text-center">
                              <span className="text-xs text-gray-500">{plan.bestFor}</span>
                            </div>
                            {onboardingSelectedPlan === planId && (
                              <div className="mt-4 text-center">
                                <CheckCircle className="h-6 w-6 text-primary-600 mx-auto" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {onboardingStep === 4 && (
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">Review & Complete</h2>
                      <p className="text-lg text-gray-600 mb-6">
                        Please review your information before completing onboarding.
                      </p>

                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="font-semibold text-gray-900 mb-4">Documents Uploaded</h3>
                          <div className="space-y-2">
                            {Object.entries(onboardingDocs).map(([type, doc]) => {
                              const docType = ONBOARDING_DOCUMENT_TYPES.find(dt => dt.type === type)
                              return (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700">{docType?.label}</span>
                                  {doc.uploaded ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {onboardingQbInfo.companyName && (
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">QuickBooks Information</h3>
                            <div className="space-y-2 text-sm">
                              <p><strong>Company:</strong> {onboardingQbInfo.companyName}</p>
                              <p><strong>Email:</strong> {onboardingQbInfo.email}</p>
                              {onboardingQbInfo.accessNotes && (
                                <p><strong>Notes:</strong> {onboardingQbInfo.accessNotes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {onboardingSelectedPlan && (
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Selected Plan</h3>
                            <p className="text-lg font-bold text-primary-600">
                              {PRICING_PLANS[onboardingSelectedPlan].name} - ${(PRICING_PLANS[onboardingSelectedPlan].price / 100).toLocaleString()}/month
                            </p>
                          </div>
                        )}

                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                          <div className="flex items-center">
                            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                            <div>
                              <h4 className="font-semibold text-green-900 mb-1">Ready to Complete</h4>
                              <p className="text-sm text-green-700">
                                Click the button below to complete your onboarding. You&apos;ll be redirected to your dashboard.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-8 pt-6 border-t">
                    <button
                      onClick={() => setOnboardingStep(Math.max(1, onboardingStep - 1))}
                      disabled={onboardingStep === 1}
                      className="px-6 py-2 border-2 border-gray-400 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 flex items-center font-semibold"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (onboardingStep < 4) {
                          setOnboardingStep(onboardingStep + 1)
                        } else {
                          alert('Demo: Onboarding would be completed here! You would be redirected to your dashboard.')
                        }
                      }}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center font-semibold"
                    >
                      {onboardingStep === 4 ? 'Complete Onboarding' : 'Next'}
                      {onboardingStep < 4 && <ArrowRight className="h-4 w-4 ml-2" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-center text-white">
              <h2 className="text-3xl font-bold mb-3">Ready to Get Started?</h2>
              <p className="text-lg text-primary-100 mb-6 max-w-2xl mx-auto">
                Experience the full power of our client portal. Schedule a free discovery call to get your invite code and start your onboarding process.
              </p>
              <Link
                href="/#contact"
                className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Schedule Discovery Call
              </Link>
            </div>
          </main>
        </div>
    </div>
  )
}
