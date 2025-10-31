"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";

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
  user: User | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

// Update props to accept the server-side session
export const SupabaseAuthProvider = ({
  children,
  session: serverSession, // Rename to avoid conflict
}: {
  children: React.ReactNode;
  session: Session | null;
}) => {
  // Initialize state with the server-side session
  const [session, setSession] = useState<Session | null>(serverSession);
  const [user, setUser] = useState<User | null>(serverSession?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Start with loading as false if we have a server session, otherwise true
  const [loading, setLoading] = useState(serverSession === null);
  const router = useRouter();

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
    // Fetch profile immediately if we have a server session
    if (serverSession) {
      fetchProfile(serverSession).finally(() => setLoading(false));
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth event:", event);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      await fetchProfile(currentSession);
      setLoading(false);

      // Refresh the router cache when auth state changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
    });

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log("Tab visible - refreshing session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          await supabase.auth.refreshSession();
          router.refresh(); // Refresh router when tab becomes visible
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, serverSession]); // Depend on serverSession to re-run if it changes

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await fetchProfile(currentSession);
    router.refresh(); // Add router refresh here too
  };

  const value = {
    supabase,
    session,
    profile,
    user,
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