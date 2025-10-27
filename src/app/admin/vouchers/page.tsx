"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { toast } from "sonner";

const VOUCHERS_PER_PAGE = 10;

// Define the structure of the raw data returned by the RPC function
type RawVoucher = Omit<Voucher, 'companies' | 'user_id'> & {
  company_id: string;
  user_id: string;
};

export default function AdminVoucherOverviewPage() {
  const { supabase } = useSupabaseAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAllVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all raw voucher data using the RPC function (bypasses RLS)
      const { data: rawVouchers, error: rpcError } = await supabase.rpc(
        "get_all_vouchers_for_admin"
      );

      if (rpcError) {
        throw rpcError;
      }

      const rawData = rawVouchers as RawVoucher[];

      if (rawData.length === 0) {
        setVouchers([]);
        setCurrentPage(1);
        setIsLoading(false);
        return;
      }

      // 2. Collect unique IDs for companies and users
      const companyIds = Array.from(
        new Set(rawData.map((v) => v.company_id))
      );
      const userIds = Array.from(new Set(rawData.map((v) => v.user_id)));

      // 3. Fetch related company and user data
      const [
        { data: companiesData, error: companiesError },
        { data: profilesData, error: profilesError },
      ] = await Promise.all([
        supabase.from("companies").select("id, name, logo_url").in("id", companyIds),
        supabase.from("profiles").select("id, user_name").in("id", userIds),
      ]);

      if (companiesError || profilesError) {
        console.error("Error fetching related data:", companiesError || profilesError);
        throw new Error("Failed to fetch related company or user data.");
      }

      const companyMap = new Map(
        companiesData?.map((c) => [c.id, c])
      );
      const profileMap = new Map(
        profilesData?.map((p) => [p.id, p])
      );

      // 4. Map raw vouchers to the final Voucher type
      const formattedVouchers: Voucher[] = rawData.map((v) => ({
        ...v,
        id: v.id, // Ensure ID is number
        total_amount: v.total_amount,
        details: v.details as Voucher["details"],
        created_at: v.created_at,
        companies: companyMap.get(v.company_id) || null,
        user_id: profileMap.get(v.user_id) || null,
      }));

      setVouchers(formattedVouchers);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching all vouchers:", error);
      toast.error("Failed to load all voucher data for admin.");
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
      />
    </div>
  );
}