"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { CreateVoucherDialog } from "@/components/create-voucher-dialog";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Ticket, User } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card"; // Reusing StatCard for user dashboard
import {
  TimeFilter,
  TimeRange,
  calculateDateRange,
} from "@/components/admin/time-filter";
import { formatISO, format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { VoucherCompanyDistributionChart } from "@/components/admin/voucher-company-distribution-chart";
import { Profile } from "@/components/providers/supabase-auth-provider";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

type DashboardClientProps = {
  profile: Profile;
  initialVouchers: Voucher[];
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toLocaleString(undefined, {
              style: "currency",
              currency: "THB",
            })}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardClient({
  profile,
  initialVouchers,
}: DashboardClientProps) {
  const { supabase, refreshProfile } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRange, setFilterRange] = useState<TimeRange>("this_month");

  const fetchVouchers = useCallback(async (range: TimeRange) => {
    setLoadingVouchers(true);
    const { start, end } = calculateDateRange(range);

    let query = supabase
      .from("vouchers")
      .select(
        `
        *,
        companies(*),
        user:profiles!user_id(id, user_name)
      `
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (start) {
      query = query.gte("created_at", formatISO(start));
    }
    if (end) {
      query = query.lte("created_at", formatISO(end));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching vouchers:", error);
    } else {
      setVouchers(data as Voucher[]);
    }
    setLoadingVouchers(false);
    setCurrentPage(1); // Reset to first page on filter change
  }, [supabase, profile.id]);

  useEffect(() => {
    fetchVouchers(filterRange);
  }, [fetchVouchers, filterRange]);

  const totalVoucherAmount = vouchers.reduce(
    (sum, v) => sum + v.total_amount,
    0
  );
  const totalPages = Math.ceil(vouchers.length / 10);

  const { chartData, companyNames } = React.useMemo(() => {
    if (vouchers.length === 0) return { chartData: [], companyNames: [] };

    const isLongRange = filterRange === "this_year" || filterRange === "all";
    const dateFormat = isLongRange ? "yyyy-MM" : "yyyy-MM-dd";

    const dataMap = new Map<string, any>();
    const uniqueCompanyNames = new Set<string>();

    const sortedVouchers = [...vouchers].sort(
      (a, b) =>
        parseISO(a.details.date || a.created_at).getTime() -
        parseISO(b.details.date || b.created_at).getTime()
    );

    sortedVouchers.forEach((voucher) => {
      const companyName = voucher.companies?.name || "Unknown";
      uniqueCompanyNames.add(companyName);

      const date = parseISO(voucher.details.date || voucher.created_at);
      const key = format(date, dateFormat);

      if (!dataMap.has(key)) {
        dataMap.set(key, {
          date: format(date, isLongRange ? "MMM yyyy" : "dd MMM"),
        });
      }

      const entry = dataMap.get(key);
      entry[companyName] = (entry[companyName] || 0) + voucher.total_amount;
    });

    const finalCompanyNames = Array.from(uniqueCompanyNames);
    const finalChartData = Array.from(dataMap.values()).map((entry) => {
      finalCompanyNames.forEach((name) => {
        if (!entry[name]) {
          entry[name] = 0;
        }
      });
      return entry;
    });

    return { chartData: finalChartData, companyNames: finalCompanyNames };
  }, [vouchers, filterRange]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Image
            src="/siLogo.png"
            alt="App Logo"
            width={40}
            height={40}
            className="bg-primary p-1 rounded-md"
          />
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          {profile.role === "admin" && (
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">
                Admin Panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Remaining Credit"
          value={
            profile.has_unlimited_credit
              ? "Unlimited"
              : (profile.credit ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
          }
          icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
          isLoading={false} // Profile data is already loaded
          href="/dashboard/profile"
        />
        <StatCard
          title="Monthly Allowance"
          value={
            profile.has_unlimited_credit
              ? "Unlimited"
              : (profile.monthly_credit_allowance ?? 0).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )
          }
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
          isLoading={false}
          href="/dashboard/profile"
        />
        <StatCard
          title="My Profile"
          value={profile.user_name || "N/A"}
          icon={<User className="h-4 w-4 text-muted-foreground" />}
          isLoading={false}
          href="/dashboard/profile"
        />
      </div>

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">My Voucher Activity</h2>
          <div className="flex items-center gap-4">
            <TimeFilter range={filterRange} onRangeChange={setFilterRange} />
            <CreateVoucherDialog onVoucherCreated={() => {
              fetchVouchers(filterRange); // Refresh vouchers after creation
              refreshProfile(); // Refresh profile to update credit
            }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Vouchers Created
                </CardTitle>
                <span className="text-sm font-semibold text-muted-foreground">
                  THB
                </span>
              </div>
              {loadingVouchers ? (
                <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {totalVoucherAmount.toLocaleString(undefined, {
                      style: "currency",
                      currency: "THB",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vouchers.length} vouchers in total
                  </p>
                </>
              )}
            </CardHeader>
            <CardContent className="h-60 p-2">
              {loadingVouchers ? (
                <div className="h-full w-full bg-muted rounded-md animate-pulse" />
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data to display trend.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("en-US", {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(value)
                      }
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {companyNames.map((companyName, index) => (
                      <Line
                        key={companyName}
                        type="monotone"
                        dataKey={companyName}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <VoucherCompanyDistributionChart
            vouchers={vouchers}
            isLoading={loadingVouchers}
          />
        </div>

        <VoucherList
          vouchers={vouchers}
          isLoading={loadingVouchers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showCreator={false}
        />
      </div>
    </div>
  );
}