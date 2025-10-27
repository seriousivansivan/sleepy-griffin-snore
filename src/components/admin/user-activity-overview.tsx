"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, DollarSign } from "lucide-react";

type UserActivityOverviewProps = {
  userId: string;
  userName: string | null;
};

const VOUCHERS_PER_PAGE = 10;

export function UserActivityOverview({ userId, userName }: UserActivityOverviewProps) {
  const { supabase } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchVouchers = useCallback(async () => {
    setVouchersLoading(true);
    try {
      // Fetch vouchers created by this specific user
      const { data, error } = await supabase
        .from("vouchers")
        .select(`*, companies(name, logo_url), user_id(user_name)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setVouchers(data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching user vouchers:", error);
      toast.error("Failed to load user voucher history.");
    } finally {
      setVouchersLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const totalPages = Math.ceil(vouchers.length / VOUCHERS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Placeholder for chart data calculation (WIP)
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
        
        {/* Placeholder for Company Distribution Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vouchers by Company (WIP)
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-24 flex items-center justify-center">
              <Skeleton className="w-20 h-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
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
          />
        </CardContent>
      </Card>
    </div>
  );
}