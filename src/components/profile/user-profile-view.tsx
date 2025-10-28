"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pencil, Save, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { ChangePasswordDialog } from "./change-password-dialog";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  user_name: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function UserProfileView() {
  const { user, profile, mutateProfile } = useSupabaseAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      user_name: profile?.user_name || "",
    },
    mode: "onChange",
  });

  const handleCancel = () => {
    form.reset({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      user_name: profile?.user_name || "",
    });
    setIsEditing(false);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        user_name: data.user_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setIsLoading(false);

    if (error) {
      toast.error("Failed to update profile.", {
        description: error.message,
      });
    } else {
      toast.success("Profile updated successfully!");
      mutateProfile();
      setIsEditing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} readOnly disabled />
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={profile?.role || "user"}
                readOnly
                disabled
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...form.register("first_name")}
                disabled={!isEditing || isLoading}
              />
              {form.formState.errors.first_name && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...form.register("last_name")}
                disabled={!isEditing || isLoading}
              />
              {form.formState.errors.last_name && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="user_name">Username (Optional)</Label>
              <Input
                id="user_name"
                {...form.register("user_name")}
                disabled={!isEditing || isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <ChangePasswordDialog />
            
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  type="button"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isLoading || !form.formState.isValid}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}