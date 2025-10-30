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
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    } else {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    // This function can still be called manually, but it won't trigger the global loading state.
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await fetchProfile(currentSession);
  }, [fetchProfile]);

  useEffect(() => {
    // Set loading to true initially
    setLoading(true);

    // Listen for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Update session and profile for all events
      setSession(session);
      await fetchProfile(session);

      // The 'INITIAL_SESSION' event is crucial. It fires once when the client
      // is initialized, and it confirms that the session has been restored.
      // We stop the loading state only after this event has been handled.
      if (event === "INITIAL_SESSION") {
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