"use client";

import { createContext, useContext, useEffect, useState } from "react";
// --- 1. MAKE SURE 'Session' IS IMPORTED ---
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

// --- 2. ACCEPT THE 'session' PROP ---
export const SupabaseAuthProvider = ({
  children,
  session: serverSession, // Give the prop a new name to avoid state conflicts
}: {
  children: React.ReactNode;
  session: Session | null; // This is the prop from layout.tsx
}) => {
  
  // --- 3. USE THE PROP AS THE INITIAL STATE ---
  const [session, setSession] = useState<Session | null>(serverSession);
  const [user, setUser] = useState<User | null>(serverSession?.user ?? null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // This is still correct
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
    // This function will now run with the serverSession already set
    const initializeAuth = async () => {
      try {
        // getSession() will be fast because the cookie is already there.
        // It will just confirm the serverSession.
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();
        
        // If the session has changed (e.g., user logged out in another tab),
        // this will update the state.
        if (existingSession?.access_token !== session?.access_token) {
           setSession(existingSession);
           setUser(existingSession?.user ?? null);
        }

        await fetchProfile(existingSession);
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth event:", event);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      await fetchProfile(currentSession);
      setLoading(false);

      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        router.refresh();
      }
    });

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log("Tab visible - refreshing session");
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          await supabase.auth.refreshSession();
          router.refresh();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, session]); // Add 'session' to dependency array

  const refreshProfile = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    await fetchProfile(currentSession);
    router.refresh();
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