'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Starting login...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError.message)
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        console.error('No user data returned')
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      console.log('Login successful! User ID:', data.user.id)
      console.log('Session exists:', !!data.session)

      // The session should be in data.session after signInWithPassword
      if (!data.session) {
        console.error('No session in login response')
        setError('Session not established. Please try again.')
        setLoading(false)
        return
      }

      // Wait for Supabase to persist the session
      // createBrowserClient automatically handles cookies, but we need to verify the session is accessible
      console.log('Verifying session is accessible...')
      let sessionReady = false
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 300))
        const { data: { session: checkSession }, error: sessionError } = await supabase.auth.getSession()
        if (checkSession && checkSession.user) {
          sessionReady = true
          console.log(`Session verified on attempt ${i + 1}/5`)
          console.log('User ID:', checkSession.user.id)
          break
        } else {
          console.log(`Check ${i + 1}/5 - Session: ${!!checkSession}, Error: ${sessionError?.message || 'none'}`)
        }
      }
      
      if (!sessionReady) {
        console.warn('Session not accessible after 5 attempts - trying redirect anyway...')
        // Continue anyway - sometimes cookies are set but not immediately readable
      } else {
        console.log('Session verified and ready!')
      }

      // Check user role and redirect accordingly
      let userRole = 'client' // Default to client
      
      try {
        console.log('Checking user profile...')
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.log('Profile error:', profileError.message)
          
          // If profile doesn't exist, try to create it
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, attempting to create...')
            const { data: newProfile, error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: data.user.email || '',
                role: 'client',
              }, {
                onConflict: 'id'
              })
              .select()
              .single()
            
            if (!upsertError && newProfile?.role) {
              userRole = newProfile.role.toLowerCase()
              console.log('Profile created, role:', userRole)
            } else {
              console.log('Failed to create profile, using default client role')
            }
          } else {
            console.log('Profile query failed, using default client role')
          }
        } else if (profileData?.role) {
          userRole = profileData.role.toLowerCase()
          console.log('Profile found, role:', userRole)
        }
      } catch (profileErr: any) {
        console.error('Error processing profile:', profileErr.message)
        // Continue with default client role
      }

      // Determine redirect path
      const redirectPath = userRole === 'admin' ? '/admin' : '/client'
      console.log('Redirecting to:', redirectPath)
      
      // Use a small delay to ensure cookies are set, then redirect
      setTimeout(() => {
        window.location.href = redirectPath
      }, 300)
      
    } catch (error: any) {
      console.error('Login error:', error.message || 'Unknown error')
      setError(error.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link!')
      setResetEmail('')
    }

    setResetLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showForgotPassword ? 'Reset your password' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Have an invite code?{' '}
            <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              Create an account
            </Link>
          </p>
        </div>

        {showForgotPassword ? (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {resetLoading ? 'Sending...' : 'Send reset link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false)
                  setError('')
                  setMessage('')
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to login
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  setError('')
                }}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
