"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Ticket, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

type DashboardStats = {
  managed_users: number;
  total_vouchers: number;
};

export default function ModeratorDashboardPage() {
  const { supabase, session, loading, profile } = useSupabaseAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!session || (profile?.role !== "moderator" && profile?.role !== "admin"))) {
      router.replace("/dashboard");
    }
  }, [session, loading, profile, router]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_moderator_dashboard_stats");
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error("Error fetching moderator stats:", error);
      toast.error("Failed to load dashboard statistics.");
    } finally {
      setStatsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (profile?.role === "moderator" || profile?.role === "admin") {
      fetchStats();
    }
  }, [profile, fetchStats]);

  if (loading || !session || (profile?.role !== "moderator" && profile?.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Moderator Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to User Dashboard
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <StatCard
          title="Managed Users"
          value={stats?.managed_users ?? 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading}
          href="/moderator/users"
        />
        <StatCard
          title="Total Vouchers from Users"
          value={stats?.total_vouchers ?? 0}
          icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading}
          href="/moderator/vouchers"
        />
      </div>
      <div>
        <p className="text-muted-foreground">
          This dashboard provides an overview of the users and vouchers you manage.
        </p>
      </div>
    </div>
  );
}