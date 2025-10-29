"use client";

import { useEffect } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { AdminVoucherList } from "@/components/admin/admin-voucher-list";

export default function AdminVouchersPage() {
  const { session, loading, profile } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || profile?.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [session, loading, profile, router]);

  if (loading || !session || profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        Voucher Management
      </h1>
      <AdminVoucherList />
    </div>
  );
}