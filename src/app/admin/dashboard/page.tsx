"use client";

import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Building, Ticket } from "lucide-react";

export default function AdminDashboardPage() {
  const { supabase } = useSupabaseAuth();
  const [stats, setStats] = useState({ users: 0, companies: 0, vouchers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [
          { count: usersCount },
          { count: companiesCount },
          { count: vouchersCount },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("companies").select("*", { count: "exact", head: true }),
          supabase.from("vouchers").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          users: usersCount ?? 0,
          companies: companiesCount ?? 0,
          vouchers: vouchersCount ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users"
          value={stats.users}
          isLoading={isLoading}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Companies"
          value={stats.companies}
          isLoading={isLoading}
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Vouchers"
          value={stats.vouchers}
          isLoading={isLoading}
          icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}