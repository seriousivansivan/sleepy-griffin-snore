"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { createClient } from "@/integrations/supabase/client";
import { PlusCircle, Trash2 } from "lucide-react";

const voucherItemSchema = z.object({
  particulars: z.string().min(1, "Particulars are required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  rate: z.coerce.number().min(0, "Rate cannot be negative."),
});

const formSchema = z.object({
  companyId: z.string().min(1, "Please select a company."),
  items: z.array(voucherItemSchema).min(1, "Please add at least one item."),
});

type Company = {
  id: string;
  name: string;
};

export function CreateVoucherDialog() {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCompanies() {
      const { data, error } = await supabase.from("companies").select("id, name");
      if (error) {
        toast.error("Failed to fetch companies.");
        console.error(error);
      } else if (data) {
        setCompanies(data);
      }
    }
    if (open) {
      fetchCompanies();
    }
  }, [open, supabase]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "",
      items: [{ particulars: "", quantity: 1, rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const totalAmount = watchItems.reduce((acc, item) => {
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    const rate = typeof item.rate === 'number' ? item.rate : 0;
    return acc + quantity * rate;
  }, 0);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("You must be logged in to create a voucher.");
        return;
    }

    const voucherDetails = {
        items: values.items,
        totalAmount: totalAmount,
    };

    const { data, error } = await supabase.rpc('create_voucher_and_deduct_credit', {
        p_user_id: user.id,
        p_company_id: values.companyId,
        p_total_amount: totalAmount,
        p_details: voucherDetails,
    });

    if (error) {
      toast.error(`Failed to create voucher: ${error.message}`);
      console.error(error);
    } else if (data && !data.success) {
      toast.error(data.message || "An error occurred while creating the voucher.");
    } 
    else {
      toast.success("Voucher created successfully!");
      form.reset();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Voucher</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create New Voucher</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new voucher.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div>
              <FormLabel>Voucher Items</FormLabel>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md">
                    <div className="grid grid-cols-12 gap-2 flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.particulars`}
                        render={({ field }) => (
                          <FormItem className="col-span-6">
                            <FormControl>
                              <Textarea placeholder="Particulars" {...field} className="h-20"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="col-span-6 space-y-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" placeholder="Qty" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" placeholder="Rate" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ particulars: "", quantity: 1, rate: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="text-right font-bold text-lg">
              Total: {totalAmount.toFixed(2)}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}