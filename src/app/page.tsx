import { redirect } from "next/navigation";

// This page's only job is to redirect to the dashboard.
// The dashboard layout will handle all authentication and profile checks.
export default function Home() {
  redirect("/dashboard");
}