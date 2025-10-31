import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// This tells Next.js to re-evaluate this page on every request
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // We have a session, now check if the profile is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_name, user_companies(company_id)")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.user_name || profile.user_companies.length === 0) {
    redirect("/complete-profile");
  }

  // If session and profile are good, go to the dashboard
  redirect("/dashboard");

  // This part will never be reached due to redirects, but it's good practice
  // to return something, even if it's just a loading indicator for non-JS clients
  // or during the brief moment before the redirect is processed.
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}