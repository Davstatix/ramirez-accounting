'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Search, Trash2, Edit, FileText } from 'lucide-react'

interface Client {
  id: string
  user_id: string
  name: string
  email: string
  auth_email?: string
  phone: string | null
  company_name: string | null
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Fetch auth emails for all clients
      if (data && data.length > 0) {
        const userIds = data.map((c: any) => c.user_id).filter(Boolean)
        const response = await fetch('/api/clients/get-auth-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds }),
        })
        const { emails } = await response.json()
        
        // Merge auth emails into client data
        const clientsWithAuthEmails = data.map((client: any) => ({
          ...client,
          auth_email: emails?.[client.user_id] || client.email,
        }))
        setClients(clientsWithAuthEmails)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to archive ${clientName}? Their data will be archived for 7 years per legal requirements, then automatically deleted. Their login account will be removed immediately.`)) {
      return
    }

    try {
      // Get the user_id first
      const { data: client } = await supabase
        .from('clients')
        .select('user_id')
        .eq('id', clientId)
        .single()

      if (!client) {
        alert('Client not found')
        return
      }

      // Archive the client (moves data to archive tables)
      const archiveResponse = await fetch('/api/clients/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      })

      if (!archiveResponse.ok) {
        const errorData = await archiveResponse.json()
        throw new Error(errorData.error || 'Failed to archive client')
      }

      // Delete the auth user (requires service role, so we'll do it via API)
      const deleteResponse = await fetch('/api/clients/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: client.user_id }),
      })

      if (!deleteResponse.ok) {
        console.warn('Failed to delete auth user, but client was archived')
      }

      // Reload clients list
      loadClients()
      alert(`${clientName} has been archived. Data will be retained for 7 years per legal requirements.`)
    } catch (error: any) {
      console.error('Error archiving client:', error)
      alert(`Failed to archive client: ${error.message}`)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.auth_email || client.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Loading clients...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Active Clients</h1>
        <Link
          href="/admin/clients/archived"
          className="text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
        >
          <FileText className="h-5 w-5 mr-2" />
          View Archived
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {clients.length === 0
                      ? 'No clients yet. Add your first client to get started.'
                      : 'No clients found matching your search.'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.company_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.auth_email || client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(client.id, client.name)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Archive client (data retained for 7 years per legal requirements)"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

