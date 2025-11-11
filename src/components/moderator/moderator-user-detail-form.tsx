"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { createClient } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  user_name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  credit: z.coerce.number().min(0, {
    message: "Credit must be a positive number.",
  }),
  monthly_credit_allowance: z.coerce.number().min(0, {
    message: "Monthly allowance must be a positive number.",
  }),
  has_unlimited_credit: z.boolean(),
  companyIds: z.array(z.string()).optional(),
});

type Company = {
  id: string;
  name: string;
};

export function ModeratorUserDetailForm({ user, onUpdateSuccess }) {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_name: user?.user_name || "",
      credit: user?.credit || 0,
      monthly_credit_allowance: user?.monthly_credit_allowance || 0,
      has_unlimited_credit: user?.has_unlimited_credit || false,
      companyIds: [],
    },
  });

  useEffect(() => {
    async function fetchData() {
      setIsDataLoading(true);
      try {
        // Fetch all companies
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name")
          .order("name");
        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

        // Fetch user's associated companies
        const { data: userCompaniesData, error: userCompaniesError } = await supabase
          .from("user_companies")
          .select("company_id")
          .eq("user_id", user.id);
        if (userCompaniesError) throw userCompaniesError;

        const userCompanyIds = userCompaniesData.map((uc) => uc.company_id);
        form.setValue("companyIds", userCompanyIds);
      } catch (error) {
        toast.error("Failed to load initial data.");
        console.error("Error fetching data:", error);
      } finally {
        setIsDataLoading(false);
      }
    }

    if (user) {
      fetchData();
      form.reset({
        user_name: user.user_name || "",
        credit: user.credit || 0,
        monthly_credit_allowance: user.monthly_credit_allowance || 0,
        has_unlimited_credit: user.has_unlimited_credit || false,
        companyIds: form.getValues("companyIds"), // Keep fetched values
      });
    }
  }, [user, form, supabase]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // 1. Update the user's profile information
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          user_name: values.user_name,
          credit: values.credit,
          monthly_credit_allowance: values.monthly_credit_allowance,
          has_unlimited_credit: values.has_unlimited_credit,
        })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      // 2. Update company associations
      const selectedCompanyIds = values.companyIds || [];

      // Get existing company associations from the database
      const { data: existingAssociations, error: fetchError } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id);

      if (fetchError) {
        throw new Error(`Failed to fetch existing company associations: ${fetchError.message}`);
      }

      const existingCompanyIds = existingAssociations.map((a) => a.company_id);

      // Calculate which companies to add and which to remove
      const companiesToAdd = selectedCompanyIds.filter(
        (id) => !existingCompanyIds.includes(id)
      );
      const companiesToRemove = existingCompanyIds.filter(
        (id) => !selectedCompanyIds.includes(id)
      );

      // Perform deletions for unchecked companies
      if (companiesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_companies")
          .delete()
          .eq("user_id", user.id)
          .in("company_id", companiesToRemove);

        if (deleteError) {
          throw new Error(`Failed to remove company associations: ${deleteError.message}`);
        }
      }

      // Perform insertions for newly checked companies
      if (companiesToAdd.length > 0) {
        const newLinks = companiesToAdd.map((companyId) => ({
          user_id: user.id,
          company_id: companyId,
        }));
        const { error: insertError } = await supabase
          .from("user_companies")
          .insert(newLinks);

        if (insertError) {
          throw new Error(`Failed to add company associations: ${insertError.message}`);
        }
      }

      toast.success("User updated successfully!");
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="user_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="credit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Balance</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter credit amount" {...field} />
              </FormControl>
              <FormMessage />
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
                <Input type="number" placeholder="Enter monthly allowance" {...field} />
              </FormControl>
              <FormDescription>
                This is the amount the user's credit will be reset to on the 1st of each month.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="has_unlimited_credit"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Unlimited Credit</FormLabel>
                <FormDescription>
                  User's credit balance will not be deducted when creating vouchers.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Company Associations</FormLabel>
                <FormDescription>
                  Select the companies this user is associated with.
                </FormDescription>
              </div>
              <ScrollArea className="h-[150px] border rounded-md p-4">
                {isDataLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  companies.map((company) => (
                    <FormField
                      key={company.id}
                      control={form.control}
                      name="companyIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={company.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(company.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), company.id])
                                    : field.onChange(
                                        (field.value || []).filter(
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}