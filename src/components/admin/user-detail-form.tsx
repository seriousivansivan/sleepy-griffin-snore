"use client";

import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

type Profile = {
  id: string;
  role: string;
  credit: number;
  user_name: string | null;
  monthly_credit_allowance: number;
  has_unlimited_credit: boolean;
};

type UserDetailFormProps = {
  user: User;
  profile: Profile | null;
  onProfileUpdate: (newProfile: Profile) => void;
};

export function UserDetailForm({ user, profile, onProfileUpdate }: UserDetailFormProps) {
  const { supabase } = useSupabaseAuth();
  const [role, setRole] = useState(profile?.role || "user");
  const [credit, setCredit] = useState(profile?.credit.toString() || "0");
  const [monthlyCredit, setMonthlyCredit] = useState(profile?.monthly_credit_allowance.toString() || "0");
  const [userName, setUserName] = useState(profile?.user_name || "");
  const [hasUnlimitedCredit, setHasUnlimitedCredit] = useState(profile?.has_unlimited_credit || false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      setCredit(profile.credit.toString());
      setMonthlyCredit(profile.monthly_credit_allowance.toString());
      setUserName(profile.user_name || "");
      setHasUnlimitedCredit(profile.has_unlimited_credit);
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    const numericCredit = parseFloat(credit);
    const numericMonthlyCredit = parseFloat(monthlyCredit);

    if (isNaN(numericCredit) || isNaN(numericMonthlyCredit) || numericCredit < 0 || numericMonthlyCredit < 0) {
      toast.error("Credit values must be non-negative numbers.");
      setIsUpdating(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          role,
          credit: numericCredit,
          user_name: userName,
          monthly_credit_allowance: numericMonthlyCredit,
          has_unlimited_credit: hasUnlimitedCredit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        onProfileUpdate(data as Profile);
        toast.success("User profile updated successfully.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update user profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>User Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <p className="text-sm">
            <span className="font-semibold">User ID:</span> {user.id}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Email:</span>{" "}
            <span className="text-blue-600 underline cursor-pointer">
              {user.email} {/* Corrected to display actual email */}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">Created At:</span>{" "}
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* User Name */}
          <div className="space-y-2">
            <Label htmlFor="userName">Display Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter display name"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Unlimited Credit Toggle */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="unlimitedCredit"
              checked={hasUnlimitedCredit}
              onChange={(e) => setHasUnlimitedCredit(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="unlimitedCredit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Has Unlimited Credit
            </Label>
          </div>

          {/* Current Credit */}
          <div className="space-y-2">
            <Label htmlFor="credit">Current Credit (THB)</Label>
            <Input
              id="credit"
              type="number"
              step="0.01"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              disabled={hasUnlimitedCredit}
              placeholder="0.00"
            />
          </div>

          {/* Monthly Credit Allowance */}
          <div className="space-y-2">
            <Label htmlFor="monthlyCredit">Monthly Credit Allowance (THB)</Label>
            <Input
              id="monthlyCredit"
              type="number"
              step="0.01"
              value={monthlyCredit}
              onChange={(e) => setMonthlyCredit(e.target.value)}
              disabled={hasUnlimitedCredit}
              placeholder="0.00"
            />
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}