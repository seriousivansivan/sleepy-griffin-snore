"use client";

import { UserProfileView } from "@/components/profile/user-profile-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  // Auth/Loading is handled by dashboard/layout.tsx

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>
        <UserProfileView />
      </div>
    </div>
  );
}