"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { VoucherCompanyDistributionChart } from "@/components/admin/voucher-company-distribution-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TimeFilter, TimeRange, calculateDateRange } from "@/components/admin/time-filter";
import { formatISO } from "date-fns";
import { VoucherTrendChart } from "./voucher-trend-chart";

type Company = {
  id: string;
  name: string;
};

export function UserProfileView() {
  const { supabase, session, profile, loading: authLoading } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [associatedCompanies, setAssociatedCompanies] = useState<Company[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRange, setFilterRange] = useState<TimeRange>("all");

  const fetchData = useCallback(async (range: TimeRange) => {
    if (!profile) return;
    setDataLoading(true);

    const { start, end } = calculateDateRange(range);

    try {
      let voucherQuery = supabase
        .from("vouchers")
        .select(`*, companies(name, logo_url)`)
        .order("created_at", { ascending: false });

      if (start) {
        voucherQuery = voucherQuery.gte('created_at', formatISO(start));
      }
      if (end) {
        voucherQuery = voucherQuery.lte('created_at', formatISO(end));
      }

      const { data: voucherData, error: voucherError } = await voucherQuery;
      if (voucherError) throw voucherError;
      setVouchers(voucherData || []);
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
  }, [profile, supabase]);

  useEffect(() => {
    if (!authLoading) {
      fetchData(filterRange);
    }
  }, [authLoading, fetchData, filterRange]);

  const totalVoucherAmount = vouchers.reduce((sum, v) => sum + v.total_amount, 0);
  const totalPages = Math.ceil(vouchers.length / 10);
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
          <CardHeader>
            <CardTitle>My Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
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
              <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                {profile.role}
              </Badge>
            </div>
            <div className="space-y-4 border p-4 rounded-md bg-gray-50/80">
              <h3 className="font-semibold">Credit Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Monthly Allowance</p>
                  <p>
                    {profile.has_unlimited_credit
                      ? "Unlimited"
                      : (profile.monthly_credit_allowance ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Remaining Credit</p>
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
              <p className="font-medium text-muted-foreground">My Companies</p>
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
                    <p className="text-muted-foreground">No companies associated.</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-end">
          <TimeFilter range={filterRange} onRangeChange={setFilterRange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vouchers Created
              </CardTitle>
              <span className="text-sm font-semibold text-muted-foreground">THB</span>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {totalVoucherAmount.toLocaleString(undefined, {
                    style: "currency",
                    currency: "THB",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {vouchers.length} vouchers in total
              </p>
            </CardContent>
          </Card>
          <VoucherCompanyDistributionChart vouchers={vouchers} isLoading={dataLoading} />
        </div>
        <VoucherTrendChart
          vouchers={vouchers}
          isLoading={dataLoading}
          timeRange={filterRange}
        />
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