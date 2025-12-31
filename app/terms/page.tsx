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
        <p className="text-gray-600 mb-6">Last updated: 12/31/2025</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using the services of Ramirez Accounting (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Services</h2>
            <p>
              Ramirez Accounting provides bookkeeping and accounting support services, which may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Monthly bookkeeping and transaction categorization</li>
              <li>Bank and credit card reconciliations</li>
              <li>Preparation of financial statements (Profit &amp; Loss, Balance Sheet)</li>
              <li>Document organization and review</li>
              <li>Year-end close and preparation of tax-ready financial records for use by a tax professional</li>
            </ul>
            <p className="mt-4">
              We do not provide tax preparation, tax planning, legal advice, or representation before taxing authorities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Client Responsibilities</h2>
            <p>
              Clients agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, complete, and timely financial information</li>
              <li>Upload required documents promptly</li>
              <li>Maintain the security of login credentials</li>
              <li>Pay fees as agreed</li>
              <li>Notify us of material changes to business or financial circumstances</li>
              <li>Comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Fees, Billing, and Cancellation</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Fees</h3>
            <p>
              Services are generally billed on a recurring monthly basis or as agreed in writing. Current pricing and service tiers are described on our website or in your engagement agreement and are subject to change with notice.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Payment</h3>
            <p>
              Payments are processed through third-party payment processors such as Stripe. By enrolling in services, you authorize recurring charges to your selected payment method. Fees are non-refundable except as required by law.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Cancellation</h3>
            <p>
              Clients may cancel services with written notice. Cancellation becomes effective at the end of the current billing period. No prorated refunds are provided for partial periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data &amp; Confidentiality</h2>
            <p>
              We treat client information as confidential and will not disclose it to third parties except as required by law or with client consent. Additional details are provided in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Service Availability</h2>
            <p>
              While we strive to provide timely and reliable services, uninterrupted availability is not guaranteed. We may suspend or modify services for maintenance, updates, or operational reasons.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Limitation of Liability</h2>
            <p>
              Our services rely on information provided by clients. Ramirez Accounting is not responsible for errors arising from incomplete, inaccurate, or delayed information. To the fullest extent permitted by law, our liability is limited to the fees paid for services during the twelve (12) months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. No Professional Advice</h2>
            <p>
              Ramirez Accounting provides bookkeeping services only. We do not provide tax, legal, or financial advisory services. Clients should consult qualified professionals for such matters.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Account Suspension or Termination</h2>
            <p>
              We reserve the right to suspend or terminate services for non-payment, violation of these terms, or suspected fraudulent or unlawful activity. Upon termination, clients may request access to retrieve their data for a limited period, subject to applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Intellectual Property</h2>
            <p>
              All website content, branding, and materials are the property of Ramirez Accounting and may not be used without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Modifications</h2>
            <p>
              We may update these Terms of Service periodically. Material changes will be communicated via email or our website. Continued use of services constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
            <p>
              These Terms of Service are governed by the laws of the State of New York. Any disputes shall be subject to the exclusive jurisdiction of the state and federal courts located in New York.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Order of Precedence</h2>
            <p>
              If there is a conflict between these Terms of Service and a signed client engagement agreement, the engagement agreement shall control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Contact Information</h2>
            <p className="mt-4">
              <strong>Ramirez Accounting</strong><br />
              📧 david@ramirezaccountingny.com<br />
              📞 (516) 595-3637
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
