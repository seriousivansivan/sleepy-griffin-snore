"use client";

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { CreateVoucherDialog } from "@/components/create-voucher-dialog";

export default function DashboardPage() {
  const { session, supabase, loading, profile } = useSupabaseAuth();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/login");
      } else if (!profile?.user_name || profile.user_companies.length === 0) {
        router.replace("/complete-profile");
      }
    }
  }, [session, loading, router, profile]);

  const fetchVouchers = useCallback(async () => {
    if (session) {
      setVouchersLoading(true);
      const { data, error } = await supabase
        .from("vouchers")
        .select(`*, companies(name)`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching vouchers:", error);
      } else {
        setVouchers(data || []);
      }
      setVouchersLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (!loading && session) {
      fetchVouchers();
    }
  }, [session, loading, fetchVouchers]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (
    loading ||
    !session ||
    !profile?.user_name ||
    profile.user_companies.length === 0
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {profile.user_name}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
            <CreateVoucherDialog onVoucherCreated={fetchVouchers} />
          </div>
        </header>

        <main>
          <VoucherList vouchers={vouchers} isLoading={vouchersLoading} />
        </main>
      </div>
    </div>
  );
}