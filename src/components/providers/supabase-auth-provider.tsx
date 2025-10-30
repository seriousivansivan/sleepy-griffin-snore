'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

const SupabaseAuthContext = createContext({
  user: null,
  loading: true,
})

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1️⃣ Get initial session from Supabase
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data?.session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // 2️⃣ Listen for session changes (login/logout/refresh)
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  return (
    <SupabaseAuthContext.Provider value={{ user, loading }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

// 3️⃣ Hook for easy use
export const useSupabaseAuth = () => useContext(SupabaseAuthContext)
