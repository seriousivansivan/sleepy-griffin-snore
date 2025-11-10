"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import type { Profile } from "@/components/providers/supabase-auth-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { ChangePasswordDialog } from "./change-password-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserEmail } from "@/hooks/use-user-email";
import { cn } from "@/lib/utils";
import type { ModeratorAssignment } from "@/app/admin/users/[id]/page";

const formSchema = z.object({
  role: z.enum(["user", "admin", "moderator"]),
  monthly_credit_allowance: z.coerce
    .number()
    .min(0, "Allowance cannot be negative."),
  has_unlimited_credit: z.boolean(),
  companyIds: z.array(z.string()),
  managedUserIds: z.array(z.string()),
});

type Company = { id: string; name: string };
type SelectableUser = { id: string; user_name: string | null };

type UserDetailFormProps = {
  user: Profile;
  assignments: ModeratorAssignment[];
  onUserUpdated: () => void;
};

export function UserDetailForm({
  user,
  assignments,
  onUserUpdated,
}: UserDetailFormProps) {
  const { supabase } = useSupabaseAuth();
  const { email, isLoading: isEmailLoading } = useUserEmail(user.id);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [allUsers, setAllUsers] = useState<SelectableUser[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role as "user" | "admin" | "moderator",
      monthly_credit_allowance: user.monthly_credit_allowance ?? 0,
      has_unlimited_credit: user.has_unlimited_credit ?? false,
      companyIds: user.user_companies?.map((uc) => uc.company_id) ?? [],
      managedUserIds: assignments.map((a) => a.managed_user_id) ?? [],
    },
  });

  const watchedRole = form.watch("role");
  const hasUnlimitedCredit = form.watch("has_unlimited_credit");

  useEffect(() => {
    const fetchRelatedData = async () => {
      setIsDataLoading(true);
      const companyPromise = supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      const userPromise = supabase
        .from("profiles")
        .select("id, user_name")
        .eq("role", "user")
        .order("user_name", { ascending: true });

      const [companyResult, userResult] = await Promise.all([
        companyPromise,
        userPromise,
      ]);

      if (companyResult.error) {
        toast.error("Failed to load companies.");
      } else {
        setAllCompanies(companyResult.data || []);
      }

      if (userResult.error) {
        toast.error("Failed to load users for assignment.");
      } else {
        setAllUsers(userResult.data || []);
      }
      setIsDataLoading(false);
    };
    fetchRelatedData();
  }, [supabase]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // ... (profile update logic remains the same)
      const updateData: Partial<Profile> = {
        role: values.role,
        has_unlimited_credit: values.has_unlimited_credit,
      };

      if (values.has_unlimited_credit) {
        updateData.monthly_credit_allowance = 0;
        updateData.credit = 0;
      } else {
        updateData.monthly_credit_allowance = values.monthly_credit_allowance;
        if (
          user.has_unlimited_credit ||
          values.monthly_credit_allowance > (user.monthly_credit_allowance ?? 0)
        ) {
          updateData.credit = values.monthly_credit_allowance;
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (profileError) throw profileError;

      // ... (company assignment logic remains the same)
      const currentCompanyIds = user.user_companies.map((uc) => uc.company_id);
      const desiredCompanyIds = values.companyIds;
      const companiesToAdd = desiredCompanyIds.filter(
        (id) => !currentCompanyIds.includes(id)
      );
      const companiesToRemove = currentCompanyIds.filter(
        (id) => !desiredCompanyIds.includes(id)
      );
      if (companiesToAdd.length > 0) {
        const inserts = companiesToAdd.map((company_id) => ({
          user_id: user.id,
          company_id,
        }));
        const { error } = await supabase.from("user_companies").insert(inserts);
        if (error) throw error;
      }
      if (companiesToRemove.length > 0) {
        const { error } = await supabase
          .from("user_companies")
          .delete()
          .eq("user_id", user.id)
          .in("company_id", companiesToRemove);
        if (error) throw error;
      }

      // Handle moderator assignments
      if (values.role === "moderator") {
        const currentManagedIds = assignments.map((a) => a.managed_user_id);
        const desiredManagedIds = values.managedUserIds;

        const usersToAdd = desiredManagedIds.filter(
          (id) => !currentManagedIds.includes(id)
        );
        const usersToRemove = currentManagedIds.filter(
          (id) => !desiredManagedIds.includes(id)
        );

        if (usersToAdd.length > 0) {
          const inserts = usersToAdd.map((managed_user_id) => ({
            moderator_id: user.id,
            managed_user_id,
          }));
          const { error } = await supabase
            .from("moderator_assignments")
            .insert(inserts);
          if (error) throw error;
        }

        if (usersToRemove.length > 0) {
          const { error } = await supabase
            .from("moderator_assignments")
            .delete()
            .eq("moderator_id", user.id)
            .in("managed_user_id", usersToRemove);
          if (error) throw error;
        }
      } else {
        // If role is changed from moderator, remove all their assignments
        const { error } = await supabase
          .from("moderator_assignments")
          .delete()
          .eq("moderator_id", user.id);
        if (error) throw error;
      }

      toast.success("User updated successfully.");
      onUserUpdated();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(
        `Failed to update user: ${error.message || "An unknown error occurred."}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-xl">User Details & Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3 text-sm border-b pb-6">
            <div className="flex">
              <span className="font-semibold mr-1">Username:</span>{" "}
              {user.user_name || "N/A"}
            </div>
            <div className="flex">
              <span className="font-semibold mr-1">Email:</span>{" "}
              <span className="text-muted-foreground">
                {isEmailLoading ? (
                  <Skeleton className="h-4 w-48 inline-block" />
                ) : (
                  email || "N/A"
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex">
                <span className="font-semibold mr-1">Password:</span> ************
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsPasswordDialogOpen(true)}
                className="h-auto p-0 text-primary"
              >
                Change
              </Button>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border p-4 rounded-md bg-muted">
                <h3 className="font-semibold">Credit Management</h3>
                <FormField
                  control={form.control}
                  name="has_unlimited_credit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Grant Unlimited Credit</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthly_credit_allowance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Credit Allowance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="300.00"
                          {...field}
                          value={field.value === 0 ? "" : String(field.value)}
                          disabled={hasUnlimitedCredit || isSubmitting}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Current Remaining Credit:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      !user.has_unlimited_credit &&
                        (user.credit ?? 0) < 0 &&
                        "text-destructive"
                    )}
                  >
                    {user.has_unlimited_credit
                      ? "Unlimited"
                      : (user.credit ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </span>
                </p>
              </div>

              <FormField
                control={form.control}
                name="companyIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Associations</FormLabel>
                    <ScrollArea className="h-[150px] border rounded-md p-4">
                      {isDataLoading ? (
                        <Skeleton className="h-full w-full" />
                      ) : (
                        allCompanies.map((company) => (
                          <FormItem
                            key={company.id}
                            className="flex flex-row items-start space-x-3 space-y-0 py-1"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(company.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        company.id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== company.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {company.name}
                            </FormLabel>
                          </FormItem>
                        ))
                      )}
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRole === "moderator" && (
                <FormField
                  control={form.control}
                  name="managedUserIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Managed Users</FormLabel>
                      <ScrollArea className="h-[150px] border rounded-md p-4">
                        {isDataLoading ? (
                          <Skeleton className="h-full w-full" />
                        ) : (
                          allUsers.map((managedUser) => (
                            <FormItem
                              key={managedUser.id}
                              className="flex flex-row items-start space-x-3 space-y-0 py-1"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(
                                    managedUser.id
                                  )}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          managedUser.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== managedUser.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {managedUser.user_name || "Unnamed User"}
                              </FormLabel>
                            </FormItem>
                          ))
                        )}
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || isDataLoading}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <ChangePasswordDialog
        userId={user.id}
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </>
  );
}