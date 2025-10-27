"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { UserTable } from "@/components/admin/user-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/components/providers/supabase-auth-provider";

export default function UserManagementPage() {
  const { supabase } = useSupabaseAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_companies(company_id)")
      .order("user_name", { ascending: true });

    if (error) {
      console.error("Failed to fetch users:", error);
    } else {
      setUsers(data as Profile[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <UserTable users={users} onUserUpdated={fetchUsers} />
      )}
    </div>
  );
}