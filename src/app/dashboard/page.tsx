import { createClient } from "@/integrations/supabase/server";
import DashboardClient from "./dashboard-client";
import type { Profile } from "@/components/providers/supabase-auth-provider";
import type { Voucher } from "@/components/voucher-list";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Auth is handled by layout.tsx, so we can assume a session exists.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // We can also assume the profile is complete.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, user_companies(company_id)")
    .eq("id", session!.user.id) // Use non-null assertion as session is guaranteed
    .single();

  if (profileError || !profile) {
    console.error("Dashboard could not fetch profile for a logged-in user:", profileError);
    // Render the client with an empty profile to avoid a crash.
    return <DashboardClient profile={{} as Profile} initialVouchers={[]} />;
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
    .eq("user_id", session!.user.id)
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