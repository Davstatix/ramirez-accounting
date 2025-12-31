import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Ramirez Accounting',
  description: 'Privacy Policy for Ramirez Accounting bookkeeping services',
}

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-6">Last updated: 12/31/2025</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p>
              Ramirez Accounting (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting the privacy and security of your personal and financial information. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you access our website or use our bookkeeping services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Information You Provide</h3>
            <p>
              We may collect information you voluntarily provide, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, phone number, and business information</li>
              <li>Financial records and documents you upload, including bank statements and accounting records</li>
              <li>Payment information (processed securely through third-party processors such as Stripe)</li>
              <li>Communications with our team</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <p>
              When you visit our website, we may automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usage and analytics data</li>
              <li>IP address, browser type, and device information</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p>
              We use collected information to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide bookkeeping and accounting services</li>
              <li>Process financial data and prepare reports</li>
              <li>Communicate regarding accounts, services, and support</li>
              <li>Process payments and manage subscriptions</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Improve our services and website functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement reasonable administrative, technical, and physical safeguards designed to protect your information in accordance with applicable laws, including the New York SHIELD Act. Security measures may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure cloud infrastructure and access controls</li>
              <li>Authentication and authorization safeguards</li>
              <li>Regular monitoring and system updates</li>
            </ul>
            <p className="mt-4">
              No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p>
              We do not sell personal information. We may share information only:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or lawful requests</li>
              <li>With trusted service providers who support our operations under confidentiality obligations</li>
              <li>To protect our rights, property, or safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain client financial records for up to seven (7) years, or as otherwise required by applicable law. Data is securely deleted after the retention period. Requests for deletion are subject to legal and regulatory requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access or request a copy of your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your information, subject to legal obligations</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us using the information below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Cookies and Tracking Technologies</h2>
            <p>
              We use essential and analytics cookies to operate our website and improve user experience. You may disable cookies through your browser settings; however, certain features may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Third-Party Services</h2>
            <p>
              We may use third-party providers to support our services, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Supabase (data storage and authentication)</li>
              <li>Stripe (payment processing)</li>
              <li>Resend (email delivery)</li>
            </ul>
            <p className="mt-4">
              These providers operate under their own privacy policies, and we are not responsible for their privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from minors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Changes will be effective upon posting, and the &quot;Last updated&quot; date will reflect revisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
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
