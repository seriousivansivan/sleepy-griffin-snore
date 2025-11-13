"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PayeeTable } from "@/components/admin/payee-table";
import { EditPayeeDialog } from "@/components/admin/edit-payee-dialog";
import { toast } from "sonner";

export type Payee = {
  id: string;
  name: string;
  created_at: string;
};

export default function PayeeManagementPage() {
  const { supabase } = useSupabaseAuth();
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchPayees = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("payees")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch payees.");
      console.error(error);
    } else {
      setPayees(data as Payee[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPayees();
  }, [fetchPayees]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payee Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add New Payee</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <PayeeTable payees={payees} onActionComplete={fetchPayees} />
      )}

      <EditPayeeDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onPayeeUpdated={() => {
          setIsAddDialogOpen(false);
          fetchPayees();
        }}
      />
    </div>
  );
}