"use client";

import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Building, Ticket } from "lucide-react";
import { toast } from "sonner";

type DashboardStats = {
  users: number;
  companies: number;
  vouchers: number;
};

export default function AdminDashboardPage() {
  const { supabase, session, loading, profile } = useSupabaseAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!session || profile?.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [session, loading, profile, router]);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast.error("Failed to load dashboard statistics.");
      } finally {
        setStatsLoading(false);
      }
    };

    if (profile?.role === "admin") {
      fetchStats();
    }
  }, [supabase, profile]);

  if (loading || !session || profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.users ?? 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading}
          href="/admin/users"
        />
        <StatCard
          title="Total Companies"
          value={stats?.companies ?? 0}
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading}
          href="/admin/companies"
        />
        <StatCard
          title="Total Vouchers"
          value={stats?.vouchers ?? 0}
          icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading}
          href="/admin/vouchers"
        />
      </div>
      <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Welcome, Admin!
        </h2>
        <p className="text-gray-600">
          Use the cards above to navigate to different management sections. You
          can manage users, companies, and vouchers for the entire application
          from this panel.
        </p>
      </div>
    </div>
  );
}