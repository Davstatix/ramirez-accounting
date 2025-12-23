import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance for client-side Supabase client
let supabaseClient: SupabaseClient | null = null

// Client-side Supabase client (for use in client components)
// Uses @supabase/ssr's createBrowserClient to ensure cookies are used instead of localStorage
// This is required for middleware to see the session
export function createClient() {
  // Return existing instance if already created
  if (supabaseClient) {
    return supabaseClient
  }

  // Create new instance using createBrowserClient from @supabase/ssr
  // This ensures cookies are used, which middleware can read
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseClient
}

