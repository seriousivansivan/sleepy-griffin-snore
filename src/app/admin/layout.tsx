"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!profile || profile.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [profile, loading, router]);

  // This effect will trigger a session refresh when the tab becomes visible again.
  // The onAuthStateChange listener in the provider will then handle the profile update gracefully.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase]);

  if (loading || !profile || profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading & Verifying Access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted">
        {children}
      </main>
    </div>
  );
}