'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Archive, Search, Calendar, FileText, DollarSign, Eye } from 'lucide-react'

interface ArchivedClient {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  archived_at: string
  delete_after_date: string
  created_at: string
}

export default function ArchivedClientsPage() {
  const [clients, setClients] = useState<ArchivedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadArchivedClients()
  }, [])

  const loadArchivedClients = async () => {
    try {
      const { data, error } = await supabase
        .from('archived_clients')
        .select('*')
        .order('archived_at', { ascending: false })

      if (error) {
        console.error('Error loading archived clients:', error)
        setClients([])
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error('Error loading archived clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDaysUntilDeletion = (deleteDate: string) => {
    const deleteAfter = new Date(deleteDate)
    const now = new Date()
    const diffTime = deleteAfter.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return <div className="text-center py-12">Loading archived clients...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archived Clients</h1>
          <p className="text-gray-600 mt-2">
            Clients archived for legal retention (7 years). Data will be automatically deleted after retention period.
          </p>
        </div>
        <Link
          href="/admin/clients"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Active Clients
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Archived Clients</h3>
          <p className="text-gray-500">Archived clients will appear here.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search archived clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
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
                      Archived Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deletes After
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const daysUntilDeletion = getDaysUntilDeletion(client.delete_after_date)
                    const isExpiringSoon = daysUntilDeletion < 365 // Less than 1 year
                    const isExpired = daysUntilDeletion < 0

                    return (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{client.company_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(client.archived_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {isExpired ? (
                              <span className="text-red-600 font-medium">Expired - Ready for deletion</span>
                            ) : isExpiringSoon ? (
                              <span className="text-orange-600">
                                {daysUntilDeletion} days
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                {new Date(client.delete_after_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/clients/archived/${client.id}`}
                            className="text-primary-600 hover:text-primary-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Data Retention Policy</h4>
                <p className="text-sm text-blue-800">
                  Archived clients are retained for 7 years per legal requirements. Data will be automatically 
                  deleted after the retention period expires. You can view archived documents and invoices 
                  by clicking &quot;View Details&quot; on any archived client.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

