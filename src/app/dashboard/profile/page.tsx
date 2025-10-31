import { createClient } from "@/integrations/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfilePageClient from "./profile-page-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return <ProfilePageClient />;
}