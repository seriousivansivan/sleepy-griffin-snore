"use client";

import { CompleteProfileForm } from "@/components/complete-profile-form";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CompleteProfilePage() {
  const { session, profile, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/login");
      } else if (profile?.user_name && profile?.user_companies?.length > 0) {
        // Profile is complete, redirect to dashboard
        router.replace("/dashboard");
      }
    }
  }, [session, profile, loading, router]);

  if (loading || !session || (profile?.user_name && profile?.user_companies?.length > 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please tell us a bit more about yourself before you continue.
          </p>
        </div>
        <div className="p-8 rounded-lg shadow-lg bg-white">
          <CompleteProfileForm />
        </div>
      </div>
    </div>
  );
}