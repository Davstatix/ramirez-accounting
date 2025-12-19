'use client'

import { useAuth } from '../providers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare,
  LogOut,
  Menu,
  X,
  BarChart3,
  Ticket
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (user) {
      checkAdminRole()
    }
  }, [user, loading, router])

  const checkAdminRole = async () => {
    if (!user) return

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error checking admin role:', error)
        router.push('/client')
        return
      }

      const userRole = profile?.role?.toLowerCase()
      if (userRole !== 'admin') {
        router.push('/client')
        return
      }

      setRoleLoading(false)
      loadUnreadCount()
    } catch (error) {
      console.error('Error in checkAdminRole:', error)
      router.push('/client')
    }
  }

  const loadUnreadCount = async () => {
    try {
      // Get unread messages from clients (not from admin)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .not('sender_id', 'eq', user?.id)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  // Refresh unread count periodically
  useEffect(() => {
    if (!roleLoading && user) {
      const interval = setInterval(loadUnreadCount, 30000) // every 30 seconds
      return () => clearInterval(interval)
    }
  }, [roleLoading, user])

  if (loading || roleLoading) {
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
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/clients/archived', label: 'Archived Clients', icon: FileText },
    { href: '/admin/invite-codes', label: 'Invite Codes', icon: Ticket },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/documents', label: 'Documents', icon: FileText },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
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
            const showBadge = item.href === '/admin/messages' && unreadCount > 0
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

