"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { PrintableVoucher } from "@/components/printable-voucher";
import { Voucher } from "@/components/voucher-list";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

// Create a temporary, non-session-persisting client for this page
// This client will be initialized with the token from the URL
const createTempSupabaseClient = (token: string) => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  // We use a standard client here, but we set the auth header manually via the token
  // This client does not rely on sessionStorage or localStorage.
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false, // Crucial: Do not try to save session
    }
  });
};


export default function PrintVoucherPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { supabase: mainSupabase, session: mainSession, loading: authLoading } = useSupabaseAuth();
  
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoucher = async () => {
      const voucherId = params.id;
      const token = searchParams.get("token");
      
      if (!voucherId) {
        setError("Voucher ID is missing.");
        setLoading(false);
        return;
      }

      let client = mainSupabase;
      let isAuthenticated = !!mainSession;

      // If we are in a new tab and the main session is not yet loaded,
      // but we have a token in the URL, use a temporary client.
      if (!isAuthenticated && token) {
        try {
          client = createTempSupabaseClient(token);
          isAuthenticated = true; // Assume token is valid for the fetch
        } catch (e) {
          console.error("Failed to create temporary client:", e);
          setError("Authentication failed during print setup.");
          setLoading(false);
          return;
        }
      }
      
      // If still not authenticated (no main session and no token), show error
      if (!isAuthenticated) {
        setError("You must be logged in to view this voucher.");
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Use the determined client (main or temporary)
      const { data, error } = await client
        .from("vouchers")
        .select("*, companies(name, logo_url)")
        .eq("id", voucherId)
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

    // We don't need to wait for authLoading here, as we handle authentication via token if needed.
    fetchVoucher();
  }, [params.id, searchParams, mainSupabase, mainSession]);

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
      <div className="flex justify-center items-center min-h-screen bg-muted">
        <p>Loading voucher for printing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-muted">
        <div className="text-center p-8 bg-card rounded-lg shadow-md">
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
      <main className="flex justify-center items-start min-h-screen bg-muted p-4 print:bg-white print:p-0">
        {voucher && <PrintableVoucher voucher={voucher} />}
      </main>
    </>
  );
}