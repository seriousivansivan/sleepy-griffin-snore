"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { toast } from "sonner";

const VOUCHERS_PER_PAGE = 10;

export default function AdminVoucherOverviewPage() {
  const { supabase } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAllVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the explicit foreign key constraint name ('vouchers_user_id_fkey') for the join.
      // This is the most robust way to ensure the join works correctly and should resolve the 400 error.
      const { data, error } = await supabase
        .from("vouchers")
        .select(
          `*, companies(name, logo_url), profiles!vouchers_user_id_fkey(user_name)`
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setVouchers(data || []);
      setCurrentPage(1); // Reset to page 1 after fetching new data
    } catch (error) {
      console.error("Error fetching all vouchers:", error);
      toast.error("Failed to load all voucher data.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllVouchers();
  }, [fetchAllVouchers]);

  const totalPages = useMemo(() => {
    return Math.ceil(vouchers.length / VOUCHERS_PER_PAGE);
  }, [vouchers.length]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Voucher Overview</h1>
      <VoucherList
        vouchers={vouchers}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showUserColumn={true} // Explicitly show the user column for admin view
      />
    </div>
  );
}