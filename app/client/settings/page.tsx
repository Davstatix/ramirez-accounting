'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  CreditCard,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Package,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  created_at: string
  subscription_plan: string | null
  subscription_status: string | null
  stripe_customer_id: string | null
  authEmail?: string // The actual auth email
}

export default function SettingsPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadClient()
  }, [])

  const loadClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      // Use the auth email (the real login email)
      setClient({ ...data, authEmail: user.email })
    } catch (err) {
      console.error('Error loading client:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = () => {
    if (client) {
      setEditForm({
        name: client.name,
        phone: client.phone || '',
      })
      setEditing(true)
    }
  }

  const handleSaveProfile = async () => {
    if (!client) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editForm.name,
          phone: editForm.phone || null,
        })
        .eq('id', client.id)

      if (error) throw error

      setClient({ ...client, name: editForm.name, phone: editForm.phone || null })
      setEditing(false)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      alert('Failed to save profile: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) throw error

      alert('Password updated successfully!')
      setChangingPassword(false)
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      console.error('Error changing password:', err)
      alert('Failed to change password: ' + err.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!client) return

    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      window.location.href = data.url
    } catch (err: any) {
      console.error('Error opening portal:', err)
      alert(err.message || 'Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Active
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            Past Due
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            No Subscription
          </span>
        )
    }
  }

  const getPlanDetails = (planId: string | null) => {
    if (!planId || !PRICING_PLANS[planId as PlanId]) {
      return null
    }
    return PRICING_PLANS[planId as PlanId]
  }

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>
  }

  if (!client) {
    return <div className="text-center py-12">Client not found</div>
  }

  const planDetails = getPlanDetails(client.subscription_plan)

  return (
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
            {!editing && (
              <button
                onClick={handleEditProfile}
                className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{client.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-1 text-gray-400" />
                  {client.authEmail || client.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                  {client.phone || 'Not provided'}
                </p>
              </div>
              {client.company_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Company</label>
                  <p className="text-gray-900 flex items-center">
                    <Building className="h-4 w-4 mr-1 text-gray-400" />
                    {client.company_name}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {new Date(client.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security / Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Security
            </h2>
          </div>

          {changingPassword ? (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  {passwordSaving ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  onClick={() => {
                    setChangingPassword(false)
                    setPasswordForm({ newPassword: '', confirmPassword: '' })
                  }}
                  disabled={passwordSaving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">Change your account password</p>
              <button
                onClick={() => setChangingPassword(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Change Password
              </button>
            </div>
          )}
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
                <h3 className="text-xl font-bold text-gray-900">
                  {planDetails ? `${planDetails.name} Plan` : 'No Plan'}
                </h3>
                {getStatusBadge(client.subscription_status)}
              </div>
              {planDetails && (
                <p className="text-2xl font-bold text-primary-600">
                  ${(planDetails.price / 100).toLocaleString()}<span className="text-base font-normal text-gray-500">/month</span>
                </p>
              )}
            </div>
          </div>

          {planDetails && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Plan Features:</h4>
              <ul className="space-y-1">
                {planDetails.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {client.subscription_status && 
           client.subscription_status !== 'none' && 
           client.subscription_plan &&
           client.stripe_customer_id ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {portalLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Manage Subscription & Billing
                  <ExternalLink className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="text-gray-700 font-medium mb-2">
                  {client.stripe_customer_id 
                    ? 'Subscription status not found in our system.'
                    : 'No subscription found.'}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  If you recently completed payment, click the button below to sync your subscription from Stripe.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!client) return
                  setPortalLoading(true)
                  try {
                    const response = await fetch('/api/stripe/sync-subscription', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ clientId: client.id }),
                    })
                    const data = await response.json()
                    if (response.ok) {
                      alert('Subscription synced successfully! Refreshing...')
                      await loadClient() // Reload client data
                    } else {
                      alert(`Failed to sync: ${data.error || 'Unknown error'}`)
                    }
                  } catch (err: any) {
                    alert(`Error: ${err.message}`)
                  } finally {
                    setPortalLoading(false)
                  }
                }}
                disabled={portalLoading}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-base font-semibold flex items-center justify-center shadow-md"
              >
                {portalLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing Subscription...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Sync Subscription from Stripe
                  </>
                )}
              </button>
            </div>
          )}

          {client.subscription_status && 
           client.subscription_status !== 'none' && 
           client.subscription_plan &&
           client.stripe_customer_id && (
            <p className="text-xs text-gray-500 mt-4">
              You can update your payment method, view billing history, or cancel your subscription through the Stripe billing portal.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

