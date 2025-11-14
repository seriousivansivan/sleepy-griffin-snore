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
import { Combobox } from "@/components/ui/combobox";

const itemSchema = z.object({
  particulars: z.string().min(1, "Particulars are required."),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  mainCategory: z.string({ required_error: "Please select a main category." }),
  subCategory: z.string({ required_error: "Please select a sub-category." }),
});

const formSchema = z.object({
  companyId: z.string({ required_error: "Please select a company." }),
  payTo: z
    .string()
    .min(2, { message: "Payee name must be at least 2 characters." }),
  date: z.date({ required_error: "A date is required." }),
  items: z
    .array(itemSchema)
    .min(1, "At least one item is required.")
    .max(6, "You can add a maximum of 6 items."),
});

type Company = {
  id: string;
  name: string;
};

type ComboboxOption = {
  value: string;
  label: string;
};

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
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
  const [payeeOptions, setPayeeOptions] = useState<ComboboxOption[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategoryMap, setSubCategoryMap] = useState<Map<string, Category[]>>(new Map());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payTo: "",
      date: new Date(),
      items: [{ particulars: "", amount: 0, mainCategory: "", subCategory: "" }],
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
    const fetchDropdownData = async () => {
      if (!session || !isOpen) return;

      // Fetch companies
      const companyIds =
        profile?.user_companies.map((uc) => uc.company_id) || [];
      if (companyIds.length > 0) {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);
        if (companyError) toast.error("Could not load your companies.");
        else setCompanies(companyData || []);
      }

      // Fetch payees
      const { data: payeeData, error: payeeError } = await supabase
        .from("payees")
        .select("name")
        .order("name");
      if (payeeError) {
        toast.error("Could not load payees.");
      } else {
        const options = payeeData.map((p) => ({ value: p.name, label: p.name }));
        setPayeeOptions(options);
      }

      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from("voucher_categories")
        .select("id, name, parent_id");

      if (categoryError) {
        toast.error("Could not load categories.");
      } else if (categoryData) {
        const parents = categoryData.filter((c) => c.parent_id === null).sort((a, b) => a.name.localeCompare(b.name));
        const children = categoryData.filter((c) => c.parent_id !== null);
        
        setMainCategories(parents);

        const newSubCategoryMap = new Map<string, Category[]>();
        parents.forEach(parent => {
            const correspondingChildren = children
                .filter(child => child.parent_id === parent.id)
                .sort((a, b) => a.name.localeCompare(b.name));
            newSubCategoryMap.set(parent.id, correspondingChildren);
        });
        setSubCategoryMap(newSubCategoryMap);
      }
    };
    fetchDropdownData();
  }, [isOpen, session, supabase, profile]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session) return;
    setIsSubmitting(true);

    const calculatedTotalAmount = values.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const finalItems = values.items.map(item => ({
        particulars: item.particulars,
        amount: item.amount,
        category: item.subCategory,
    }));

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
            items: finalItems,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        await refreshProfile(); // Refresh profile to get updated credit
        onVoucherCreated();
        setIsOpen(false);
        form.reset({
          payTo: "",
          date: new Date(),
          items: [{ particulars: "", amount: 0, mainCategory: "", subCategory: "" }],
          companyId: values.companyId, // Keep company selected
        });
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
      <DialogContent className="sm:max-w-4xl">
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
                      <Combobox
                        options={payeeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select or type a payee name..."
                        searchPlaceholder="Search payee..."
                        emptyMessage="No results. You can type a custom name."
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
                      className="grid grid-cols-[1fr_150px_150px_150px_auto] items-start gap-2"
                    >
                      <FormField
                        control={form.control}
                        name={`items.${index}.particulars`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Particulars</FormLabel>}
                            <FormControl>
                              <Input placeholder="Expense description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.mainCategory`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Main Category</FormLabel>}
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue(`items.${index}.subCategory`, "");
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mainCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
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
                        name={`items.${index}.subCategory`}
                        render={({ field }) => {
                          const selectedMainCategoryId = form.watch(`items.${index}.mainCategory`);
                          const availableSubCategories = subCategoryMap.get(selectedMainCategoryId) || [];

                          return (
                            <FormItem>
                              {index === 0 && <FormLabel>Sub-Category</FormLabel>}
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!selectedMainCategoryId || availableSubCategories.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableSubCategories.map((subCat) => (
                                    <SelectItem key={subCat.id} value={subCat.name}>
                                      {subCat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Amount</FormLabel>}
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
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
                        className={cn(index === 0 ? "mt-8" : "mt-1")}
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
                onClick={() =>
                  append({ particulars: "", amount: 0, mainCategory: "", subCategory: "" })
                }
                disabled={fields.length >= 6}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
              {form.formState.errors.items?.message && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.items.message}
                </p>
              )}
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