import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import type { Profile } from "@/components/providers/supabase-auth-provider";
import type { Voucher } from "@/components/voucher-list";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, user_companies(company_id)")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile for dashboard:", profileError);
    redirect("/login");
  }

  if (!profile.user_name || profile.user_companies.length === 0) {
    redirect("/complete-profile");
  }

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
  }

  return (
    <DashboardClient
      profile={profile as Profile}
      initialVouchers={(initialVouchers as Voucher[]) || []}
    />
  );
}