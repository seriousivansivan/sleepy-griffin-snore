"use client";

import { useEffect, useState } from "react";
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
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // This effect handles the logic for verification and redirection.
    if (!loading) {
      if (profile && profile.role === "admin") {
        // Once we confirm the user is an admin, we set verification to true.
        // This will prevent the loading screen from showing up on subsequent re-renders (e.g., tab focus).
        setIsVerified(true);
      } else {
        // If the user is not loading and is not an admin (or has no profile),
        // redirect them away from the admin section.
        router.replace("/dashboard");
      }
    }
  }, [profile, loading, router]);

  // The loading screen is now only shown if the initial verification has not yet passed.
  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading & Verifying Access...</p>
      </div>
    );
  }

  // Once verified, we render the actual admin layout.
  // The useEffect above will continue to run in the background and handle any
  // potential loss of session or change in role, ensuring security.
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted">
        {children}
      </main>
    </div>
  );
}