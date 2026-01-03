// Only initialize Stripe on server-side
// This file exports PRICING_PLANS for client use and stripe instance for server use

export const PRICING_PLANS = {
  test: {
    name: 'Test Plan',
    price: 100, // $1 in cents (for testing only)
    description: 'Test plan for Stripe payment testing',
    features: [
      'Test subscription only',
      'For development and testing purposes',
      'Not for production use',
    ],
    bestFor: 'Testing payment flows',
    isTest: true,
  },
  starter: {
    name: 'Starter',
    price: 17500, // $175 in cents
    description: 'For very small businesses with simple bookkeeping needs',
    features: [
      'Monthly bookkeeping (up to 50 transactions)',
      'Bank reconciliation (1 account)',
      'Monthly Profit & Loss statement',
      'Secure client portal access',
      'Email support (48-hour response time)',
    ],
    bestFor: 'Sole proprietors, freelancers, and early-stage businesses',
  },
  growth: {
    name: 'Growth',
    price: 32500, // $325 in cents
    description: 'For growing businesses that need more visibility',
    features: [
      'Monthly bookkeeping (up to 150 transactions)',
      'Bank & credit card reconciliation (up to 3 accounts)',
      'Monthly Profit & Loss & Balance Sheet',
      'Quarterly financial review call (30 minutes)',
      'Secure client portal access',
      'Priority email support (24-hour response time)',
    ],
    bestFor: 'Small businesses with regular monthly activity',
    isPopular: true,
  },
  professional: {
    name: 'Professional',
    price: 55000, // $550 in cents
    description: 'For established businesses that want ongoing financial insight',
    features: [
      'Monthly bookkeeping (up to 300 transactions)',
      'Bank & credit card reconciliation (up to 5 accounts)',
      'Monthly Profit & Loss & Balance Sheet',
      'Monthly financial review call (30 minutes)',
      'Year-end close & tax-ready financials',
      'Priority support',
    ],
    bestFor: 'Established businesses and growing teams',
  },
}

export type PlanId = keyof typeof PRICING_PLANS

