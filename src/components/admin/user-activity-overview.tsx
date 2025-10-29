"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { VoucherCompanyDistributionChart } from "@/components/admin/voucher-company-distribution-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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

type UserActivityOverviewProps = {
  userId: string;
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

export function UserActivityOverview({ userId }: UserActivityOverviewProps) {
  const { supabase } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRange, setFilterRange] = useState<TimeRange>("all");

  const fetchData = useCallback(
    async (range: TimeRange) => {
      setDataLoading(true);
      const { start, end } = calculateDateRange(range);
      const p_start_date = start ? formatISO(start) : null;
      const p_end_date = end ? formatISO(end) : null;

      try {
        const { data, error } = await supabase.rpc(
          "get_vouchers_by_user_id_for_admin",
          {
            p_user_id: userId,
            p_start_date,
            p_end_date,
          }
        );

        if (error) throw error;

        // Since RPC returns a flat structure, we need to fetch company details separately
        const companyIds = [...new Set(data.map((v: any) => v.company_id))];
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);
        if (companiesError) throw companiesError;

        const companyMap = new Map(companiesData.map((c) => [c.id, c]));

        const formattedVouchers = data.map((v: any) => ({
          ...v,
          details: v.details as Voucher["details"],
          companies: companyMap.get(v.company_id) || null,
          user: null, // User info is not needed here
        }));

        setVouchers(formattedVouchers || []);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching user activity data:", error);
        toast.error("Failed to load user activity data.");
      } finally {
        setDataLoading(false);
      }
    },
    [supabase, userId]
  );

  useEffect(() => {
    fetchData(filterRange);
  }, [fetchData, filterRange]);

  const totalVoucherAmount = vouchers.reduce(
    (sum, v) => sum + v.total_amount,
    0
  );
  const totalPages = Math.ceil(vouchers.length / 10);

  const { chartData, companyNames } = useMemo(() => {
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b p-4">
        <CardTitle className="text-xl">User Activity Overview</CardTitle>
        <TimeFilter range={filterRange} onRangeChange={setFilterRange} />
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vouchers Created
              </CardTitle>
              <span className="text-sm font-semibold text-muted-foreground">
                THB
              </span>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <Skeleton className="h-8 w-24" />
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
              <div className="h-60 p-2 -ml-4">
                {dataLoading ? (
                  <Skeleton className="h-full w-full" />
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
              </div>
            </CardContent>
          </Card>
          <VoucherCompanyDistributionChart
            vouchers={vouchers}
            isLoading={dataLoading}
          />
        </div>

        {/* Voucher List Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Voucher History</h3>
          <VoucherList
            vouchers={vouchers}
            isLoading={dataLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showCreator={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}