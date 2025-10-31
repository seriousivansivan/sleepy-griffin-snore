import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import type { Profile } from "@/components/providers/supabase-auth-provider";
import type { Voucher } from "@/components/voucher-list";

// This tells Next.js to re-evaluate this page on every request
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch profile on the server
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, user_companies(company_id)")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile for dashboard:", profileError);
    redirect("/login");
  }

  // Check if profile is complete
  if (!profile.user_name || profile.user_companies.length === 0) {
    redirect("/complete-profile");
  }

  // Fetch initial vouchers on the server
  const { data: initialVouchers, error: vouchersError } = await supabase
    .from("vouchers")
    .select(
      `
      *,
      companies(*),
      user:profiles!user_id(id, user_name)
    `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (vouchersError) {
    console.error("Error fetching initial vouchers:", vouchersError);
    // We can still render the page but with an empty voucher list
  }

  return (
    <DashboardClient
      profile={profile as Profile}
      initialVouchers={(initialVouchers as Voucher[]) || []}
    />
  );
}