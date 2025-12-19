import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, FileText, Calculator, TrendingUp, Shield, Calendar, Star, Award, Zap, BarChart3, Users, Lock, Database, Key, Server, Eye, Fingerprint } from 'lucide-react'
import ContactForm from '@/components/ContactForm'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-700">Ramirez Accounting</h1>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="#services" className="text-gray-700 hover:text-primary-600">Services</Link>
              <Link href="#security" className="text-gray-700 hover:text-primary-600">Security</Link>
              <Link href="#about" className="text-gray-700 hover:text-primary-600">About</Link>
              <Link href="#contact" className="text-gray-700 hover:text-primary-600">Contact</Link>
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Client Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <span className="text-white text-sm font-medium">Trusted by Growing Businesses</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Level Up Your Business
              <span className="block text-primary-200 mt-2">With Expert Financial Management</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Professional bookkeeping that gives you clarity, control, and confidence to make smarter financial decisions. 
              Let us handle the numbers so you can focus on growing your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="#contact"
                className="bg-white text-primary-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-xl inline-flex items-center justify-center gap-2"
              >
                <Calendar className="h-5 w-5" />
                Book a Free Discovery Call
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#services"
                className="bg-transparent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all border-2 border-white/30 backdrop-blur-sm"
              >
                Explore Our Services
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/90">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-300" />
                <span className="text-sm">Enterprise-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-sm">Professional Expertise</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-300" />
                <span className="text-sm">Encrypted Document Storage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">What We Offer</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Comprehensive Bookkeeping Solutions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
              Everything you need to keep your finances organized and your business on track
            </p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-primary-600" />
              All services backed by enterprise-grade security and encryption
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-white to-primary-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all transform hover:-translate-y-1">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Monthly Bookkeeping</h3>
              <p className="text-gray-600 leading-relaxed">
                Regular categorization of transactions, bank reconciliations, and up-to-date financial records that keep you informed.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-primary-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all transform hover:-translate-y-1">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bank & Credit Card Reconciliations</h3>
              <p className="text-gray-600 leading-relaxed">
                Accurate reconciliation of all bank accounts and credit cards to ensure your books are perfectly balanced.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-primary-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all transform hover:-translate-y-1">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Financial Statements</h3>
              <p className="text-gray-600 leading-relaxed">
                Monthly Profit & Loss statements and Balance Sheets to track your business performance and make data-driven decisions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-primary-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all transform hover:-translate-y-1">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Catch-Up Bookkeeping</h3>
              <p className="text-gray-600 leading-relaxed">
                Get your books up to date if you've fallen behind. We'll organize and reconcile past periods quickly and accurately.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-primary-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all transform hover:-translate-y-1">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fix Messy Books</h3>
              <p className="text-gray-600 leading-relaxed">
                One-time service to clean up and organize disorganized financial records. Get back on track fast.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-primary-50 p-8 rounded-xl border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all transform hover:-translate-y-1">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Year-End Tax Preparation</h3>
              <p className="text-gray-600 leading-relaxed">
                Prepare all necessary documents and reports for tax filing efficiently and save you time during tax season.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">Why Choose Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">The Trusted Choice for Growing Businesses</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We combine accounting expertise with modern technology to help your business thrive
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional Expertise</h3>
              <p className="text-gray-600 leading-relaxed">
                Our accountant brings professional-grade service and deep accounting knowledge to ensure your books are accurate and compliant.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Infrastructure</h3>
              <p className="text-gray-600 leading-relaxed">
                Secure document storage and encryption through Supabase infrastructure. 
                Your financial data is protected with access controls and secure cloud storage.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Modern Technology</h3>
              <p className="text-gray-600 leading-relaxed">
                Secure client portal for easy document sharing and real-time access to your financial reports, 
                built on enterprise-grade infrastructure you can trust.
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="bg-primary-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h3 className="text-3xl font-bold mb-6">Ready to Level Up Your Finances?</h3>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join businesses that trust us to keep their books organized and their financial future bright.
            </p>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-xl"
            >
              <Calendar className="h-5 w-5" />
              Schedule Your Free Discovery Call
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-primary-400/30">
              <Shield className="h-4 w-4 text-primary-300" />
              <span className="text-primary-200 text-sm font-medium">Enterprise-Grade Security</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Your Financial Data is Protected</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We take security seriously. Your sensitive financial documents and data are protected with 
              industry-leading encryption and security measures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="bg-primary-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Lock className="h-7 w-7 text-primary-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Encryption</h3>
              <p className="text-gray-300 leading-relaxed">
                All documents and data are encrypted in transit using TLS and stored securely on Supabase infrastructure, 
                which uses industry-standard encryption to protect sensitive data.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="bg-primary-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Database className="h-7 w-7 text-primary-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Cloud Storage</h3>
              <p className="text-gray-300 leading-relaxed">
                Documents are stored on Supabase infrastructure, which maintains SOC 2 Type 2 compliance certification. 
                Your data is protected with secure cloud storage and access controls.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="bg-primary-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Key className="h-7 w-7 text-primary-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Row-Level Security</h3>
              <p className="text-gray-300 leading-relaxed">
                Advanced access controls ensure that only authorized users can view their own data. 
                Each client's information is completely isolated and protected.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="bg-primary-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Fingerprint className="h-7 w-7 text-primary-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Authentication</h3>
              <p className="text-gray-300 leading-relaxed">
                Secure password-based authentication protects your account. 
                All login sessions are encrypted and handled through Supabase's secure authentication system.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="bg-primary-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Server className="h-7 w-7 text-primary-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Data Protection</h3>
              <p className="text-gray-300 leading-relaxed">
                Your data is stored on Supabase infrastructure, which provides automatic backups and data protection. 
                Your financial records are protected against data loss.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="bg-primary-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Eye className="h-7 w-7 text-primary-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Access Controls</h3>
              <p className="text-gray-300 leading-relaxed">
                Row-level security policies ensure that only authorized users can access their own data. 
                Each client's information is completely isolated and protected from unauthorized access.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-600/20 to-primary-500/20 backdrop-blur-sm border border-primary-400/30 rounded-2xl p-8 text-center">
            <div className="flex flex-wrap justify-center items-center gap-8 mb-6">
              <div className="flex items-center gap-2 text-white/90">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">Secure Infrastructure</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Lock className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">Encrypted Storage</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Database className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium">Row-Level Security</span>
              </div>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Built on Supabase infrastructure with encryption and security measures to protect your financial data. 
              Your information is secured with access controls and secure storage.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">Meet The Team</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">The Brothers Behind Ramirez Accounting</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A family-owned firm combining accounting expertise with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Johan */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-xl opacity-50"></div>
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-200">
                  {/* Placeholder for Johan's photo - replace with actual image */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <Users className="h-24 w-24 text-primary-600" />
                  </div>
                  {/* Uncomment and use this when you have the actual photo:
                  <Image
                    src="/images/johan.jpg"
                    alt="Johan Ramirez"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 192px, 192px"
                  />
                  */}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Johan Ramirez</h3>
              <p className="text-primary-600 font-semibold mb-4">Accountant & Co-Founder</p>
              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Johan brings his expertise as an accountant with a <strong>BS in Accounting</strong> and extensive 
                  experience in financial management and bookkeeping.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  His deep understanding of accounting principles and meticulous attention to detail ensures your books are 
                  accurate, compliant, and ready for growth. Johan specializes in financial analysis and helps businesses 
                  understand their numbers to make better decisions.
                </p>
              </div>
            </div>

            {/* David */}
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-xl opacity-50"></div>
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-200">
                  {/* Placeholder for David's photo - replace with actual image */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <Users className="h-24 w-24 text-primary-600" />
                  </div>
                  {/* Uncomment and use this when you have the actual photo:
                  <Image
                    src="/images/david.jpg"
                    alt="David Ramirez"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 192px, 192px"
                  />
                  */}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">David Ramirez</h3>
              <p className="text-primary-600 font-semibold mb-4">Software Engineer & Co-Founder</p>
              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <p className="text-gray-700 leading-relaxed mb-4">
                  David is a <strong>software engineer</strong> who has built our modern, secure platform to make 
                  bookkeeping seamless for both our team and our clients.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  By combining accounting expertise with cutting-edge technology, David ensures that our clients have 
                  access to real-time financial data through our secure portal. His technical background allows us to 
                  deliver efficient, automated solutions that save time and reduce errors.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-8">
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
              <strong className="text-gray-900">Together</strong>, we combine Johan's accounting expertise with David's 
              technical innovation to deliver exceptional bookkeeping services. We're not just number-crunchers—we're 
              your partners in financial success, helping you understand your business better and make smarter decisions 
              that drive growth.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">Let's Talk</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Book Your Free Discovery Call</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to level up your finances? Let's discuss how we can help your business thrive. 
              No obligation, just a conversation about your goals.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            <div className="mb-8 space-y-4">
              <div className="p-6 bg-primary-50 rounded-xl border border-primary-100">
                <div className="flex items-start gap-4">
                  <Calendar className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">What to Expect</h3>
                    <p className="text-gray-700 text-sm">
                      During your free discovery call, we'll discuss your business needs, answer your questions, 
                      and show you how we can help streamline your finances. Typically 15-30 minutes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Your Data is Secure</h3>
                    <p className="text-gray-700 text-sm">
                      All information shared is protected with encryption and secure storage. 
                      We use secure infrastructure with access controls to ensure your financial data remains confidential and protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Ramirez Accounting</h3>
              <p className="text-gray-400">
                Professional bookkeeping services for your business.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#services" className="hover:text-white">Services</Link></li>
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/login" className="hover:text-white">Client Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Email: davidr2505@gmail.com<br />
                Phone: (631) 220-8511
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Ramirez Accounting. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

