"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { toast } from "sonner";

export default function AdminVoucherOverviewPage() {
  const { supabase } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Admins have RLS access to view all vouchers
      const { data, error } = await supabase
        .from("vouchers")
        .select(`*, companies(name, logo_url)`)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setVouchers(data || []);
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Voucher Overview</h1>
      <VoucherList vouchers={vouchers} isLoading={isLoading} />
    </div>
  );
}