'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FileText, CheckCircle, XCircle, Eye } from 'lucide-react'

interface Document {
  id: string
  name: string
  file_path: string
  file_type: string
  created_at: string
  status: string
  client_id: string
  client: {
    name: string
    company_name: string | null
  }
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          clients:client_id (
            name,
            company_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedDocuments = (data || []).map((doc: any) => ({
        ...doc,
        client: doc.clients,
      }))

      setDocuments(transformedDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (docId: string, newStatus: string) => {
    try {
      // Get document info for email
      const doc = documents.find(d => d.id === docId)
      
      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus })
        .eq('id', docId)

      if (error) throw error

      // Send email notification for approval
      if (newStatus === 'processed' && doc) {
        fetch('/api/email/document-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: doc.client_id,
            documentName: doc.name,
            status: 'approved',
          }),
        }).catch(err => console.error('Failed to send email:', err))
      }

      loadDocuments()
    } catch (error) {
      console.error('Error updating document status:', error)
      alert('Failed to update document status')
    }
  }

  const handleReject = async (doc: Document) => {
    const reason = prompt('Enter rejection reason (this will be shown to the client):')
    if (!reason) return

    try {
      // Delete the document from storage
      if (doc.file_path) {
        await supabase.storage.from('documents').remove([doc.file_path])
      }

      // Delete the document record
      await supabase.from('documents').delete().eq('id', doc.id)

      // Update required_documents to pending so client can re-upload
      // Find the document type from the name
      const docTypes: Record<string, string> = {
        'Tax ID (EIN)': 'tax_id_ein',
        'Tax ID (SSN)': 'tax_id_ssn',
        'Bank Statement': 'bank_statement',
        'Business License': 'business_license',
      }
      
      const docType = Object.entries(docTypes).find(([name]) => 
        doc.name.toLowerCase().includes(name.toLowerCase())
      )?.[1]

      if (docType) {
        await supabase
          .from('required_documents')
          .update({ 
            status: 'pending',
            document_id: null
          })
          .eq('client_id', doc.client_id)
          .eq('document_type', docType)
      }

      // Send a message to the client about the rejection
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('messages').insert({
        client_id: doc.client_id,
        sender_id: user?.id,
        subject: `Document Rejected: ${doc.name}`,
        message: `Your document "${doc.name}" has been rejected.\n\nReason: ${reason}\n\nPlease go to Documents and upload a new version of this document.`,
        read: false,
      })

      // Send email notification
      fetch('/api/email/document-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: doc.client_id,
          documentName: doc.name,
          status: 'rejected',
          reason,
        }),
      }).catch(err => console.error('Failed to send email:', err))

      alert('Document rejected and removed. Client has been notified.')
      loadDocuments()
    } catch (error) {
      console.error('Error rejecting document:', error)
      alert('Failed to reject document')
    }
  }

  const handleView = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Error viewing document:', err)
      alert('Failed to open document')
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading documents...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Documents</h1>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500">Client documents will appear here once uploaded.</p>
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
                    Client
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
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.client?.name || 'N/A'}
                      </div>
                      {doc.client?.company_name && (
                        <div className="text-sm text-gray-500">{doc.client.company_name}</div>
                      )}
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
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(doc.status)}`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(doc.file_path)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(doc.id, 'processed')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(doc)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
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
  )
}
