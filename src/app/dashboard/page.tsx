export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// ... rest of your imports
"use client";

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { CreateVoucherDialog } from "@/components/create-voucher-dialog";
import Link from "next/link";
import { Shield } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";

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
      const { data, error } = await supabase
        .from("vouchers")
        .select(`
          *,
          companies(*),
          user:profiles!user_id(id, user_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      setVouchers(data as Voucher[] || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setVouchersLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!loading && profile) {
      fetchVouchers();
    }
  }, [loading, profile, fetchVouchers]);

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
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile.user_name}.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Remaining Credit:{" "}
              <span className="font-semibold text-foreground">
                {profile.has_unlimited_credit
                  ? "Unlimited"
                  : (profile.credit ?? 0).toLocaleString(undefined, {
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
            <CreateVoucherDialog onVoucherCreated={fetchVouchers} />
            <ThemeToggle />
            <UserNav />
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

