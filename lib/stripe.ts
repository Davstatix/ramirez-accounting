// Only initialize Stripe on server-side
// This file exports PRICING_PLANS for client use and stripe instance for server use

export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    price: 15000, // $150 in cents
    description: 'For small businesses with simple needs',
    features: [
      'Monthly bookkeeping (up to 50 transactions)',
      'Bank reconciliation (1 account)',
      'Monthly P&L statement',
      'Secure client portal access',
      'Email support',
    ],
  },
  growth: {
    name: 'Growth',
    price: 30000, // $300 in cents
    description: 'For growing businesses',
    features: [
      'Monthly bookkeeping (up to 150 transactions)',
      'Bank & credit card reconciliation (up to 3 accounts)',
      'Monthly P&L & Balance Sheet',
      'Quarterly financial review call',
      'Priority email support',
    ],
  },
  professional: {
    name: 'Professional',
    price: 50000, // $500 in cents
    description: 'For established businesses',
    features: [
      'Monthly bookkeeping (up to 300 transactions)',
      'Bank & credit card reconciliation (up to 5 accounts)',
      'Monthly P&L & Balance Sheet',
      'Year-end tax preparation support',
      'Monthly financial review call',
      'Priority support',
    ],
  },
}

export type PlanId = keyof typeof PRICING_PLANS

