'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Copy, Check, Trash2, Clock, CheckCircle, XCircle, Mail, Send, Upload, FileText, X, Eye } from 'lucide-react'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

interface InviteCode {
  id: string
  code: string
  email: string | null
  client_name: string | null
  notes: string | null
  recommended_plan: string | null
  engagement_letter_path: string | null
  bypass_payment: boolean
  trial_days: number | null
  used: boolean
  used_at: string | null
  expires_at: string
  created_at: string
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    notes: '',
    expires_days: 7,
    recommended_plan: '' as PlanId | '',
    bypass_payment: false,
    trial_days: null as number | null,
  })
  const [engagementLetter, setEngagementLetter] = useState<File | null>(null)
  const [uploadingLetter, setUploadingLetter] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadCodes()
  }, [])

  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCodes(data || [])
    } catch (err) {
      console.error('Error loading invite codes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const formDataToSend = new FormData()
      formDataToSend.append('client_name', formData.client_name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('notes', formData.notes)
      formDataToSend.append('expires_days', formData.expires_days.toString())
      formDataToSend.append('recommended_plan', formData.recommended_plan)
      formDataToSend.append('bypass_payment', formData.bypass_payment.toString())
      if (formData.trial_days !== null) {
        formDataToSend.append('trial_days', formData.trial_days.toString())
      }
      formDataToSend.append('created_by', user?.id || '')
      if (engagementLetter) {
        formDataToSend.append('engagement_letter', engagementLetter)
      }
      
      const response = await fetch('/api/invite-codes/create', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

          setCodes([result.invite_code, ...codes])
          setShowForm(false)
          setFormData({ client_name: '', email: '', notes: '', expires_days: 7, recommended_plan: '', bypass_payment: false, trial_days: null })
          setEngagementLetter(null)
      
      // Show feedback about email sending
      if (formData.email) {
        if (result.email_sent) {
          alert(`✅ Invite code created and email sent to ${formData.email}`)
        } else if (result.email_error) {
          alert(`⚠️ Invite code created, but email failed to send: ${result.email_error}\n\nYou can manually send the email using the "Send Email" button.`)
        } else {
          alert(`✅ Invite code created. Email sending status unknown.`)
        }
      } else {
        alert('✅ Invite code created successfully!')
      }
    } catch (err: any) {
      console.error('Error creating invite code:', err)
      alert(err.message || 'Failed to create invite code')
    } finally {
      setCreating(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        setEngagementLetter(file)
      } else {
        alert('Please upload a PDF file')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        setEngagementLetter(file)
      } else {
        alert('Please upload a PDF file')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite code?')) return

    try {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCodes(codes.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error deleting invite code:', err)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const sendEmail = async (code: InviteCode) => {
    if (!code.email) {
      alert('No email address associated with this invite code')
      return
    }

    try {
      const response = await fetch('/api/invite-codes/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: code.email,
          client_name: code.client_name,
          code: code.code,
          expires_at: code.expires_at,
          invite_code_id: code.id, // Pass ID to fetch recommended plan
        }),
      })

      if (!response.ok) throw new Error('Failed to send email')
      alert(`Invite code sent to ${code.email}`)
    } catch (err) {
      console.error('Error sending email:', err)
      alert('Failed to send email')
    }
  }

  const getStatus = (code: InviteCode) => {
    if (code.used) return { label: 'Used', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    if (new Date(code.expires_at) < new Date()) return { label: 'Expired', color: 'bg-red-100 text-red-800', icon: XCircle }
    return { label: 'Active', color: 'bg-green-100 text-green-800', icon: Clock }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invite Codes</h1>
          <p className="text-gray-600 mt-1">Generate codes for clients after discovery calls</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Generate Code
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Invite Code</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="client@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">If set, only this email can use the code</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                rows={2}
                placeholder="Notes from discovery call..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommended Plan
                </label>
                <select
                  value={formData.recommended_plan}
                  onChange={(e) => setFormData({ ...formData, recommended_plan: e.target.value as PlanId | '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Select a plan (optional)</option>
                  {Object.entries(PRICING_PLANS)
                    .filter(([planId]) => planId !== 'test')
                    .map(([planId, plan]) => (
                    <option key={planId} value={planId}>
                      {plan.name} - ${(plan.price / 100).toLocaleString()}/month
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">The plan you discussed with the client</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires In
                </label>
                <select
                  value={formData.expires_days}
                  onChange={(e) => setFormData({ ...formData, expires_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engagement Letter (PDF)
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : engagementLetter
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                {engagementLetter ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{engagementLetter.name}</p>
                      <p className="text-sm text-gray-500">
                        {(engagementLetter.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = URL.createObjectURL(engagementLetter)
                          window.open(url, '_blank')
                          // Clean up the object URL after a delay
                          setTimeout(() => URL.revokeObjectURL(url), 100)
                        }}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-1"
                        title="View PDF"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEngagementLetter(null)}
                        className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="Remove file"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your engagement letter PDF here, or click to browse
                    </p>
                    <label className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 cursor-pointer text-sm font-medium">
                      Choose File
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PDF files only</p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The engagement letter will be attached to the invite email
              </p>
            </div>
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bypass_payment"
                  checked={formData.bypass_payment}
                  onChange={(e) => setFormData({ ...formData, bypass_payment: e.target.checked, trial_days: e.target.checked ? formData.trial_days : null })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="bypass_payment" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Bypass Payment (Free Account or Trial)
                </label>
              </div>
              {formData.bypass_payment && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Duration (optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.trial_days || ''}
                      onChange={(e) => setFormData({ ...formData, trial_days: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Leave empty for permanent free"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.trial_days 
                      ? `Client will get ${formData.trial_days} days free trial, then need to pay`
                      : 'Client will get permanent free access (no payment required)'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {creating ? 'Generating...' : 'Generate Code'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {codes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No invite codes yet. Generate one after a discovery call.
                </td>
              </tr>
            ) : (
              codes.map((code) => {
                const status = getStatus(code)
                const StatusIcon = status.icon
                return (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="bg-primary-100 text-primary-800 px-3 py-1 rounded font-mono text-lg font-bold">
                          {code.code}
                        </code>
                        {code.bypass_payment && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            code.trial_days 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {code.trial_days ? `${code.trial_days}d Trial` : 'Free'}
                          </span>
                        )}
                        <button
                          onClick={() => copyCode(code.code)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy code"
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{code.client_name || '-'}</p>
                        {code.email && (
                          <p className="text-sm text-gray-500">{code.email}</p>
                        )}
                        {code.notes && (
                          <p className="text-xs text-gray-400 mt-1">{code.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(code.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

