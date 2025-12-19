'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MessageSquare, Send, Reply } from 'lucide-react'

interface Message {
  id: string
  subject: string
  message: string
  read: boolean
  created_at: string
  sender_id: string
  parent_message_id: string | null
  thread_id: string | null
  sender: {
    email: string
    isAdmin: boolean
  }
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Record<string, Message[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!client) return

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        setThreads({})
        return
      }

      // Load sender profiles and check if admin
      const senderIds = [...new Set((messagesData || []).map((msg: any) => msg.sender_id).filter(Boolean))]
      let sendersMap: Record<string, any> = {}
      
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, role')
          .in('id', senderIds)
        
        if (profilesData) {
          sendersMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = { 
              email: profile.email,
              isAdmin: profile.role === 'admin'
            }
            return acc
          }, {} as Record<string, any>)
        }
      }

      // Group messages by thread_id (use id if no thread_id)
      const threadsMap: Record<string, Message[]> = {}
      
      if (messagesData && Array.isArray(messagesData)) {
        messagesData.forEach((msg: any) => {
          const threadId = msg.thread_id || msg.id
          if (!threadsMap[threadId]) {
            threadsMap[threadId] = []
          }
          threadsMap[threadId].push({
            ...msg,
            sender: sendersMap[msg.sender_id] || { email: 'Johan Ramirez', isAdmin: true },
          })
        })

        // Sort messages within each thread by date
        Object.keys(threadsMap).forEach(threadId => {
          if (Array.isArray(threadsMap[threadId])) {
            threadsMap[threadId].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          }
        })
      }

      setThreads(threadsMap)
      
      // Auto-select first thread if none selected
      if (!selectedThread && Object.keys(threadsMap).length > 0) {
        setSelectedThread(Object.keys(threadsMap)[0])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markThreadAsRead = async (threadId: string) => {
    if (!currentUserId) return

    // Mark all unread messages in this thread as read (except ones sent by current user)
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .or(`thread_id.eq.${threadId},id.eq.${threadId}`)
      .eq('read', false)
      .neq('sender_id', currentUserId)

    if (error) {
      console.error('Error marking messages as read:', error)
    } else {
      // Update local state
      setThreads(prev => ({
        ...prev,
        [threadId]: prev[threadId]?.map(m => 
          m.sender_id !== currentUserId ? { ...m, read: true } : m
        ) || []
      }))
    }
  }

  const handleSelectThread = async (threadId: string) => {
    setSelectedThread(threadId)
    await markThreadAsRead(threadId)
  }

  const handleSendReply = async (threadId: string) => {
    if (!replyMessage.trim() || !currentUserId) return

    setSending(true)
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', currentUserId)
        .single()

      if (!client) return

      const threadMessages = threads[threadId]
      const originalMessage = threadMessages[0]

      const { error } = await supabase.from('messages').insert({
        client_id: client.id,
        sender_id: currentUserId,
        subject: `Re: ${originalMessage.subject}`,
        message: replyMessage,
        parent_message_id: originalMessage.id,
        thread_id: threadId,
        read: false,
      })

      if (error) throw error

      // Send email notification to admin
      fetch('/api/email/message-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          subject: `Re: ${originalMessage.subject}`,
          message: replyMessage,
          senderType: 'client',
        }),
      }).catch(err => console.error('Failed to send email:', err))

      setReplyMessage('')
      loadMessages()
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleSendNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject || !newMessage || !currentUserId) return

    setSending(true)
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', currentUserId)
        .single()

      if (!client) return

      const { error } = await supabase.from('messages').insert({
        client_id: client.id,
        sender_id: currentUserId,
        subject: newSubject,
        message: newMessage,
        read: false,
      })

      if (error) throw error

      // Send email notification to admin
      fetch('/api/email/message-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          subject: newSubject,
          message: newMessage,
          senderType: 'client',
        }),
      }).catch(err => console.error('Failed to send email:', err))

      setNewSubject('')
      setNewMessage('')
      setShowNewMessage(false)
      loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading messages...</div>
  }

  const threadList = Object.entries(threads)
  const currentThread = selectedThread ? threads[selectedThread] : null

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Thread List Sidebar */}
      <div className="w-80 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowNewMessage(true)}
              className="bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 text-sm flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              New
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {threadList.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No messages yet
            </div>
          ) : (
            <div className="divide-y">
              {threadList.map(([threadId, messages]) => {
                const firstMessage = messages[0]
                const lastMessage = messages[messages.length - 1]
                const unreadCount = messages.filter(m => !m.read && m.sender.isAdmin).length
                
                return (
                  <button
                    key={threadId}
                    onClick={() => handleSelectThread(threadId)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedThread === threadId ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {firstMessage.subject}
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-1">
                      {lastMessage.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(lastMessage.created_at).toLocaleDateString()}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Message Thread View */}
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
        {showNewMessage ? (
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessage(false)
                  setNewSubject('')
                  setNewMessage('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleSendNew} className="flex-1 flex flex-col">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
              <div className="flex-1 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={10}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        ) : currentThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{currentThread[0].subject}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentThread.map((msg) => {
                const isFromMe = msg.sender_id === currentUserId
                const isAdmin = msg.sender.isAdmin

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isFromMe
                          ? 'bg-primary-600 text-white'
                          : isAdmin
                          ? 'bg-gray-200 text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${
                          isFromMe ? 'text-white/90' : 'text-gray-600'
                        }`}>
                          {isFromMe ? 'You' : isAdmin ? 'Johan Ramirez' : msg.sender.email}
                        </span>
                        <span className={`text-xs ${
                          isFromMe ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className={`whitespace-pre-wrap ${
                        isFromMe ? 'text-white' : 'text-gray-900'
                      }`}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                />
                <button
                  onClick={() => handleSendReply(selectedThread!)}
                  disabled={sending || !replyMessage.trim()}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation or start a new message
          </div>
        )}
      </div>
    </div>
  )
}
