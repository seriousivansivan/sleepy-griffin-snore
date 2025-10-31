import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_name, user_companies(company_id)")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.user_name || profile.user_companies.length === 0) {
    redirect("/complete-profile");
  }

  redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}