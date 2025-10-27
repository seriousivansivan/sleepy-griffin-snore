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
      // Admins have RLS access to view all vouchers
      // Fetch profiles(user_name) along with companies.
      // The join is implicitly made via the user_id foreign key.
      const { data, error } = await supabase
        .from("vouchers")
        .select(`user_id, total_amount, details, created_at, id, companies(name, logo_url), profiles(user_name)`)
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