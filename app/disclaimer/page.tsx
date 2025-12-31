import Link from 'next/link'

export const metadata = {
  title: 'Disclaimer - Ramirez Accounting',
  description: 'Disclaimer for Ramirez Accounting bookkeeping services',
}

export default function Disclaimer() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Disclaimer</h1>
        <p className="text-gray-600 mb-6">Last updated: 12/31/2025</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Professional Services Disclaimer</h2>
            <p>
              Ramirez Accounting provides bookkeeping and accounting support services. The information on this website and the services we provide are for general informational purposes only and do not constitute tax, legal, or financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Not Tax or Legal Advice</h2>
            <p>
              Our services are limited to bookkeeping and accounting support designed to help clients maintain organized and accurate financial records. We do not provide tax preparation, tax planning, legal advice, or representation before taxing authorities.
            </p>
            <p className="mt-4">
              You should consult with a qualified tax professional or attorney for matters including, but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tax planning or strategy</li>
              <li>Tax return preparation or filing</li>
              <li>Legal or regulatory compliance</li>
              <li>Business entity selection or restructuring</li>
              <li>Investment or financial planning decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Client Responsibility &amp; Accuracy of Information</h2>
            <p>
              Our services rely on information and documentation provided by clients. While we strive for accuracy and completeness, Ramirez Accounting is not responsible for errors or omissions resulting from incomplete, inaccurate, or untimely information supplied by clients.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">No Guarantee of Results</h2>
            <p>
              Bookkeeping services are provided based on the information available at the time of service. We make no guarantees regarding specific outcomes, tax results, or financial performance. Past results do not guarantee future outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Platforms</h2>
            <p>
              Our services may involve integration with third-party platforms such as accounting software, payment processors, or payroll providers. Ramirez Accounting is not responsible for the performance, availability, security, or accuracy of any third-party services. Use of third-party platforms is subject to their respective terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Ramirez Accounting shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including but not limited to loss of profits, data, goodwill, or business interruption arising out of or related to the use of our services. Specific terms governing liability are outlined in our client engagement agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Professional Licensing</h2>
            <p>
              Ramirez Accounting is not a CPA firm and does not provide certified public accounting services unless explicitly stated in a separate written agreement. Clients requiring CPA services should engage a licensed Certified Public Accountant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p>
              If you have questions regarding this disclaimer, please contact us:
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
