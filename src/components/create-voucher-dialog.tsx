"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";

// Define the schema for the form
const formSchema = z.object({
  companyId: z.string({ required_error: "Please select a company." }),
  payTo: z
    .string()
    .min(2, { message: "Payee name must be at least 2 characters." }),
  date: z.date({ required_error: "A date is required." }),
  particulars: z
    .string()
    .min(5, { message: "Particulars must be at least 5 characters." }),
  amount: z.coerce
    .number()
    .positive({ message: "Amount must be a positive number." }),
});

type Company = {
  id: string;
  name: string;
};

type CreateVoucherDialogProps = {
  onVoucherCreated: () => void;
};

export function CreateVoucherDialog({
  onVoucherCreated,
}: CreateVoucherDialogProps) {
  const { supabase, session, profile } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Fetch companies when the dialog is opened
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!session || !isOpen) return;

      const companyIds =
        profile?.user_companies.map((uc) => uc.company_id) || [];

      if (companyIds.length === 0) {
        setCompanies([]);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      if (error) {
        toast.error("Could not load your companies.");
        console.error(error);
      } else {
        setCompanies(data || []);
      }
    };

    fetchCompanies();
  }, [isOpen, session, supabase, profile]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payTo: "",
      particulars: "",
      date: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session) return;
    setIsSubmitting(true);

    const { companyId, amount, ...details } = values;

    try {
      const { error } = await supabase.from("vouchers").insert({
        user_id: session.user.id,
        company_id: companyId,
        total_amount: amount,
        details: {
          payTo: details.payTo,
          date: format(details.date, "yyyy-MM-dd"), // Store date in a consistent format
          particulars: details.particulars,
        },
      });

      if (error) throw error;

      toast.success("Voucher created successfully!");
      onVoucherCreated(); // Notify parent to refresh data
      setIsOpen(false); // Close the dialog
      form.reset(); // Reset form for next time
    } catch (error) {
      console.error("Error creating voucher:", error);
      toast.error("Failed to create voucher. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create New Voucher</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Voucher</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new payment voucher.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
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
            <FormField
              control={form.control}
              name="payTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay To</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Office Supplies Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="particulars"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Particulars</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the payment details..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Voucher"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}