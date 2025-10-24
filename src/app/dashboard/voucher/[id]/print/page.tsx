"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { PrintableVoucher } from "@/components/printable-voucher";
import { Voucher } from "@/components/voucher-list";
import { Button } from "@/components/ui/button";

export default function PrintVoucherPage() {
  const params = useParams();
  const { supabase, session } = useSupabaseAuth();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoucher = async () => {
      if (!session || !params.id) {
        // If there's no session yet, don't set an error, just wait.
        if (!session) return;
        setError("Voucher ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("vouchers")
        .select("*, companies(name, logo_url)")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Error fetching voucher:", error);
        setError(
          "Could not load voucher data. It may not exist or you may not have permission to view it."
        );
        setVoucher(null);
      } else {
        setVoucher(data as Voucher);
        setError(null);
      }
      setLoading(false);
    };

    fetchVoucher();
  }, [params.id, session, supabase]);

  useEffect(() => {
    if (voucher && !loading && !error) {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Delay to allow content to render
      return () => clearTimeout(timer);
    }
  }, [voucher, loading, error]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p>Loading voucher for printing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-destructive mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()}>Print Again</Button>
      </div>
      <main className="flex justify-center items-start min-h-screen bg-gray-200 p-4 print:bg-white print:p-0">
        {voucher && <PrintableVoucher voucher={voucher} />}
      </main>
    </>
  );
}