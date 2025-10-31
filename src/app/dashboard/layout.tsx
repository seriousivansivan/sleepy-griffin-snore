import { createClient } from "@/integrations/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Also check if profile is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_name, user_companies(company_id)")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.user_name || profile.user_companies.length === 0) {
    redirect("/complete-profile");
  }

  return <>{children}</>;
}