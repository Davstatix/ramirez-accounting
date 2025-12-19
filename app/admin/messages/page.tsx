'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Message {
    id: string
    client_id: string
    subject: string
    message: string
    read: boolean
    created_at: string
    sender_id: string
    parent_message_id: string | null
    thread_id: string | null
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    is_urgent: boolean
    client: {
        name: string
        company_name: string | null
    }
    sender: {
        email: string
        isAdmin: boolean
    }
}

export default function AdminMessagesPage() {
    const [threads, setThreads] = useState<Record<string, Message[]>>({})
    const [loading, setLoading] = useState(true)
    const [selectedThread, setSelectedThread] = useState<string | null>(null)
    const [replyMessage, setReplyMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const supabase = createClient()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        loadMessages()
        
        // Check for thread parameter in URL
        const urlParams = new URLSearchParams(window.location.search)
        const threadId = urlParams.get('thread')
        if (threadId) {
            setSelectedThread(threadId)
        }
    }, [statusFilter])

    // Mark messages as read when thread is selected
    useEffect(() => {
        if (selectedThread && currentUserId) {
            markThreadAsRead(selectedThread)
        }
    }, [selectedThread, currentUserId])

    const loadMessages = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUserId(user.id)

            // Load all messages (with optional status filter)
            let query = supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
            
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }
            
            const { data: messagesData, error: messagesError } = await query

            if (messagesError) {
                console.error('Error loading messages:', messagesError)
                setThreads({})
                setLoading(false)
                return
            }

            if (!messagesData || !Array.isArray(messagesData)) {
                console.error('Invalid messages data:', messagesData)
                setThreads({})
                setLoading(false)
                return
            }

            // Load clients and senders
            const clientIds = Array.from(new Set(messagesData.map((msg: any) => msg.client_id).filter(Boolean)))
            const senderIds = Array.from(new Set(messagesData.map((msg: any) => msg.sender_id).filter(Boolean)))
            
            let clientsMap: Record<string, any> = {}
            let sendersMap: Record<string, any> = {}
            
            if (clientIds.length > 0) {
                const { data: clientsData } = await supabase
                    .from('clients')
                    .select('id, name, company_name')
                    .in('id', clientIds)
                
                if (clientsData && Array.isArray(clientsData)) {
                    clientsMap = clientsData.reduce((acc, client) => {
                        acc[client.id] = client
                        return acc
                    }, {} as Record<string, any>)
                }
            }
            
            if (senderIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, email, role')
                    .in('id', senderIds)
                
                if (profilesData && Array.isArray(profilesData)) {
                    sendersMap = profilesData.reduce((acc, profile) => {
                        acc[profile.id] = { 
                            email: profile.email,
                            isAdmin: profile.role === 'admin'
                        }
                        return acc
                    }, {} as Record<string, any>)
                }
            }

            // Group messages by thread_id
            const threadsMap: Record<string, Message[]> = {}
            
            try {
                if (Array.isArray(messagesData)) {
                    messagesData.forEach((msg: any) => {
                        if (!msg || !msg.id) {
                            console.warn('Skipping invalid message:', msg)
                            return
                        }
                        
                        const threadId = msg.thread_id || msg.id
                        if (!threadsMap[threadId]) {
                            threadsMap[threadId] = []
                        }
                        
                        threadsMap[threadId].push({
                            ...msg,
                            client: clientsMap[msg.client_id] || { name: 'Unknown', company_name: null },
                            sender: sendersMap[msg.sender_id] || { email: 'Unknown', isAdmin: false },
                            status: msg.status || 'open',
                            is_urgent: msg.is_urgent || false,
                        })
                    })
                } else {
                    console.error('messagesData is not an array:', typeof messagesData, messagesData)
                }
            } catch (forEachError: any) {
                console.error('Error in forEach loop:', forEachError)
                console.error('messagesData type:', typeof messagesData)
                console.error('messagesData value:', messagesData)
                throw forEachError
            }

            // Sort messages within each thread by date
            Object.keys(threadsMap).forEach(threadId => {
                if (Array.isArray(threadsMap[threadId])) {
                    threadsMap[threadId].sort((a, b) => 
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                }
            })

            setThreads(threadsMap)
            
            // Check for thread parameter in URL first
            const urlParams = new URLSearchParams(window.location.search)
            const threadIdFromUrl = urlParams.get('thread')
            
            if (threadIdFromUrl && threadsMap[threadIdFromUrl]) {
                setSelectedThread(threadIdFromUrl)
            } else if (!selectedThread && Object.keys(threadsMap).length > 0) {
                // Auto-select first thread if none selected
                setSelectedThread(Object.keys(threadsMap)[0])
            }
        } catch (error: any) {
            console.error('Error loading messages:', error)
            console.error('Error details:', {
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            })
            setThreads({})
        } finally {
            setLoading(false)
        }
    }

    const handleSendReply = async (threadId: string) => {
        if (!replyMessage.trim() || !currentUserId) return

        setSending(true)
        try {
            const threadMessages = threads[threadId]
            const originalMessage = threadMessages[0]

            const { error } = await supabase.from('messages').insert({
                client_id: originalMessage.client_id,
                sender_id: currentUserId,
                subject: `Re: ${originalMessage.subject}`,
                message: replyMessage,
                parent_message_id: originalMessage.id,
                thread_id: threadId,
                status: 'in_progress',
                read: false,
            })

            if (error) throw error

            // Mark all messages in thread as read
            await supabase
                .from('messages')
                .update({ read: true, status: 'in_progress' })
                .eq('thread_id', threadId)

            // Send email notification to client
            fetch('/api/email/message-sent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: originalMessage.client_id,
                    subject: `Re: ${originalMessage.subject}`,
                    message: replyMessage,
                    senderType: 'admin',
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

    const markThreadAsRead = async (threadId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .update({ read: true })
                .eq('thread_id', threadId)
                .eq('read', false) // Only update unread messages
            
            if (error) {
                console.error('Error marking thread as read:', error)
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                })
            } else {
                // Reload messages to update UI
                loadMessages()
            }
        } catch (error) {
            console.error('Error marking thread as read:', error)
        }
    }

    const updateStatus = async (threadId: string, newStatus: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .update({ status: newStatus })
                .eq('thread_id', threadId)

            if (error) {
                console.error('Error updating status:', error)
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                })
                alert(`Failed to update status: ${error.message}`)
            } else {
                // Reload messages to show updated status
                loadMessages()
            }
        } catch (error: any) {
            console.error('Error updating status:', error)
            alert(`Failed to update status: ${error?.message || 'Unknown error'}`)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-100 text-blue-800'
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800'
            case 'resolved':
                return 'bg-green-100 text-green-800'
            case 'closed':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading messages...</div>
    }

    const threadList = Object.entries(threads)
    const filteredThreads = statusFilter === 'all' 
        ? threadList 
        : threadList.filter(([_, messages]) => messages[0].status === statusFilter)
    
    const currentThread = selectedThread ? threads[selectedThread] : null
    const unreadCount = threadList.reduce((sum, [_, msgs]) => 
        sum + msgs.filter(m => !m.read && !m.sender.isAdmin).length, 0
    )
    const openCount = threadList.filter(([_, msgs]) => msgs[0].status === 'open').length
    const urgentCount = threadList.filter(([_, msgs]) => msgs[0].is_urgent).length

    return (
        <div className="flex h-[calc(100vh-200px)] gap-4">
            {/* Thread List Sidebar */}
            <div className="w-80 bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="p-4 border-b">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-gray-900 mb-1">Messages</h1>
                        <p className="text-sm text-gray-600">
                            {unreadCount} unread • {openCount} open {urgentCount > 0 && `• ${urgentCount} urgent`}
                        </p>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm"
                    >
                        <option value="all">All Messages</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {filteredThreads.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No messages
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredThreads.map(([threadId, messages]) => {
                                const firstMessage = messages[0]
                                const lastMessage = messages[messages.length - 1]
                                const unreadCount = messages.filter(m => !m.read && !m.sender.isAdmin).length
                                
                                return (
                                    <button
                                        key={threadId}
                                        onClick={() => setSelectedThread(threadId)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                            selectedThread === threadId ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                                        } ${firstMessage.is_urgent ? 'border-r-4 border-red-500' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 text-sm truncate">
                                                    {firstMessage.client.company_name || firstMessage.client.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {firstMessage.subject}
                                                </p>
                                            </div>
                                            {unreadCount > 0 && (
                                                <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-400 line-clamp-1 flex-1">
                                                {lastMessage.message}
                                            </p>
                                            <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(firstMessage.status)}`}>
                                                {firstMessage.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
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
                {currentThread ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-4 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {currentThread[0].client.company_name || currentThread[0].client.name}
                                    </h2>
                                    <p className="text-sm text-gray-600">{currentThread[0].subject}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {currentThread[0].is_urgent && (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                            URGENT
                                        </span>
                                    )}
                                    <select
                                        value={currentThread[0].status}
                                        onChange={(e) => updateStatus(selectedThread!, e.target.value)}
                                        className={`px-3 py-1 text-xs font-semibold rounded border-0 ${getStatusColor(currentThread[0].status)}`}
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {currentThread.map((msg) => {
                                const isFromMe = msg.sender_id === currentUserId
                                const isClient = !msg.sender.isAdmin

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                                isFromMe
                                                    ? 'bg-primary-600 text-white'
                                                    : isClient
                                                    ? 'bg-gray-200 text-gray-900'
                                                    : 'bg-gray-100 text-gray-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-semibold ${
                                                    isFromMe ? 'text-white/90' : 'text-gray-600'
                                                }`}>
                                                    {isFromMe ? 'You' : isClient ? currentThread[0].client.name : 'Accountant'}
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
                        Select a conversation to view messages
                    </div>
                )}
            </div>
        </div>
    )
}
