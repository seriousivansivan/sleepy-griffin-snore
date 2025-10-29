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
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import { EditProfileForm } from "./edit-profile-form";

type Company = {
  id: string;
  name: string;
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

export function UserProfileView() {
  const { supabase, session, profile, loading: authLoading } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [associatedCompanies, setAssociatedCompanies] = useState<Company[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRange, setFilterRange] = useState<TimeRange>("all");
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = useCallback(
    async (range: TimeRange) => {
      if (!profile) return;
      setDataLoading(true);

      const { start, end } = calculateDateRange(range);

      try {
        let voucherQuery = supabase
          .from("vouchers")
          .select(
            `
          *,
          companies(*),
          user:profiles!user_id(id, user_name)
        `
          )
          .order("created_at", { ascending: false });

        if (start) {
          voucherQuery = voucherQuery.gte("created_at", formatISO(start));
        }
        if (end) {
          voucherQuery = voucherQuery.lte("created_at", formatISO(end));
        }

        const { data: voucherData, error: voucherError } = await voucherQuery;
        if (voucherError) throw voucherError;
        setVouchers((voucherData as Voucher[]) || []);
        setCurrentPage(1);

        const companyIds = profile.user_companies.map((uc) => uc.company_id);
        if (companyIds.length > 0) {
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("id, name")
            .in("id", companyIds);
          if (companyError) throw companyError;
          setAssociatedCompanies(companyData || []);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data.");
      } finally {
        setDataLoading(false);
      }
    },
    [profile, supabase]
  );

  useEffect(() => {
    if (!authLoading) {
      fetchData(filterRange);
    }
  }, [authLoading, fetchData, filterRange]);

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

  if (authLoading || !profile) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-1" />
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>My Details</CardTitle>
              <CardDescription>
                View or edit your profile information.
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            {isEditing ? (
              <EditProfileForm
                onSuccess={() => setIsEditing(false)}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Username</p>
                  <p>{profile.user_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Email</p>
                  <p>{session?.user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Role</p>
                  <Badge
                    variant={profile.role === "admin" ? "default" : "secondary"}
                  >
                    {profile.role}
                  </Badge>
                </div>
                <div className="space-y-4 border p-4 rounded-md bg-muted">
                  <h3 className="font-semibold">Credit Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">
                        Monthly Allowance
                      </p>
                      <p>
                        {profile.has_unlimited_credit
                          ? "Unlimited"
                          : (
                              profile.monthly_credit_allowance ?? 0
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">
                        Remaining Credit
                      </p>
                      <p>
                        {profile.has_unlimited_credit
                          ? "Unlimited"
                          : (profile.credit ?? 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-muted-foreground">
                    My Companies
                  </p>
                  {dataLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                      {associatedCompanies.length > 0 ? (
                        <ul className="space-y-2">
                          {associatedCompanies.map((company) => (
                            <li key={company.id}>{company.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">
                          No companies associated.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-end">
          <TimeFilter range={filterRange} onRangeChange={setFilterRange} />
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
            </CardHeader>
            <CardContent className="h-60 p-2">
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
        <VoucherList
          vouchers={vouchers}
          isLoading={dataLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showCreator={false}
        />
      </div>
    </div>
  );
}