"use client";

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { CreateVoucherDialog } from "@/components/create-voucher-dialog";
import Link from "next/link";
import { Settings, Shield } from "lucide-react";

const VOUCHERS_PER_PAGE = 10;

export default function DashboardPage() {
  const { session, supabase, loading, profile } = useSupabaseAuth();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
    setVouchersLoading(true);
    try {
      // Fetch all vouchers for the current user (RLS handles filtering)
      // We fetch user_id(user_name) here, but it will only return the current user's name, 
      // which is fine since we hide the column using showCreator={false}.
      const { data, error } = await supabase
        .from("vouchers")
        .select(`*, companies(name, logo_url), user_id(user_name)`)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setVouchers(data || []);
      setCurrentPage(1); // Reset to page 1 after fetching new data
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setVouchersLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!loading && session) {
      fetchVouchers();
    }
  }, [session?.user.id, loading, fetchVouchers]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const totalPages = useMemo(() => {
    return Math.ceil(vouchers.length / VOUCHERS_PER_PAGE);
  }, [vouchers.length]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {profile.user_name}.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Remaining Credit:{" "}
              <span className="font-semibold text-gray-700">
                {profile.has_unlimited_credit
                  ? "Unlimited"
                  : profile.credit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {profile.role === "admin" && (
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
            )}
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
            <CreateVoucherDialog onVoucherCreated={fetchVouchers} />
          </div>
        </header>

        <main>
          <VoucherList
            vouchers={vouchers}
            isLoading={vouchersLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showCreator={false}
          />
        </main>
      </div>
    </div>
  );
}