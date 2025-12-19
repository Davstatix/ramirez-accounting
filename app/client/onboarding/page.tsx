'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Database,
  Shield,
  Link as LinkIcon,
  Eye,
  Download,
  CreditCard,
  Zap,
  TrendingUp,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'

interface RequiredDocument {
  id: string
  document_type: string
  document_id: string | null
  status: string
  notes: string | null
  is_required: boolean
  document?: {
    id: string
    name: string
    file_path: string
    created_at: string
  }
}

interface DocumentType {
  type: string
  label: string
  description: string
  required: boolean
}

const DOCUMENT_TYPES: DocumentType[] = [
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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [clientId, setClientId] = useState<string | null>(null)
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [qbInfo, setQbInfo] = useState({
    companyName: '',
    email: '',
    accessNotes: '',
  })
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Debug: Log when requiredDocs changes
  useEffect(() => {
    console.log('requiredDocs state updated:', {
      count: requiredDocs.length,
      docs: requiredDocs.map(d => ({
        type: d.document_type,
        status: d.status,
        has_document: !!d.document,
        document_id: d.document_id,
        document_name: d.document?.name,
      }))
    })
  }, [requiredDocs])

  // Check for subscription success/cancel from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscription = urlParams.get('subscription')
    const step = urlParams.get('step')
    
    if (subscription === 'success' && step === '4') {
      setCurrentStep(4)
      // Clean up URL
      window.history.replaceState({}, '', '/client/onboarding')
    } else if (subscription === 'cancelled' && step === '3') {
      setCurrentStep(3)
      setErrorMessage('Payment was cancelled. Please select a plan to continue.')
      setTimeout(() => setErrorMessage(null), 5000)
      window.history.replaceState({}, '', '/client/onboarding')
    }
  }, [])

  const totalSteps = 4 // Documents, QuickBooks, Plan Selection, Review

  useEffect(() => {
    loadClientAndDocuments()
  }, [])

  const loadClientAndDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, onboarding_status, user_id')
        .eq('user_id', user.id)
        .single()

      if (clientError) {
        console.error('Error loading client:', clientError)
        router.push('/client')
        return
      }

      if (!client) {
        router.push('/client')
        return
      }

      console.log('Client loaded:', { id: client.id, user_id: client.user_id, current_user: user.id })
      setClientId(client.id)

      // If already completed, redirect immediately
      if (client.onboarding_status === 'completed') {
        router.replace('/client')
        return
      }

      // Load required documents with document details
      const { data: docs } = await supabase
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

      if (docs && docs.length > 0) {
        // Check if we have the correct 4 document types
        const expectedTypes = ['tax_id_ein', 'tax_id_ssn', 'bank_statement', 'business_license']
        const existingTypes = docs.map((d: any) => d.document_type)
        const hasAllTypes = expectedTypes.every(t => existingTypes.includes(t))
        const hasOldTypes = existingTypes.some((t: string) => ['w9_form', 'voided_check'].includes(t))
        
        if (!hasAllTypes || hasOldTypes) {
          // Fix outdated required_documents - delete old and create new
          await supabase
            .from('required_documents')
            .delete()
            .eq('client_id', client.id)
          
          await initializeRequiredDocuments(client.id)
          
          const { data: newDocs } = await supabase
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
          if (newDocs) {
            setRequiredDocs(newDocs)
          }
        } else {
          setRequiredDocs(docs)
        }
      } else {
        // Initialize required documents if they don't exist
        await initializeRequiredDocuments(client.id)
        // Reload after initialization
        const { data: newDocs } = await supabase
          .from('required_documents')
          .select('*')
          .eq('client_id', client.id)
        if (newDocs) {
          setRequiredDocs(newDocs)
        }
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeRequiredDocuments = async (clientId: string) => {
    const docsToCreate = DOCUMENT_TYPES.map((doc) => ({
      client_id: clientId,
      document_type: doc.type,
      is_required: doc.required,
      status: 'pending',
    }))

    const { data } = await supabase
      .from('required_documents')
      .insert(docsToCreate)
      .select()

    if (data) {
      setRequiredDocs(data)
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!clientId) {
      console.error('No client ID available')
      return
    }

    setUploading(documentType)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${clientId}/onboarding/${documentType}/${Date.now()}.${fileExt}`

      console.log('Uploading file to storage:', { filePath, fileName: file.name, fileSize: file.size })

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      console.log('File uploaded to storage successfully')

      // Create document record
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

      if (docError) {
        console.error('Document insert error:', docError)
        console.error('Error details:', {
          message: docError.message,
          code: docError.code,
          details: docError.details,
          hint: docError.hint,
        })
        throw new Error(`Database insert failed: ${docError.message}`)
      }

      console.log('Document record created:', document?.id)

      // Update required document
      const { error: updateError } = await supabase
        .from('required_documents')
        .update({
          document_id: document.id,
          status: 'uploaded',
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', clientId)
        .eq('document_type', documentType)

      if (updateError) {
        console.error('Required document update error:', updateError)
        throw new Error(`Update failed: ${updateError.message}`)
      }

      console.log('Required document updated successfully')

      // Retry mechanism - sometimes database needs a moment to commit
      let reqDocs = null
      let reqDocsError = null
      let retries = 3
      
      while (retries > 0 && !reqDocs) {
        // Small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 200))

        // Reload required documents - use separate queries for reliability
        console.log(`Starting reload of required documents... (${4 - retries}/3)`)
        const { data, error } = await supabase
          .from('required_documents')
          .select('*')
          .eq('client_id', clientId)
          .order('document_type', { ascending: true })

        console.log('Reload query result:', { 
          hasData: !!data, 
          count: data?.length || 0,
          error: error,
          clientId: clientId
        })

        if (error) {
          console.error('Error loading required docs:', error)
          reqDocsError = error
          retries--
          continue
        }

        if (data && data.length > 0) {
          reqDocs = data
          break
        }

        retries--
        if (retries > 0) {
          console.log(`No documents found, retrying... (${retries} attempts left)`)
        }
      }

      if (reqDocsError && !reqDocs) {
        console.error('Failed to reload after retries:', reqDocsError)
        // Fallback: Update state manually since query failed (likely RLS issue)
        const currentDoc = requiredDocs.find(d => d.document_type === documentType)
        if (currentDoc && document) {
          const updatedDoc: RequiredDocument = {
            ...currentDoc,
            document_id: document.id,
            status: 'uploaded',
            document: {
              id: document.id,
              name: document.name,
              file_path: document.file_path,
              created_at: document.created_at,
            }
          }
          const updatedDocs = requiredDocs.map(d => 
            d.document_type === documentType ? updatedDoc : d
          )
          console.log('Fallback: Manually updating state after query error')
          setRequiredDocs([...updatedDocs])
        }
        return
      }

      if (!reqDocs || reqDocs.length === 0) {
        console.warn('No required documents found after retries - using fallback update')
        // Fallback: Manually update the state with the document we just uploaded
        // This handles cases where RLS prevents reading but allows writing
        if (!document) {
          console.error('Cannot update state - document is missing')
          return
        }

        const currentDoc = requiredDocs.find(d => d.document_type === documentType)
        const docType = DOCUMENT_TYPES.find(dt => dt.type === documentType)
        
        let updatedDocs: RequiredDocument[]
        
        if (currentDoc) {
          // Update existing doc
          const updatedDoc: RequiredDocument = {
            ...currentDoc,
            document_id: document.id,
            status: 'uploaded',
            document: {
              id: document.id,
              name: document.name,
              file_path: document.file_path,
              created_at: document.created_at,
            }
          }
          updatedDocs = requiredDocs.map(d => 
            d.document_type === documentType ? updatedDoc : d
          )
          console.log('✅ Fallback: Updated existing doc in state')
        } else {
          // Create new doc entry if it doesn't exist
          const newDoc: RequiredDocument = {
            id: `temp-${Date.now()}`,
            document_type: documentType,
            document_id: document.id,
            status: 'uploaded',
            is_required: docType?.required || false,
            notes: null,
            document: {
              id: document.id,
              name: document.name,
              file_path: document.file_path,
              created_at: document.created_at,
            }
          }
          updatedDocs = [...requiredDocs, newDoc]
          console.log('✅ Fallback: Created new doc entry in state')
        }
        
        console.log('Setting state with', updatedDocs.length, 'docs')
        setRequiredDocs([...updatedDocs])
        return // Exit early since we've updated the state
      }

      console.log('Found required docs:', reqDocs.map(d => ({
        type: d.document_type,
        status: d.status,
        document_id: d.document_id
      })))

      // Get all document IDs that exist
      const docIds = reqDocs
        .map(d => d.document_id)
        .filter((id): id is string => id !== null && id !== undefined)

      console.log('Document IDs to fetch:', docIds)

      let documentsMap: Record<string, any> = {}

      if (docIds.length > 0) {
        // Fetch all documents at once
        const { data: documents, error: docsError } = await supabase
          .from('documents')
          .select('id, name, file_path, created_at')
          .in('id', docIds)

        console.log('Documents fetch result:', {
          hasData: !!documents,
          count: documents?.length || 0,
          error: docsError
        })

        if (docsError) {
          console.error('Error loading documents:', docsError)
        } else if (documents) {
          // Create a map for quick lookup
          documentsMap = documents.reduce((acc, doc) => {
            acc[doc.id] = doc
            return acc
          }, {} as Record<string, any>)
          console.log('Documents map created:', Object.keys(documentsMap))
        }
      }

      // Merge documents into required docs
      const updatedDocs = reqDocs.map(reqDoc => ({
        ...reqDoc,
        document: reqDoc.document_id ? documentsMap[reqDoc.document_id] || null : null,
      }))

      console.log('Documents reloaded successfully:', {
        count: updatedDocs.length,
        withDocuments: updatedDocs.filter(d => d.document).length,
        docs: updatedDocs.map(d => ({
          type: d.document_type,
          status: d.status,
          has_document: !!d.document,
          document_name: d.document?.name,
        })),
      })

      // Force state update with new array reference and trigger re-render
      console.log('Setting requiredDocs state...')
      setRequiredDocs([]) // Clear first to force change
      setTimeout(() => {
        setRequiredDocs([...updatedDocs])
        console.log('State update completed with', updatedDocs.length, 'docs')
      }, 10)
    } catch (error: any) {
      console.error('Error uploading document:', error)
      setErrorMessage(`Failed to upload document: ${error.message || 'Unknown error'}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setUploading(null)
    }
  }

  const handleRemoveDocument = async (documentType: string) => {

    try {
      const doc = requiredDocs.find((d) => d.document_type === documentType)
      if (doc?.document_id) {
        // Delete from storage and database
        await supabase.from('documents').delete().eq('id', doc.document_id)
      }

      // Reset required document
      await supabase
        .from('required_documents')
        .update({
          document_id: null,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', clientId)
        .eq('document_type', documentType)

      // Reload required documents with document details
      const { data: updatedDocs } = await supabase
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
        .eq('client_id', clientId)

      if (updatedDocs) {
        setRequiredDocs(updatedDocs)
      }
    } catch (error) {
      console.error('Error removing document:', error)
      alert('Failed to remove document')
    }
  }

  const handleReplaceDocument = async (documentType: string, file: File) => {
    try {
      setUploading(documentType)
      
      const doc = requiredDocs.find((d) => d.document_type === documentType)
      
      // Delete old document if exists
      if (doc?.document_id) {
        await supabase.from('documents').delete().eq('id', doc.document_id)
      }

      // Upload new file (reuse the upload logic)
      await handleFileUpload(documentType, file)
    } catch (error) {
      console.error('Error replacing document:', error)
      alert('Failed to replace document')
      setUploading(null)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!clientId) return

    try {
      // Check if all required documents are uploaded
      const requiredUploaded = requiredDocs.filter(
        (doc) => doc.is_required && (doc.status === 'uploaded' || doc.status === 'verified')
      )
      const requiredTotal = requiredDocs.filter((doc) => doc.is_required)

      if (requiredUploaded.length < requiredTotal.length) {
        alert(`Please upload all required documents. You have uploaded ${requiredUploaded.length} of ${requiredTotal.length} required documents.`)
        return
      }

      console.log('Completing onboarding for client:', clientId)

      // Update client onboarding status
      const { error, data } = await supabase
        .from('clients')
        .update({
          onboarding_status: 'completed',
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .select()

      if (error) {
        console.error('Error updating onboarding status:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }

      if (!data || data.length === 0) {
        console.error('No data returned from update - update may have failed')
        throw new Error('Failed to update onboarding status - no data returned')
      }

      console.log('Onboarding status updated successfully:', data)
      console.log('Updated client onboarding_status:', data[0]?.onboarding_status)

      // Verify the update by fetching the client again
      const { data: verifyClient, error: verifyError } = await supabase
        .from('clients')
        .select('onboarding_status, onboarding_completed_at')
        .eq('id', clientId)
        .single()

      if (verifyError) {
        console.error('Error verifying update:', verifyError)
      } else {
        console.log('Verified onboarding status:', verifyClient?.onboarding_status)
        if (verifyClient?.onboarding_status !== 'completed') {
          console.error('⚠️ WARNING: Onboarding status was not set to completed!')
          alert('There was an issue saving your onboarding status. Please contact support.')
          return
        }
      }

      // Notify admin of completed onboarding
      const planName = selectedPlan ? selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1) : 'Unknown'
      fetch('/api/email/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, planName }),
      }).catch(err => console.error('Failed to send onboarding email:', err))

      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 500))

      // Force redirect to client dashboard using window.location
      window.location.href = '/client?onboarding=complete'
    } catch (error: any) {
      console.error('Error completing onboarding:', error)
      alert(`Failed to complete onboarding: ${error.message}`)
    }
  }

  const getDocumentStatus = (docType: string) => {
    const doc = requiredDocs.find((d) => d.document_type === docType)
    return doc?.status || 'pending'
  }

  const getDocumentId = (docType: string) => {
    const doc = requiredDocs.find((d) => d.document_type === docType)
    return doc?.document_id
  }

  if (loading) {
    return <div className="text-center py-12">Loading onboarding...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Ramirez Accounting</h1>
          <p className="text-lg text-gray-600">
            Let&apos;s get you set up. This will only take a few minutes.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="relative flex items-start justify-between">
            {/* Connecting lines - positioned absolutely */}
            <div className="absolute top-6 left-0 right-0 flex items-center px-6">
              <div className="flex-1 h-1.5 mx-2 rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStep > 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ width: currentStep > 1 ? '100%' : '0%' }}
                />
              </div>
              <div className="flex-1 h-1.5 mx-2 rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStep > 2 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ width: currentStep > 2 ? '100%' : '0%' }}
                />
              </div>
              <div className="flex-1 h-1.5 mx-2 rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStep > 3 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ width: currentStep > 3 ? '100%' : '0%' }}
                />
              </div>
            </div>

            {/* Step indicators */}
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="relative flex flex-col items-center flex-1 z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300 ${
                    step < currentStep
                      ? 'bg-green-500 text-white shadow-lg scale-110'
                      : step === currentStep
                      ? 'bg-primary-600 text-white shadow-lg scale-110 ring-4 ring-primary-200'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="h-7 w-7" /> : step}
                </div>
                <span
                  className={`mt-3 text-sm font-medium text-center ${
                    step <= currentStep ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  {step === 1 ? 'Documents' : step === 2 ? 'QuickBooks' : step === 3 ? 'Plan' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-lg z-50 max-w-md animate-slide-in">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

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
          {currentStep === 1 && (
            <DocumentsStep
              key={`documents-${requiredDocs.length}-${requiredDocs.filter(d => d.document).length}`}
              requiredDocs={requiredDocs}
              onUpload={handleFileUpload}
              onReplace={handleReplaceDocument}
              uploading={uploading}
            />
          )}

          {currentStep === 2 && (
            <QuickBooksConnectionStep qbInfo={qbInfo} setQbInfo={setQbInfo} />
          )}

          {currentStep === 3 && (
            <PlanSelectionStep
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              clientId={clientId}
              processingPayment={processingPayment}
              setProcessingPayment={setProcessingPayment}
            />
          )}

          {currentStep === 4 && (
            <ReviewStep
              requiredDocs={requiredDocs}
              onComplete={handleCompleteOnboarding}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 border-2 border-gray-400 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 flex items-center font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            <button
              onClick={async () => {
                // Validate before moving forward
                if (currentStep === 1) {
                  // Check if all required documents are uploaded before moving to step 2
                  const requiredUploaded = requiredDocs.filter(
                    (doc) => doc.is_required && (doc.status === 'uploaded' || doc.status === 'verified')
                  )
                  const requiredTotal = requiredDocs.filter((doc) => doc.is_required)
                  
                  if (requiredUploaded.length < requiredTotal.length) {
                    const missing = requiredTotal.length - requiredUploaded.length
                    const errorMsg = missing === 1 
                      ? `Please upload ${missing} more required document to continue.`
                      : `Please upload ${missing} more required documents to continue.`
                    setErrorMessage(errorMsg)
                    setTimeout(() => setErrorMessage(null), 5000)
                    return
                  }
                }
                
                // Save QuickBooks info when moving from step 2 to step 3
                if (currentStep === 2) {
                  if (!qbInfo.companyName || !qbInfo.email) {
                    setErrorMessage('Please fill in the QuickBooks Company Name and Email fields (or enter N/A if you don\'t have QuickBooks).')
                    setTimeout(() => setErrorMessage(null), 5000)
                    return
                  }
                  
                  try {
                    const { error } = await supabase
                      .from('clients')
                      .update({
                        quickbooks_info: JSON.stringify(qbInfo),
                      })
                      .eq('id', clientId)

                    if (error) throw error
                  } catch (err: any) {
                    console.error('Error saving QuickBooks info:', err)
                    setErrorMessage('Failed to save QuickBooks info. Please try again.')
                    setTimeout(() => setErrorMessage(null), 5000)
                    return
                  }
                }

                // Handle plan selection and payment (step 3)
                if (currentStep === 3) {
                  if (!selectedPlan) {
                    setErrorMessage('Please select a plan to continue.')
                    setTimeout(() => setErrorMessage(null), 5000)
                    return
                  }
                  
                  // Redirect to Stripe checkout
                  setProcessingPayment(true)
                  try {
                    const response = await fetch('/api/stripe/create-checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ planId: selectedPlan, clientId }),
                    })
                    
                    const data = await response.json()
                    
                    if (!response.ok) {
                      throw new Error(data.error || 'Failed to create checkout session')
                    }
                    
                    // Redirect to Stripe
                    window.location.href = data.url
                    return
                  } catch (err: any) {
                    console.error('Error creating checkout:', err)
                    setErrorMessage(err.message || 'Failed to process payment. Please try again.')
                    setTimeout(() => setErrorMessage(null), 5000)
                    setProcessingPayment(false)
                    return
                  }
                }
                
                if (currentStep < totalSteps) {
                  setCurrentStep(currentStep + 1)
                } else {
                  await handleCompleteOnboarding()
                }
              }}
              className={`px-8 py-3 rounded-xl flex items-center font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                currentStep === totalSteps
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
              }`}
            >
              {currentStep === totalSteps ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Documents Step Component (Step 1)
function DocumentsStep({
  requiredDocs,
  onUpload,
  onReplace,
  uploading,
}: {
  requiredDocs: RequiredDocument[]
  onUpload: (type: string, file: File) => void
  onReplace: (type: string, file: File) => void
  uploading: string | null
}) {
  const requiredUploaded = requiredDocs.filter(
    (doc) => doc.is_required && (doc.status === 'uploaded' || doc.status === 'verified')
  )
  const requiredTotal = requiredDocs.filter((doc) => doc.is_required)
  const progress = requiredTotal.length > 0 ? (requiredUploaded.length / requiredTotal.length) * 100 : 0

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Required Documents</h2>
      <p className="text-lg text-gray-600 mb-6">
        Upload your required documents below. All documents are required to proceed.
      </p>
      
      {/* Progress Bar */}
      <div className="bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-600 mb-6">
        <span className="font-medium">
          {requiredUploaded.length} of {requiredTotal.length} required documents uploaded
        </span>
        <span className="font-semibold text-primary-600">{Math.round(progress)}%</span>
      </div>

      <div className="space-y-3">
        {DOCUMENT_TYPES.map((docType) => {
          const doc = requiredDocs.find((d) => d.document_type === docType.type)
          const status = doc?.status || 'pending'
          const isUploaded = (status === 'uploaded' || status === 'verified') && !!doc?.document
          const isUploading = uploading === docType.type
          const document = doc?.document

          return (
            <div
              key={docType.type}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                isUploaded
                  ? 'border-green-200 bg-green-50/50 shadow-sm'
                  : isUploading
                  ? 'border-primary-300 bg-primary-50/50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                          isUploaded
                            ? 'bg-green-100 text-green-600'
                            : isUploading
                            ? 'bg-primary-100 text-primary-600 animate-pulse'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isUploaded ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base flex items-center">
                          {docType.label}
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                            Required
                          </span>
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{docType.description}</p>
                      </div>
                    </div>

                    {/* Upload Area */}
                    {!isUploaded ? (
                      <div className="mt-4">
                        <label
                          className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                            isUploading
                              ? 'border-primary-400 bg-primary-50'
                              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/30'
                          }`}
                        >
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) onUpload(docType.type, file)
                            }}
                            disabled={isUploading}
                            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.doc,.docx"
                          />
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                              <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                                <p className="text-sm font-medium text-primary-700">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-700">
                                  <span className="text-primary-600 hover:text-primary-700">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PDF, Excel, Images, Word (MAX. 10MB)
                                </p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {document?.name || 'Document uploaded'}
                              </p>
                              {document && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Uploaded {new Date(document.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <label className="ml-3 flex-shrink-0 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 border border-primary-200 rounded-lg transition-colors cursor-pointer">
                            Replace
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  onReplace(docType.type, file)
                                }
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// QuickBooks Connection Step Component (Step 2)
function QuickBooksConnectionStep({ 
  qbInfo, 
  setQbInfo 
}: { 
  qbInfo: { companyName: string; email: string; accessNotes: string }
  setQbInfo: (info: { companyName: string; email: string; accessNotes: string }) => void
}) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">QuickBooks Access</h2>
      <p className="text-lg text-gray-600 mb-8">
        Provide your QuickBooks information so we can connect as your accountant and manage your books.
      </p>

      {/* Info Notice */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <LinkIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Why QuickBooks?</h3>
            <p className="text-gray-700 text-sm mb-3">
              We use QuickBooks to manage your bookkeeping, including:
            </p>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Bank reconciliation
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Profit & Loss statements
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Balance sheets
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                Tax preparation
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">QuickBooks Company Name *</label>
          <input
            type="text"
            value={qbInfo.companyName}
            onChange={(e) => setQbInfo({ ...qbInfo, companyName: e.target.value })}
            placeholder="Your company name in QuickBooks (or N/A if you don't have one)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">QuickBooks Email *</label>
          <input
            type="email"
            value={qbInfo.email}
            onChange={(e) => setQbInfo({ ...qbInfo, email: e.target.value })}
            placeholder="Email for your QuickBooks account (or N/A)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            We&apos;ll send an accountant invite to this email address.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
          <textarea
            value={qbInfo.accessNotes}
            onChange={(e) => setQbInfo({ ...qbInfo, accessNotes: e.target.value })}
            placeholder="Any additional information about your QuickBooks setup (existing accountant, subscription type, etc.)"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Don&apos;t have QuickBooks yet?</strong> No problem! Enter &quot;N/A&quot; in the fields above and mention in the notes that you don&apos;t have QuickBooks. We can help you set it up after onboarding.
        </p>
      </div>
    </div>
  )
}

// Plan Selection Step Component (Step 3)
function PlanSelectionStep({
  selectedPlan,
  setSelectedPlan,
  clientId,
  processingPayment,
  setProcessingPayment,
}: {
  selectedPlan: PlanId | null
  setSelectedPlan: (plan: PlanId) => void
  clientId: string | null
  processingPayment: boolean
  setProcessingPayment: (processing: boolean) => void
}) {
  const plans = Object.entries(PRICING_PLANS) as [PlanId, typeof PRICING_PLANS[PlanId]][]

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Choose Your Plan</h2>
      <p className="text-lg text-gray-600 mb-8">
        Select the plan that best fits your business needs. You can upgrade or downgrade anytime.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(([planId, plan]) => {
          const isSelected = selectedPlan === planId
          const isPopular = planId === 'growth'
          
          return (
            <div
              key={planId}
              onClick={() => !processingPayment && setSelectedPlan(planId)}
              className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              } ${processingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${(plan.price / 100).toLocaleString()}
                </span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className={`w-full py-3 rounded-lg font-semibold text-center transition-colors ${
                isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {isSelected ? 'Selected' : 'Select Plan'}
              </div>
            </div>
          )
        })}
      </div>

      {processingPayment && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-primary-100 text-primary-700 rounded-lg">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Redirecting to secure payment...
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <Lock className="h-4 w-4 mr-1 text-gray-400" />
            Secure payment via Stripe
          </div>
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
            Cancel anytime
          </div>
        </div>
      </div>
    </div>
  )
}

// Review Step Component
function ReviewStep({
  requiredDocs,
  onComplete,
}: {
  requiredDocs: RequiredDocument[]
  onComplete: () => void
}) {
  const supabase = createClient()
  const requiredUploaded = requiredDocs.filter(
    (doc) => doc.is_required && (doc.status === 'uploaded' || doc.status === 'verified')
  )
  const requiredTotal = requiredDocs.filter((doc) => doc.is_required)
  
  // Get all uploaded documents (required and optional)
  const allUploadedDocs = requiredDocs.filter(
    (doc) => doc.status === 'uploaded' || doc.status === 'verified'
  )

  const handleViewDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(filePath)
      if (error) throw error

      const url = URL.createObjectURL(data)
      window.open(url, '_blank')
      // Clean up after a delay
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

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Almost There! 🎉</h2>
      <p className="text-lg text-gray-600 mb-8">
        Review your uploaded documents below. Everything looks good? Click &quot;Complete Setup&quot; to finish!
      </p>

      {/* Uploaded Documents List */}
      {allUploadedDocs.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Your Documents ({allUploadedDocs.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Click View to review each document
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {allUploadedDocs.map((doc) => {
              const docType = DOCUMENT_TYPES.find((dt) => dt.type === doc.document_type)
              const document = doc.document
              
              return (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-primary-50 hover:to-white transition-all duration-200 border-2 border-gray-200 hover:border-primary-300 hover:shadow-md"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <p className="text-base font-semibold text-gray-900">
                          {docType?.label || doc.document_type}
                        </p>
                        {doc.is_required && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      {document && (
                        <p className="text-sm text-gray-500 truncate">
                          {document.name}
                        </p>
                      )}
                      {document && (
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded {new Date(document.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {document && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewDocument(document.file_path, document.name)}
                        className="px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg border-2 border-primary-200 flex items-center text-sm font-semibold transition-all hover:border-primary-300"
                        title="View document"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Required Documents Status */}
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Required Documents Status</h3>
          <div className="space-y-2">
            {requiredDocs
              .filter((doc) => doc.is_required)
              .map((doc) => {
                const docType = DOCUMENT_TYPES.find((dt) => dt.type === doc.document_type)
                return (
                  <div key={doc.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{docType?.label}</span>
                    {doc.status === 'uploaded' || doc.status === 'verified' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {requiredUploaded.length === requiredTotal.length ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-green-900 font-bold text-lg mb-1">
                All Required Documents Uploaded! 🎉
              </p>
              <p className="text-green-700 text-sm">
                You&apos;re all set! Click &quot;Complete Setup&quot; below to finish your onboarding.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 mb-6">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" />
            <p className="text-yellow-800 font-medium">
              Please upload all {requiredTotal.length} required documents before completing onboarding.
            </p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-xl p-5">
        <p className="text-sm text-gray-700">
          <strong className="text-gray-900">💡 Tip:</strong> You can update or remove documents anytime from your dashboard after
          completing onboarding. Just go to <strong>&quot;Documents&quot;</strong> in the menu.
        </p>
      </div>
    </div>
  )
}

