"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { VoucherCompanyDistributionChart } from "@/components/admin/voucher-company-distribution-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setDataLoading(true);

    try {
      const { data: voucherData, error: voucherError } = await supabase
        .from("vouchers")
        .select(`*, companies(name, logo_url)`)
        .order("created_at", { ascending: false });
      if (voucherError) throw voucherError;
      setVouchers(voucherData || []);

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
      fetchData();
    }
  }, [authLoading, fetchData]);

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
        <VoucherCompanyDistributionChart vouchers={vouchers} isLoading={dataLoading} />
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