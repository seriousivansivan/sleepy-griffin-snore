"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { UserTable } from "@/components/admin/user-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/components/providers/supabase-auth-provider";

export default function ModeratorUserManagementPage() {
  const { supabase } = useSupabaseAuth();
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    // RLS policy will automatically filter this to only show managed users
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_companies(company_id)")
      .order("user_name", { ascending: true });

    if (error) {
      console.error("Failed to fetch managed users:", error);
    } else {
      setAllUsers(data as Profile[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return allUsers;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allUsers.filter((user) =>
      user.user_name?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [allUsers, searchTerm]);

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-6">Managed Users</h1>
      
      <div className="mb-4">
        <Input
          placeholder="Search users by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          onUserUpdated={fetchUsers}
          basePath="/moderator/users"
        />
      )}
    </div>
  );
}