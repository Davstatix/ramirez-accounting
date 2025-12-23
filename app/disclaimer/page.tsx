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
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Professional Services Disclaimer</h2>
            <p>
              Ramirez Accounting provides bookkeeping and accounting services. The information on this website 
              and the services we provide are for general informational purposes and do not constitute professional 
              tax, legal, or financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Not Tax or Legal Advice</h2>
            <p>
              Our bookkeeping services are designed to help you maintain accurate financial records. We do not 
              provide tax preparation, tax planning, or legal advice. You should consult with a qualified tax 
              professional or attorney for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tax planning and strategy</li>
              <li>Tax return preparation and filing</li>
              <li>Legal compliance matters</li>
              <li>Business structure decisions</li>
              <li>Investment or financial planning advice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Accuracy of Information</h2>
            <p>
              While we strive for accuracy in our bookkeeping services, we rely on information and documents 
              provided by you. We are not responsible for errors resulting from incomplete, inaccurate, or 
              delayed information provided by clients.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">No Guarantee of Results</h2>
            <p>
              Past performance and results do not guarantee future outcomes. Our bookkeeping services are provided 
              on an "as-is" basis. We make no warranties, expressed or implied, regarding the accuracy, completeness, 
              or suitability of our services for your specific needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Services</h2>
            <p>
              Our services may integrate with third-party platforms (such as QuickBooks, Stripe, etc.). We are 
              not responsible for the availability, accuracy, or functionality of third-party services. Your use 
              of third-party services is subject to their respective terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Ramirez Accounting shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible 
              losses resulting from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Professional Licensing</h2>
            <p>
              Our services are provided by qualified accounting professionals. However, we are not a CPA firm 
              unless specifically stated. For certified public accounting services, please consult a licensed CPA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p>
              If you have questions about this disclaimer, please contact us:
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

