"use client";

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading, profile } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        // 1. Not authenticated -> Login
        router.replace("/login");
      } else if (!profile?.user_name || profile.user_companies.length === 0) {
        // 2. Authenticated but profile incomplete -> Complete Profile
        router.replace("/complete-profile");
      }
      // 3. If authenticated and profile complete, render children
    }
  }, [session, loading, profile, router]);

  // Show loading screen while session is being restored or profile is fetched/verified
  if (loading || !session || !profile || profile.user_companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // If we reach here, the user is authenticated, profile is loaded, and complete.
  return <>{children}</>;
}