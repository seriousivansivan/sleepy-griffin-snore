"use client";

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { session, supabase, loading, profile } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/login");
      } else if (!profile?.user_name || profile.user_companies.length === 0) {
        router.replace("/complete-profile");
      }
    }
  }, [session, loading, router, profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || !session || !profile?.user_name || profile.user_companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to your Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">
          You are logged in as: {profile.user_name}
        </p>
        <Button onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}