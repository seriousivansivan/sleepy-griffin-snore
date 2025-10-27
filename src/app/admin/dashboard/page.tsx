"use client";

import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Building, Ticket, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Stats = {
  users: number;
  companies: number;
  vouchers: number;
};

export default function AdminDashboardPage() {
  const { supabase } = useSupabaseAuth();
  const [stats, setStats] = useState<Stats>({ users: 0, companies: 0, vouchers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch all stats in a single RPC call
        const { data, error } = await supabase.rpc("get_admin_dashboard_stats");

        if (error) {
          throw error;
        }

        const fetchedStats = data as Stats;

        setStats({
          users: fetchedStats.users ?? 0,
          companies: fetchedStats.companies ?? 0,
          vouchers: fetchedStats.vouchers ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        toast.error("Failed to load dashboard statistics.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Dashboard
          </Link>
        </Button>
      </div>
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