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
  CardDescription,
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
  const [historicalCredit, setHistoricalCredit] = useState<number | null>(null);
  const [isHistoricalCreditLoading, setIsHistoricalCreditLoading] =
    useState(false);

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
          user: null,
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
    const fetchHistoricalCredit = async () => {
      if (filterRange === "all" || !userId) {
        setHistoricalCredit(null);
        return;
      }

      setIsHistoricalCreditLoading(true);
      const { end } = calculateDateRange(filterRange);

      if (end) {
        const { data, error } = await supabase.rpc(
          "get_credit_balance_at_date",
          {
            p_user_id: userId,
            p_target_date: end.toISOString(),
          }
        );

        if (error) {
          console.error("Error fetching historical credit:", error);
          setHistoricalCredit(null);
        } else {
          setHistoricalCredit(data);
        }
      }
      setIsHistoricalCreditLoading(false);
    };

    fetchData(filterRange);
    fetchHistoricalCredit();
  }, [fetchData, filterRange, supabase, userId]);

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

  const filterEndDate = useMemo(() => {
    if (filterRange === "all") return null;
    const { end } = calculateDateRange(filterRange);
    return end ? format(end, "PPP") : null;
  }, [filterRange]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b p-4">
        <CardTitle className="text-xl">User Activity Overview</CardTitle>
        <TimeFilter range={filterRange} onRangeChange={setFilterRange} />
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Voucher Spend
              </CardTitle>
              <CardDescription>
                Total value of vouchers in this period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {totalVoucherAmount.toLocaleString(undefined, {
                    style: "currency",
                    currency: "THB",
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Vouchers Created
              </CardTitle>
              <CardDescription>
                Total number of vouchers in this period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{vouchers.length}</div>
              )}
            </CardContent>
          </Card>
          {filterRange !== "all" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Credit Snapshot
                </CardTitle>
                <CardDescription>Balance as of {filterEndDate}</CardDescription>
              </CardHeader>
              <CardContent>
                {isHistoricalCreditLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {historicalCredit !== null
                      ? historicalCredit.toLocaleString(undefined, {
                          style: "currency",
                          currency: "THB",
                        })
                      : "N/A"}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Spend Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64 p-2">
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