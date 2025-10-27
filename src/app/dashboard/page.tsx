"use client";

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { CreateVoucherDialog } from "@/components/create-voucher-dialog";
import Link from "next/link";
import { Settings, Shield } from "lucide-react";
import { VoucherFilters } from "@/components/voucher-filters";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
};

export default function DashboardPage() {
  const { session, supabase, loading, profile } = useSupabaseAuth();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedCompanyId: null as string | null,
  });

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/login");
      } else if (!profile?.user_name || profile.user_companies.length === 0) {
        router.replace("/complete-profile");
      }
    }
  }, [session, loading, router, profile]);

  const userCompanies = useMemo(() => {
    if (!profile || profile.user_companies.length === 0) return [];
    // We need to fetch the company names for the filter dropdown.
    // Since the profile only contains company IDs, we'll fetch the full list of companies
    // the user is associated with in a separate effect below.
    // For now, we'll use a placeholder structure based on the IDs we have.
    return profile.user_companies.map((uc) => ({ id: uc.company_id, name: uc.company_id }));
  }, [profile]);

  // State to hold the actual company names for the filter dropdown
  const [filterCompanies, setFilterCompanies] = useState<Company[]>([]);

  // Effect to fetch company names for the filter dropdown
  useEffect(() => {
    const fetchCompanyNames = async () => {
      if (!profile || profile.user_companies.length === 0) return;
      const companyIds = profile.user_companies.map((uc) => uc.company_id);

      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      if (error) {
        console.error("Failed to fetch company names for filter:", error);
        toast.error("Failed to load company names for filtering.");
      } else {
        setFilterCompanies(data || []);
      }
    };
    if (session && profile) {
      fetchCompanyNames();
    }
  }, [session, profile, supabase]);


  const fetchVouchers = useCallback(async () => {
    if (!session) return;

    setVouchersLoading(true);
    try {
      let query = supabase
        .from("vouchers")
        .select(`*, companies(name, logo_url)`)
        .order("created_at", { ascending: false });

      // 1. Filter by Company ID
      if (filters.selectedCompanyId) {
        query = query.eq("company_id", filters.selectedCompanyId);
      }

      // 2. Filter by Pay To search term (case-insensitive partial match on JSONB field)
      if (filters.searchTerm) {
        // Use ilike on the JSONB path 'details->>payTo'
        query = query.ilike("details->>payTo", `%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setVouchers(data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Failed to load vouchers.");
    } finally {
      setVouchersLoading(false);
    }
  }, [supabase, session, filters]);

  useEffect(() => {
    // Trigger fetch whenever filters change
    if (!loading && session) {
      fetchVouchers();
    }
  }, [session?.user.id, loading, fetchVouchers, filters]);

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

        <div className="mb-6">
          <VoucherFilters
            companies={filterCompanies}
            onFilterChange={(newFilters) =>
              setFilters({
                searchTerm: newFilters.searchTerm,
                selectedCompanyId: newFilters.companyId,
              })
            }
          />
        </div>

        <main>
          <VoucherList vouchers={vouchers} isLoading={vouchersLoading} />
        </main>
      </div>
    </div>
  );
}