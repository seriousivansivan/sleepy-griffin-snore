"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { toast } from "sonner";
import { TimeFilter, TimeRange, calculateDateRange } from "@/components/admin/time-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatISO } from "date-fns";

export default function ModeratorVouchersPage() {
  const { supabase } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const fetchVouchers = useCallback(async (range: TimeRange) => {
    setLoading(true);
    try {
      const { start, end } = calculateDateRange(range);
      
      let query = supabase
        .from("vouchers")
        .select(`
          *,
          companies(*),
          user:profiles!user_id(id, user_name)
        `)
        .order("created_at", { ascending: false });

      if (start) {
        query = query.gte("created_at", formatISO(start));
      }
      if (end) {
        query = query.lte("created_at", formatISO(end));
      }
      
      // RLS policy automatically scopes this query to the moderator's managed users
      const { data, error } = await query;

      if (error) throw error;
      
      setVouchers(data as Voucher[] || []);
      setCurrentPage(1);

    } catch (error) {
      console.error("Error fetching managed vouchers:", error);
      toast.error("Failed to load voucher data.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchVouchers(timeRange);
  }, [fetchVouchers, timeRange]);

  const totalPages = useMemo(
    () => Math.ceil(vouchers.length / 10),
    [vouchers]
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-foreground">
        Managed Vouchers
      </h1>
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-10 w-[180px]" />
          ) : (
            <div className="flex justify-end">
              <TimeFilter range={timeRange} onRangeChange={setTimeRange} />
            </div>
          )}
        </CardContent>
      </Card>

      <VoucherList
        vouchers={vouchers}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showCreator={true}
        showActions={true}
      />
    </div>
  );
}