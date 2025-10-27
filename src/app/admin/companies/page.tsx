"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyTable } from "@/components/admin/company-table";
import { EditCompanyDialog } from "@/components/admin/edit-company-dialog";
import { toast } from "sonner";

export type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
};

export default function CompanyManagementPage() {
  const { supabase } = useSupabaseAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch companies.");
      console.error(error);
    } else {
      setCompanies(data as Company[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Company Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add New Company</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <CompanyTable companies={companies} onActionComplete={fetchCompanies} />
      )}

      <EditCompanyDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onCompanyUpdated={() => {
          setIsAddDialogOpen(false);
          fetchCompanies();
        }}
      />
    </div>
  );
}