"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { ModeratorUserDetailForm } from "@/components/moderator/moderator-user-detail-form";
import { UserActivityOverview } from "@/components/admin/user-activity-overview";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ModeratorUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { supabase } = useSupabaseAuth();
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setError("User ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // RLS ensures moderator can only fetch their managed users
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_companies(company_id)")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user details:", error);
      setError("Could not load user details. You may not have permission to view this user.");
      setUser(null);
    } else {
      setUser(data as Profile);
      setError(null);
    }
    setIsLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-[500px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-destructive mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">User Not Found</h2>
        <p>The requested user could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-3xl font-bold">Edit User: {user.user_name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ModeratorUserDetailForm user={user} onUserUpdated={fetchUser} />
        </div>
        <div className="lg:col-span-2">
          <UserActivityOverview user={user} />
        </div>
      </div>
    </div>
  );
}