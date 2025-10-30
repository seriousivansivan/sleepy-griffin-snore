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
      // Removed .single() to handle potential multiple rows gracefully
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_companies(company_id)")
        .eq("id", currentSession.user.id)
        .limit(1); // Limit to 1 row

      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile(null);
      } else if (data && data.length > 0) {
        // Use the first profile found
        setProfile(data[0] as Profile);
      } else {
        // No profile found
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      await fetchProfile(session);

      // The 'INITIAL_SESSION' event is fired only once when the client initializes.
      // This is the perfect moment to know that the initial auth check is complete.
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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