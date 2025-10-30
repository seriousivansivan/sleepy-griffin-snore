"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Define a type for our profile data
export type Profile = {
  id: string;
  user_name: string | null;
  role: string;
  monthly_credit_allowance: number | null;
  credit: number | null;
  has_unlimited_credit: boolean | null;
  updated_at: string;
  user_companies: { company_id: string }[];
};

type SupabaseContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  profile: Profile | null;
  loading: boolean; // This now only represents the initial load
  refreshProfile: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // True only on initial mount

  const fetchProfile = useCallback(async (currentSession: Session | null) => {
    if (currentSession) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_companies(company_id)")
        .eq("id", currentSession.user.id)
        .limit(1);

      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile(null);
      } else if (data && data.length > 0) {
        setProfile(data[0] as Profile);
      } else {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await fetchProfile(currentSession);
  }, [fetchProfile]);

  // 1. Initial Load Effect: Fetch session and profile immediately on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Get session immediately
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);

      // 2. Fetch profile based on that session
      await fetchProfile(initialSession);

      // 3. Mark loading complete only after both are done
      setLoading(false);
    };

    loadInitialData();

    // 2. Listener Effect: Set up listener for real-time changes (sign in/out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle changes, not the initial load (which we handled above)
      if (event !== 'INITIAL_SESSION') {
        setSession(session);
        await fetchProfile(session);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]); // fetchProfile is the only dependency

  const value = {
    supabase,
    session,
    profile,
    loading,
    refreshProfile,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseContext);
  if (context === null) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
};