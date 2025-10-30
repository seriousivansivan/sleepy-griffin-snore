"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Building, Ticket, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TimeFilter, TimeRange, calculateDateRange } from "@/components/admin/time-filter";
import { VoucherCompanyDistributionChart } from "@/components/admin/voucher-company-distribution-chart";
import { VoucherActivityChart } from "@/components/admin/voucher-activity-chart";
import type { Voucher } from "@/components/voucher-list";
import { formatISO } from "date-fns";
import { CompanyStatsCarousel, CompanyStat } from "@/components/admin/company-stats-carousel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

type DashboardStats = {
  users: number;
  companies: number;
  vouchers: number;
};

type ActivityData = {
  activity_date: string;
  total_amount: number;
};

export default function AdminDashboardPage() {
  const { supabase, session, loading, profile } = useSupabaseAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [timeRange, setTimeRange] = useState<TimeRange>("this_month");
  const [chartVouchers, setChartVouchers] = useState<Voucher[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!session || profile?.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [session, loading, profile, router]);

  const fetchDashboardData = useCallback(async (range: TimeRange) => {
    setChartsLoading(true);
    try {
      const { start, end } = calculateDateRange(range);
      const p_start_date = start ? formatISO(start) : null;
      const p_end_date = end ? formatISO(end) : null;

      const [vouchersRes, activityRes, companyStatsRes] = await Promise.all([
        supabase.rpc("get_all_vouchers_for_admin", { p_start_date, p_end_date }),
        supabase.rpc("get_voucher_activity_for_admin", {
          p_start_date: start ? formatISO(start) : formatISO(new Date(0)), // Use epoch for start if null
          p_end_date: end ? formatISO(end) : formatISO(new Date()),       // Use now for end if null
        }),
        supabase.rpc("get_company_voucher_stats", { p_start_date, p_end_date })
      ]);

      if (vouchersRes.error) throw vouchersRes.error;
      if (vouchersRes.data && vouchersRes.data.length > 0) {
        const companyIds = [...new Set(vouchersRes.data.map((v: any) => v.company_id))];
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);
        if (companiesError) throw companiesError;
        
        const companyMap = new Map(companiesData.map(c => [c.id, c]));
        const formattedVouchers = vouchersRes.data.map((v: any) => ({
          ...v,
          details: v.details as Voucher["details"],
          companies: companyMap.get(v.company_id) || null,
          user: null,
        }));
        setChartVouchers(formattedVouchers);
      } else {
        setChartVouchers([]);
      }

      if (activityRes.error) throw activityRes.error;
      setActivityData(activityRes.data || []);

      if (companyStatsRes.error) throw companyStatsRes.error;
      setCompanyStats(companyStatsRes.data || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data.");
    } finally {
      setChartsLoading(false);
    }
  }, [supabase]);

  // Effect for initial data load and when time range changes
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

    if (!loading && profile?.role === "admin") {
      fetchStats();
      fetchDashboardData(timeRange);
    }
  }, [loading, profile, timeRange, fetchDashboardData, supabase]);

  // Effect for refreshing data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading && profile?.role === 'admin') {
        fetchDashboardData(timeRange);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, profile, timeRange, fetchDashboardData]);


  if (loading || !session || profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
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

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Activity Overview</h2>
            <TimeFilter range={timeRange} onRangeChange={setTimeRange} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <VoucherActivityChart data={activityData} isLoading={chartsLoading} />
            <VoucherCompanyDistributionChart vouchers={chartVouchers} isLoading={chartsLoading} />
          </div>
        </div>

        <CompanyStatsCarousel stats={companyStats} isLoading={chartsLoading} />
      </div>
    </div>
  );
}