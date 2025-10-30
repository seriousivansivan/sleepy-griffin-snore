"use client"; // <-- This file MUST have "use client"

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react"; // Removed useEffect
import { VoucherList, Voucher } from "@/components/voucher-list";
import { CreateVoucherDialog } from "@/components/create-voucher-dialog";
import Link from "next/link";
import { Shield } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile } from '@/types'; // Make sure this type is correct

const VOUCHERS_PER_PAGE = 10;

// This component receives the data fetched by the Server Component
interface DashboardClientProps {
  profile: Profile;
  initialVouchers: Voucher[];
}

export default function DashboardClient({ profile, initialVouchers }: DashboardClientProps) {
  // We get 'supabase' from context for ACTIONS (like creating a new voucher)
  const { supabase } = useSupabaseAuth();
  
  // The state is initialized with the server-fetched props
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // All the useEffects for redirection are GONE because the server handled it.

  // This function is for REFRESHING the list
  const fetchVouchers = useCallback(async () => {
    setVouchersLoading(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select(`*, companies(*), user:profiles!user_id(id, user_name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setVouchers(data as Voucher[] || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error refreshing vouchers:", error);
    } finally {
      setVouchersLoading(false);
    }
  }, [supabase]);

  const totalPages = useMemo(() => {
    return Math.ceil(vouchers.length / VOUCHERS_PER_PAGE);
  }, [vouchers.length]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // The main loading logic is GONE. The server guarantees we have a profile.
  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile.user_name}.
            </p>
            {/* ... all your other header JSX ... */}
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