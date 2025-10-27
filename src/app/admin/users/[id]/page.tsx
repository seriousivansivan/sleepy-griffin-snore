"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { UserDetailForm } from "@/components/admin/user-detail-form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Profile } from "@/components/providers/supabase-auth-provider";

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { supabase } = useSupabaseAuth();
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
    // Fetch user profile along with their company associations
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_companies(company_id)")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user details:", error);
      setError("Could not load user details. The user may not exist.");
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
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-destructive mb-4">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">User Not Found</h2>
        <p>The requested user could not be loaded.</p>
      </div>
    );
  }

  return <UserDetailForm user={user} onUserUpdated={fetchUser} />;
}