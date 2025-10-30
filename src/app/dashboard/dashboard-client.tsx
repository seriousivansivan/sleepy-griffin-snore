"use client";

// All your original imports
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
import type { Profile } from '@/types'; // Assumes you have a Profile type

const VOUCHERS_PER_PAGE = 10;

// This component receives the data fetched by the Server Component
interface DashboardClientProps {
  profile: Profile; // Use your actual Profile type
  initialVouchers: Voucher[];
}

export default function DashboardClient({ profile, initialVouchers }: DashboardClientProps) {
  // The server already handled redirects and loading.
  // We just get the 'supabase' client for *actions* (like creating a voucher).
  const { supabase } = useSupabaseAuth();
  
  // The state is initialized with the server-fetched props
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [vouchersLoading, setVouchersLoading] = useState(false); // Starts false
  const [currentPage, setCurrentPage] = useState(1);
  
  // Note: All the useEffects for redirection and initial fetching are GONE.
  // The server handled it!

  // This function is still useful for *refreshing* the list
  // (e.g., after creating a new voucher)
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

      if (error) throw error;
      setVouchers(data as Voucher[] || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
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

  // The main loading state is no longer needed.
  // The server guarantees we have a session and profile here.
  // if (loading || !session ...) { ... } <-- REMOVE THIS

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {/* Use the profile from props */}
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
            {/* Pass the refresh function to the dialog */}
            <CreateVoucherDialog onVoucherCreated={fetchVouchers} />
            <ThemeToggle />
            <UserNav /> {/* UserNav will still use useSupabaseAuth to show user info */}
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