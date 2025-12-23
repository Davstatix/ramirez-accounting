import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - Ramirez Accounting',
  description: 'Terms of Service for Ramirez Accounting bookkeeping services',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-700">
              Ramirez Accounting
            </Link>
            <Link href="/" className="text-gray-700 hover:text-primary-600">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using Ramirez Accounting&apos;s services, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Services</h2>
            <p>
              Ramirez Accounting provides professional bookkeeping and accounting services, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Monthly bookkeeping and transaction categorization</li>
              <li>Bank and credit card reconciliations</li>
              <li>Financial statement preparation (Profit & Loss, Balance Sheet)</li>
              <li>Document management and review</li>
              <li>Year-end tax preparation support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Client Responsibilities</h2>
            <p>As a client, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete financial information</li>
              <li>Upload required documents in a timely manner</li>
              <li>Maintain the security of your account credentials</li>
              <li>Pay subscription fees as agreed</li>
              <li>Notify us of any changes to your business or financial situation</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Subscription and Payment</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Subscription Plans</h3>
            <p>
              Services are provided on a monthly subscription basis. Plans include Starter ($150/mo), 
              Growth ($300/mo), and Professional ($500/mo). Pricing and features are subject to change with notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Payment</h3>
            <p>
              Payments are processed securely through Stripe. By subscribing, you authorize us to charge your 
              payment method on a recurring monthly basis. All fees are non-refundable except as required by law.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account settings. Cancellation takes effect 
              at the end of your current billing period. No refunds are provided for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data and Confidentiality</h2>
            <p>
              We maintain strict confidentiality of your financial information. We will not disclose your information 
              to third parties except as required by law or with your explicit consent. See our Privacy Policy for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Service Availability</h2>
            <p>
              While we strive for 99.9% uptime, we do not guarantee uninterrupted access to our services. 
              We reserve the right to perform maintenance, updates, or modifications that may temporarily 
              affect service availability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Limitation of Liability</h2>
            <p>
              Ramirez Accounting provides bookkeeping services based on information provided by you. We are not 
              responsible for errors resulting from incomplete, inaccurate, or delayed information. Our liability 
              is limited to the amount paid for services in the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Professional Standards</h2>
            <p>
              While we provide professional bookkeeping services, we are not providing tax, legal, or financial 
              advisory services. You should consult with qualified professionals for tax planning, legal advice, 
              or investment decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms, fail to pay 
              fees, or engage in fraudulent activity. Upon termination, you retain access to download your data 
              for 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Intellectual Property</h2>
            <p>
              All content, features, and functionality of our services are owned by Ramirez Accounting and are 
              protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Material changes will be communicated via 
              email or through our platform. Continued use of our services after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
            <p>
              These terms are governed by the laws of New York, United States. Any disputes will be resolved 
              through binding arbitration or in the courts of New York.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <p className="mt-4">
              <strong>Ramirez Accounting</strong><br />
              Email: david@ramirezaccountingny.com<br />
              Phone: (516) 595-3637
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

