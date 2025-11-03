"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const SupabaseAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentSession: Session | null) => {
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
  };

  useEffect(() => {
    const initialSetup = async () => {
      // 1. Perform an immediate check for the session status
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      setSession(initialSession);
      await fetchProfile(initialSession);
      
      // 2. Set loading to false immediately after the initial check
      setLoading(false);

      // 3. Set up the real-time listener for future changes (e.g., sign in/out)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        await fetchProfile(session);
      });

      // The cleanup function will unsubscribe from the listener when the component unmounts.
      return () => {
        subscription.unsubscribe();
      };
    };

    initialSetup();
  }, []);

  const refreshProfile = async () => {
    // Get the latest session data before fetching the profile to ensure consistency.
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);
    await fetchProfile(currentSession);
  };

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
    throw new Error(
      "useSupabaseAuth must be used within a SupabaseAuthProvider"
    );
  }
  return context;
};