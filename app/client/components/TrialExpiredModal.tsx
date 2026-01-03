'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PRICING_PLANS, PlanId } from '@/lib/stripe'
import { AlertCircle, CreditCard, X, CheckCircle, Lock } from 'lucide-react'

interface TrialExpiredModalProps {
  clientId: string
  onPaymentComplete: () => void
}

export default function TrialExpiredModal({ clientId, onPaymentComplete }: TrialExpiredModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSelectPlan = async (planId: PlanId) => {
    if (processing) return
    
    setSelectedPlan(planId)
    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, clientId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err: any) {
      console.error('Error creating checkout:', err)
      setError(err.message || 'Failed to process payment. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={(e) => e.stopPropagation()} // Prevent closing on backdrop click
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing on content click
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Trial Period Expired</h2>
                <p className="text-red-100 mt-1">Please select a plan to continue using the portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Access Temporarily Restricted</h3>
              <p className="text-sm text-yellow-700">
                Your free trial has ended. To continue accessing your portal and all features, please select a subscription plan below.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Payment Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(PRICING_PLANS)
                .filter(([planId]) => planId !== 'test')
                .map(([planId, plan]) => {
                
                const isSelected = selectedPlan === planId
                const isPopular = (plan as any).isPopular

                return (
                  <div
                    key={planId}
                    onClick={() => !processing && handleSelectPlan(planId as PlanId)}
                    className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 shadow-lg scale-105'
                        : processing
                        ? 'border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
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
                    {plan.features.length > 4 && (
                      <p className="text-sm text-gray-500 text-center mb-4">
                        + {plan.features.length - 4} more features
                      </p>
                    )}
                    <button
                      disabled={processing}
                      className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {processing && isSelected ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          {isSelected ? 'Selected' : 'Select Plan'}
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Secure Payment:</strong> All payments are processed securely through Stripe. 
              You can cancel or change your plan at any time from your account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

