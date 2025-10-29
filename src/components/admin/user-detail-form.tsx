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

const formSchema = z.object({
  role: z.enum(["user", "admin"]),
  monthly_credit_allowance: z.coerce
    .number()
    .min(0, "Allowance cannot be negative."),
  has_unlimited_credit: z.boolean(),
  // By removing .default([]), we force the schema to expect a required string[],
  // which aligns with the type provided in defaultValues.
  companyIds: z.array(z.string()), 
});

type Company = {
  id: string;
  name: string;
};

type UserDetailFormProps = {
  user: Profile;
  onUserUpdated: () => void;
};

export function UserDetailForm({ user, onUserUpdated }: UserDetailFormProps) {
  const { supabase } = useSupabaseAuth();
  const { email, isLoading: isEmailLoading } = useUserEmail(user.id);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role as "user" | "admin",
      monthly_credit_allowance: user.monthly_credit_allowance ?? 0,
      // Ensure boolean is never null/undefined
      has_unlimited_credit: user.has_unlimited_credit ?? false,
      // Ensure array is never null/undefined
      companyIds: user.user_companies?.map((uc) => uc.company_id) ?? [],
    },
  });

  const hasUnlimitedCredit = form.watch("has_unlimited_credit");
  const watchedCompanyIds = form.watch("companyIds");

  const isAllSelected =
    allCompanies.length > 0 && watchedCompanyIds.length === allCompanies.length;
  const isIndeterminate =
    watchedCompanyIds.length > 0 &&
    watchedCompanyIds.length < allCompanies.length;

  useEffect(() => {
    const fetchAllCompanies = async () => {
      setIsCompaniesLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to load all companies.");
        console.error(error);
      } else {
        setAllCompanies(data || []);
      }
      setIsCompaniesLoading(false);
    };
    fetchAllCompanies();
  }, [supabase]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      form.setValue(
        "companyIds",
        allCompanies.map((c) => c.id),
        { shouldValidate: true }
      );
    } else {
      form.setValue("companyIds", [], { shouldValidate: true });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
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
        const { error: insertError } = await supabase
          .from("user_companies")
          .insert(inserts);
        if (insertError) throw insertError;
      }

      if (companiesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_companies")
          .delete()
          .eq("user_id", user.id)
          .in("company_id", companiesToRemove);
        if (deleteError) throw deleteError;
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
                  <span className="font-medium">
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
                render={() => (
                  <FormItem>
                    <FormLabel>Company Associations</FormLabel>
                    <div className="flex flex-row items-start space-x-3 space-y-0 py-1 border-b pb-2">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={isCompaniesLoading || isSubmitting}
                        {...(isIndeterminate && { indeterminate: "true" })}
                      />
                      <FormLabel className="font-semibold cursor-pointer">
                        Select All ({watchedCompanyIds.length} /{" "}
                        {allCompanies.length})
                      </FormLabel>
                    </div>
                    <ScrollArea className="h-[150px] border rounded-md p-4">
                      {isCompaniesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ) : allCompanies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No companies available to assign.
                        </p>
                      ) : (
                        allCompanies.map((company) => (
                          <FormField
                            key={company.id}
                            control={form.control}
                            name="companyIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={company.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={
                                        field.value?.includes(company.id) ??
                                        false
                                      }
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                          ? field.onChange([
                                              ...currentValue,
                                              company.id,
                                            ])
                                          : field.onChange(
                                              currentValue.filter(
                                                (value) =>
                                                  value !== company.id
                                              )
                                            );
                                      }}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {company.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))
                      )}
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
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