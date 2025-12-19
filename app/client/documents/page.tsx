'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Upload, FileText, Trash2, CheckCircle, XCircle, Eye, X } from 'lucide-react'

interface Document {
  id: string
  name: string
  file_path: string
  file_type: string
  created_at: string
  status: string
  document_category?: string
}

interface RequiredDocument {
  id: string
  document_type: string
  document_id: string | null
  status: string
  is_required: boolean
  document?: {
    id: string
    name: string
    file_path: string
    created_at: string
  }
}

const DOCUMENT_TYPES: Record<string, { label: string; description: string }> = {
  tax_id_ein: { label: 'Tax ID (EIN)', description: 'Employer Identification Number for your business' },
  tax_id_ssn: { label: 'Tax ID (SSN)', description: 'Social Security Number (if sole proprietor)' },
  bank_statement: { label: 'Bank Statement', description: 'Most recent bank statement' },
  business_license: { label: 'Business License', description: 'Current business license or registration' },
  w9_form: { label: 'W-9 Form', description: 'Completed W-9 form for tax purposes' },
  voided_check: { label: 'Voided Check', description: 'Voided check for bank account verification' },
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'required' | 'other' | 'quickbooks'>('required')
  const [qbInfo, setQbInfo] = useState({ companyName: '', email: '', accessNotes: '' })
  const [qbSaving, setQbSaving] = useState(false)
  const [qbSaved, setQbSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase
        .from('clients')
        .select('id, onboarding_status, quickbooks_info')
        .eq('user_id', user.id)
        .single()

      if (!client) return

      setClientId(client.id)

      // Load QuickBooks info
      if (client.quickbooks_info) {
        try {
          const parsed = JSON.parse(client.quickbooks_info)
          setQbInfo({
            companyName: parsed.companyName || '',
            email: parsed.email || '',
            accessNotes: parsed.accessNotes || '',
          })
        } catch (e) {
          console.error('Error parsing quickbooks_info:', e)
        }
      }

      // Load all documents
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (docsError) console.error('Error loading documents:', docsError)
      if (docs) setDocuments(docs)

      // Load required documents
      const { data: reqDocs, error: reqDocsError } = await supabase
        .from('required_documents')
        .select(`
          *,
          document:documents!document_id (
            id,
            name,
            file_path,
            created_at
          )
        `)
        .eq('client_id', client.id)
        .order('is_required', { ascending: false })

      if (reqDocsError) console.error('Error loading required docs:', reqDocsError)
      if (reqDocs) {
        // If join failed, fetch documents separately
        const docIds = reqDocs
          .map(d => d.document_id)
          .filter((id): id is string => id !== null)
        
        if (docIds.length > 0 && (!reqDocs[0]?.document)) {
          const { data: docsData } = await supabase
            .from('documents')
            .select('id, name, file_path, created_at')
            .in('id', docIds)
          
          if (docsData) {
            const docsMap = docsData.reduce((acc, doc) => {
              acc[doc.id] = doc
              return acc
            }, {} as Record<string, any>)
            
            setRequiredDocs(reqDocs.map(rd => ({
              ...rd,
              document: rd.document_id ? docsMap[rd.document_id] || null : null,
            })))
          } else {
            setRequiredDocs(reqDocs)
          }
        } else {
          setRequiredDocs(reqDocs)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!clientId) return

    setUploading(documentType)

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${clientId}/onboarding/${documentType}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          name: file.name,
          file_path: filePath,
          file_type: documentType,
          status: 'pending',
          document_category: 'onboarding',
        })
        .select()
        .single()

      if (docError) throw docError

      const { error: updateError } = await supabase
        .from('required_documents')
        .update({
          document_id: document.id,
          status: 'uploaded',
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', clientId)
        .eq('document_type', documentType)

      if (updateError) throw updateError

      await loadData()
    } catch (error: any) {
      console.error('Error uploading document:', error)
      alert(`Failed to upload document: ${error.message}`)
    } finally {
      setUploading(null)
    }
  }

  const handleReplaceDocument = async (documentType: string, file: File) => {
    try {
      setUploading(documentType)
      
      const doc = requiredDocs.find((d) => d.document_type === documentType)
      if (doc?.document_id && doc?.document?.file_path) {
        // Delete from storage first
        await supabase.storage.from('documents').remove([doc.document.file_path])
        // Delete from database
        await supabase.from('documents').delete().eq('id', doc.document_id)
      }

      // Upload new file
      await handleFileUpload(documentType, file)
    } catch (error) {
      console.error('Error replacing document:', error)
      alert('Failed to replace document')
      setUploading(null)
    }
  }


  const handleDelete = async (docId: string, filePath?: string) => {
    if (!confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) return

    try {
      console.log('Deleting document:', { docId, filePath })

      // Delete from storage if file path is provided
      if (filePath) {
        console.log('Deleting from storage:', filePath)
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePath])
        
        if (storageError) {
          console.error('Error deleting from storage:', storageError)
          // Continue anyway - try to delete from database
        } else {
          console.log('Successfully deleted from storage')
        }
      }

      // Also check if this document is linked to a required document and reset it first
      const { data: reqDoc } = await supabase
        .from('required_documents')
        .select('id, document_type')
        .eq('document_id', docId)
        .maybeSingle()

      if (reqDoc && clientId) {
        console.log('Found linked required document, resetting it first')
        await supabase
          .from('required_documents')
          .update({
            document_id: null,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reqDoc.id)
      }

      // Delete from database
      console.log('Deleting from database:', docId)
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (dbError) {
        console.error('Database delete error:', dbError)
        console.error('Error details:', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint,
        })
        throw dbError
      }

      console.log('Successfully deleted document')
      await loadData()
    } catch (error: any) {
      console.error('Error deleting document:', error)
      alert(`Failed to delete document: ${error.message || 'Unknown error'}`)
    }
  }

  const handleViewDocument = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(filePath)
      if (error) throw error

      const url = URL.createObjectURL(data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err: any) {
      console.error('Error viewing document:', err)
      alert('Failed to view document')
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
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error downloading document:', err)
      alert('Failed to download document')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading documents...</div>
  }

  const requiredUploaded = requiredDocs.filter(
    (doc) => doc.is_required && (doc.status === 'uploaded' || doc.status === 'verified')
  )
  const requiredTotal = requiredDocs.filter((doc) => doc.is_required)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('required')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'required'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Required Documents
            {requiredTotal.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                {requiredUploaded.length}/{requiredTotal.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'other'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Other Documents ({documents.filter(d => d.document_category !== 'onboarding').length})
          </button>
          <button
            onClick={() => setActiveTab('quickbooks')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'quickbooks'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            QuickBooks Settings
          </button>
        </div>
      </div>

      {/* Required Documents Tab */}
      {activeTab === 'required' && (
        <div className="space-y-4">
          {requiredDocs.map((doc) => {
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
                            onClick={() => handleViewDocument(document.file_path)}
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
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleReplaceDocument(doc.document_type, file)
                                }
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading === doc.document_type ? 'Uploading...' : 'Upload Document'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(doc.document_type, file)
                          }}
                          disabled={uploading === doc.document_type}
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
      {activeTab === 'other' && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Other Documents:</strong> Upload monthly statements, receipts, invoices, payroll documents, or any other financial documents your accountant needs.
            </p>
          </div>
          {documents.filter(d => d.document_category !== 'onboarding').length === 0 ? (
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file && clientId) {
                      try {
                        setUploading('other')
                        const fileExt = file.name.split('.').pop()
                        const filePath = `${clientId}/other/${Date.now()}.${fileExt}`

                        const { error: uploadError } = await supabase.storage
                          .from('documents')
                          .upload(filePath, file)

                        if (uploadError) throw uploadError

                        const { data: document, error: docError } = await supabase
                          .from('documents')
                          .insert({
                            client_id: clientId,
                            name: file.name,
                            file_path: filePath,
                            file_type: fileExt || 'other',
                            status: 'pending',
                            document_category: 'ad_hoc',
                          })
                          .select()
                          .single()

                        if (docError) throw docError
                        await loadData()
                      } catch (error: any) {
                        console.error('Error uploading document:', error)
                        alert(`Failed to upload document: ${error.message}`)
                      } finally {
                        setUploading(null)
                      }
                    }
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
                    {documents.filter(d => d.document_category !== 'onboarding').map((doc) => (
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
                              onClick={() => handleViewDocument(doc.file_path)}
                              className="text-primary-600 hover:text-primary-900"
                              title="View document"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.file_path)}
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
      {activeTab === 'quickbooks' && (
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
              onClick={async () => {
                if (!clientId || !qbInfo.companyName || !qbInfo.email) {
                  alert('Please fill in the Company Name and Email fields')
                  return
                }
                setQbSaving(true)
                try {
                  const { error } = await supabase
                    .from('clients')
                    .update({ quickbooks_info: JSON.stringify(qbInfo) })
                    .eq('id', clientId)

                  if (error) throw error
                  setQbSaved(true)
                  setTimeout(() => setQbSaved(false), 3000)
                } catch (err: any) {
                  console.error('Error saving QuickBooks info:', err)
                  alert('Failed to save: ' + err.message)
                } finally {
                  setQbSaving(false)
                }
              }}
              disabled={qbSaving || !qbInfo.companyName || !qbInfo.email}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                qbSaved
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {qbSaving ? 'Saving...' : qbSaved ? '✓ Saved!' : 'Save Changes'}
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
  )
}
