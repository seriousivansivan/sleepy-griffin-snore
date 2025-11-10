"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { ModeratorSidebar } from "@/components/moderator/sidebar";

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Allow access if the user is a moderator OR an admin
      if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
        router.replace("/dashboard");
      }
    }
  }, [profile, loading, router]);

  if (loading || !profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading & Verifying Access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ModeratorSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted">
        {children}
      </main>
    </div>
  );
}