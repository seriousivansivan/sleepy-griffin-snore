"use client";

import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CompanyLogoUploader } from "@/components/company-logo-uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Company = {
  id: string;
  name: string;
  logo_url: string | null;
};

export default function SettingsPage() {
  const { session, supabase, loading, profile } = useSupabaseAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/login");
      } else if (!profile?.user_name || profile.user_companies.length === 0) {
        router.replace("/complete-profile");
      }
    }
  }, [session, loading, router, profile]);

  const fetchCompanies = useCallback(async () => {
    if (!session || !profile) return;

    const companyIds = profile.user_companies.map((uc) => uc.company_id);
    if (companyIds.length === 0) {
      setPageLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .select("id, name, logo_url")
      .in("id", companyIds);

    if (error) {
      toast.error("Failed to load company data.");
      console.error(error);
      setCompanies([]);
    } else {
      setCompanies(data || []);
    }
    setPageLoading(false);
  }, [session, profile, supabase]);

  useEffect(() => {
    if (!loading && session && profile) {
      fetchCompanies();
    }
  }, [loading, session, profile, fetchCompanies]);

  const handleLogoUpdate = (companyId: string, newUrl: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, logo_url: newUrl } : c))
    );
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

  if (pageLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Company Settings
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>No Companies Found</CardTitle>
              </CardHeader>
              <CardContent>
                You are not currently associated with any companies.
              </CardContent>
            </Card>
          ) : (
            companies.map((company) => (
              <CompanyLogoUploader
                key={company.id}
                companyId={company.id}
                companyName={company.name}
                currentLogoUrl={company.logo_url}
                onLogoUpdated={(newUrl) => handleLogoUpdate(company.id, newUrl)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}