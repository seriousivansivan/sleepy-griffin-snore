"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formSchema = z.object({
  userName: z.string().min(2, {
    message: "User name must be at least 2 characters.",
  }),
  companyId: z.string({
    required_error: "Please select a company.",
  }),
});

type Company = {
  id: string;
  name: string;
};

export function CompleteProfileForm() {
  const { supabase, session } = useSupabaseAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!session) return; // Don't fetch if there's no session

      const { data, error } = await supabase.from("companies").select("id, name");
      if (error) {
        toast.error("Could not load companies.");
        console.error(error);
      } else {
        setCompanies(data);
      }
    };
    fetchCompanies();
  }, [supabase, session]); // Add session to the dependency array

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session) return;
    setIsSubmitting(true);

    try {
      // 1. Update the profile with the user_name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ user_name: values.userName })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      // 2. Link user to the company in the user_companies table
      const { error: companyLinkError } = await supabase
        .from("user_companies")
        .insert({ user_id: session.user.id, company_id: values.companyId });

      if (companyLinkError) throw companyLinkError;

      toast.success("Profile updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Johnny" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save and Continue"}
        </Button>
      </form>
    </Form>
  );
}