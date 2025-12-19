'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Copy, Check, Trash2, Clock, CheckCircle, XCircle, Mail, Send } from 'lucide-react'

interface InviteCode {
  id: string
  code: string
  email: string | null
  client_name: string | null
  notes: string | null
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
  })

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
      
      const response = await fetch('/api/invite-codes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: user?.id,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      setCodes([result.invite_code, ...codes])
      setShowForm(false)
      setFormData({ client_name: '', email: '', notes: '', expires_days: 7 })
    } catch (err: any) {
      console.error('Error creating invite code:', err)
      alert(err.message || 'Failed to create invite code')
    } finally {
      setCreating(false)
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

