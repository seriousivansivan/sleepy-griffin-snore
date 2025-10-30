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
  const { profile, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect is now ONLY for the side-effect of redirection.
    // It does not manage any local state.
    if (!loading) {
      if (!profile || profile.role !== "admin") {
        // If the initial load is finished and the user is not an admin,
        // redirect them away.
        router.replace("/dashboard");
      }
    }
  }, [profile, loading, router]);

  // The rendering logic is now stateless and directly tied to the auth context.
  // We show a loading screen if:
  // 1. The initial auth check is still running (`loading` is true).
  // 2. The user is not an admin (the useEffect above will then redirect them).
  if (loading || !profile || profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading & Verifying Access...</p>
      </div>
    );
  }

  // If we reach this point, it means `loading` is false AND we have a
  // profile that is confirmed to be an admin. We can safely render the layout.
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted">
        {children}
      </main>
    </div>
  );
}