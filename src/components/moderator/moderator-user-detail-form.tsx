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
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import type { Profile } from "@/components/providers/supabase-auth-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Schema now only includes fields a moderator can edit
const formSchema = z.object({
  companyIds: z.array(z.string()),
});

type Company = { id: string; name: string };

type ModeratorUserDetailFormProps = {
  user: Profile;
  onUserUpdated: () => void;
};

export function ModeratorUserDetailForm({
  user,
  onUserUpdated,
}: ModeratorUserDetailFormProps) {
  const { supabase } = useSupabaseAuth();
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyIds: user.user_companies?.map((uc) => uc.company_id) ?? [],
    },
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsDataLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to load companies.");
      } else {
        setAllCompanies(data || []);
      }
      setIsDataLoading(false);
    };
    fetchCompanies();
  }, [supabase]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Moderator can only update company associations
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

      toast.success("User's company associations updated successfully.");
      onUserUpdated();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
        </div>

        {/* Read-only credit information */}
        <div className="space-y-4 border p-4 rounded-md bg-muted text-sm">
          <h3 className="font-semibold">Credit Information (Read-Only)</h3>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly Allowance:</span>
            <span className="font-medium">
              {user.has_unlimited_credit
                ? "Unlimited"
                : (user.monthly_credit_allowance ?? 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining Credit:</span>
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
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
  );
}