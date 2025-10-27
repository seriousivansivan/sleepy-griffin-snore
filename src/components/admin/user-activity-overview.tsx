"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { VoucherCompanyDistributionChart } from "./voucher-company-distribution-chart";

type UserActivityOverviewProps = {
  userId: string;
  userName: string | null;
};

// Define the structure of the raw data returned by the RPC function
type RawVoucher = Omit<Voucher, 'companies' | 'user_id'> & {
  company_id: string;
  user_id: string;
};

export function UserActivityOverview({ userId, userName }: UserActivityOverviewProps) {
  const { supabase } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchVouchers = useCallback(async () => {
    setVouchersLoading(true);
    try {
      // 1. Fetch raw voucher data using the RPC function (bypasses RLS for admin)
      const { data: rawVouchers, error: rpcError } = await supabase.rpc(
        "get_vouchers_by_user_id_for_admin",
        { p_user_id: userId }
      );

      if (rpcError) {
        throw rpcError;
      }

      const rawData = rawVouchers as RawVoucher[];

      if (rawData.length === 0) {
        setVouchers([]);
        setCurrentPage(1);
        setVouchersLoading(false);
        return;
      }

      // 2. Collect unique IDs for companies
      const companyIds = Array.from(
        new Set(rawData.map((v) => v.company_id))
      );
      
      // 3. Fetch related company data
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, logo_url")
        .in("id", companyIds);

      if (companiesError) {
        console.error("Error fetching related company data:", companiesError);
        throw new Error("Failed to fetch related company data.");
      }

      const companyMap = new Map(
        companiesData?.map((c) => [c.id, c])
      );
      
      // 4. Map raw vouchers to the final Voucher type
      const formattedVouchers: Voucher[] = rawData.map((v) => ({
        ...v,
        id: v.id,
        total_amount: v.total_amount,
        details: v.details as Voucher["details"],
        created_at: v.created_at,
        companies: companyMap.get(v.company_id) || null,
        // Since we are in the context of a single user, we can hardcode the user_id object
        user_id: { user_name: userName }, 
      }));

      setVouchers(formattedVouchers);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching user vouchers:", error);
      toast.error("Failed to load user voucher history.");
    } finally {
      setVouchersLoading(false);
    }
  }, [supabase, userId, userName]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const totalPages = Math.ceil(vouchers.length / 10); // Assuming 10 VOUCHERS_PER_PAGE

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate total voucher amount for the stat card
  const totalVoucherAmount = vouchers.reduce((sum, v) => sum + v.total_amount, 0);

  return (
    <div className="space-y-6 h-full">
      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vouchers Created
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {vouchersLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {totalVoucherAmount.toLocaleString(undefined, {
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
        
        {/* Company Distribution Chart */}
        <VoucherCompanyDistributionChart
          vouchers={vouchers}
          isLoading={vouchersLoading}
        />
      </div>

      {/* Voucher List Section */}
      <Card>
        <CardHeader>
          <CardTitle>{userName || "User"}'s Vouchers</CardTitle>
          <CardDescription>
            A list of all petty cash vouchers created by this user.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <VoucherList
            vouchers={vouchers}
            isLoading={vouchersLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showCreator={false} // Hide creator column since it's implicit
            showActions={false} // Hide actions column (print button)
          />
        </CardContent>
      </Card>
    </div>
  );
}