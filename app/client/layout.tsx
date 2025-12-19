'use client'

import { useAuth } from '../providers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  FileText, 
  MessageSquare,
  LogOut,
  Menu,
  X,
  BarChart3,
  LayoutDashboard,
  Settings
} from 'lucide-react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [roleChecked, setRoleChecked] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Check if user is admin and redirect immediately
    if (user && !roleChecked) {
      checkAdminRole()
    }
  }, [user, loading, router, roleChecked])

  const checkAdminRole = async () => {
    if (!user) return

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single()

      if (error) {
        setRoleChecked(true)
        return
      }

      const userRole = profile?.role?.toLowerCase()
      
      if (userRole === 'admin') {
        window.location.replace('/admin')
        return
      }

      setRoleChecked(true)
      loadUnreadCount()
    } catch (error) {
      setRoleChecked(true)
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (client) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('read', false)
          .neq('sender_id', user.id)

        setUnreadCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  // Refresh unread count periodically and on focus
  useEffect(() => {
    if (roleChecked && user) {
      const interval = setInterval(loadUnreadCount, 10000) // every 10 seconds
      const handleFocus = () => loadUnreadCount()
      window.addEventListener('focus', handleFocus)
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [roleChecked, user])

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/reports', label: 'Reports', icon: BarChart3 },
    { href: '/client/documents', label: 'Documents', icon: FileText },
    { href: '/client/messages', label: 'Messages', icon: MessageSquare },
    { href: '/client/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary-700">Ramirez Accounting</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const showBadge = item.href === '/client/messages' && unreadCount > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
                {showBadge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

