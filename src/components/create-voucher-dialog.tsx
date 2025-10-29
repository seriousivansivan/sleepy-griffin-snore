"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, PlusCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";

const itemSchema = z.object({
  particulars: z.string().min(1, "Particulars are required."),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
});

const formSchema = z.object({
  companyId: z.string({ required_error: "Please select a company." }),
  payTo: z
    .string()
    .min(2, { message: "Payee name must be at least 2 characters." }),
  date: z.date({ required_error: "A date is required." }),
  items: z.array(itemSchema).min(1, "At least one item is required."),
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
  const { supabase, session, profile, refreshProfile } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payTo: "",
      date: new Date(),
      items: [{ particulars: "", amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  const totalAmount = watchedItems.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!session || !isOpen) return;
      const companyIds =
        profile?.user_companies.map((uc) => uc.company_id) || [];
      if (companyIds.length === 0) return;

      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);
      if (error) toast.error("Could not load your companies.");
      else setCompanies(data || []);
    };
    fetchCompanies();
  }, [isOpen, session, supabase, profile]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session) return;
    setIsSubmitting(true);

    const calculatedTotalAmount = values.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    if (
      profile &&
      !profile.has_unlimited_credit &&
      (profile.credit ?? 0) < calculatedTotalAmount // FIX: Safely access profile.credit
    ) {
      toast.error("Insufficient credit to create this voucher.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc(
        "create_voucher_and_deduct_credit",
        {
          p_user_id: session.user.id,
          p_company_id: values.companyId,
          p_total_amount: calculatedTotalAmount,
          p_details: {
            payTo: values.payTo,
            date: format(values.date, "yyyy-MM-dd"),
            items: values.items,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        await refreshProfile(); // Refresh profile to get updated credit
        onVoucherCreated();
        setIsOpen(false);
        form.reset();
      } else {
        toast.error(data.message || "An unknown error occurred.");
      }
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Voucher</DialogTitle>
          <DialogDescription>
            Fill in the details below. You can add multiple items to a single
            voucher.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <Input
                        placeholder="e.g. Office Supplies Inc."
                        {...field}
                      />
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
            </div>

            <div>
              <FormLabel>Items</FormLabel>
              <ScrollArea className="h-[200px] mt-2 p-1 border rounded-md">
                <div className="space-y-3 pr-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-start gap-2"
                    >
                      <FormField
                        control={form.control}
                        name={`items.${index}.particulars`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Particulars" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Amount"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="mt-1"
                      >
                        <XCircle className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ particulars: "", amount: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="text-right font-bold text-lg">
              Total:{" "}
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}