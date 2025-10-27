"use client";

import { useState, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Company } from "@/app/admin/companies/page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CreateVoucherDialogProps = {
  onVoucherCreated: () => void;
};

type VoucherItem = {
  description: string;
  amount: number;
};

export function CreateVoucherDialog({
  onVoucherCreated,
}: CreateVoucherDialogProps) {
  const { supabase, profile } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [items, setItems] = useState<VoucherItem[]>([
    { description: "", amount: 0 },
  ]);

  const userCompanies = useMemo(() => {
    return (
      profile?.user_companies.map((uc) => ({
        id: uc.company_id,
        name: uc.companies?.name || "Unknown Company",
      })) || []
    );
  }, [profile]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { description: "", amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof VoucherItem,
    value: string | number
  ) => {
    const newItems = [...items];
    if (field === "amount") {
      newItems[index][field] = parseFloat(value as string) || 0;
    } else {
      newItems[index][field] = value as string;
    }
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!profile || !selectedCompanyId) {
      toast.error("Please select a company.");
      return;
    }

    if (totalAmount <= 0) {
      toast.error("Total amount must be greater than zero.");
      return;
    }

    const validItems = items.filter(
      (item) => item.description.trim() !== "" && item.amount > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one valid item.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "create_voucher_and_deduct_credit",
        {
          p_user_id: profile.id,
          p_company_id: selectedCompanyId,
          p_total_amount: totalAmount,
          p_details: { items: validItems },
        }
      );

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast.success(result.message);
        onVoucherCreated();
        setIsOpen(false);
        // Reset form state
        setSelectedCompanyId(null);
        setItems([{ description: "", amount: 0 }]);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Voucher creation failed:", error);
      toast.error("Failed to create voucher. Check your credit balance.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Ticket className="mr-2 h-4 w-4" />
          Create Voucher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Voucher</DialogTitle>
          <DialogDescription>
            Fill in the details below to generate a new voucher.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select
              onValueChange={setSelectedCompanyId}
              value={selectedCompanyId || ""}
              disabled={userCompanies.length === 0 || isLoading}
            >
              <SelectTrigger id="company">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {userCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userCompanies.length === 0 && (
              <p className="text-sm text-red-500">
                You must be assigned to a company to create vouchers.
              </p>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold">Items / Particulars</h3>
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-8">Description</div>
              <div className="col-span-3 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-8">
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={item.amount === 0 ? "" : item.amount}
                    onChange={(e) =>
                      handleItemChange(index, "amount", e.target.value)
                    }
                    disabled={isLoading}
                    min="0.01"
                    step="0.01"
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleAddItem}
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <Label className="text-lg font-bold">Total Voucher Amount</Label>
            <span className="text-xl font-bold text-primary">
              {totalAmount.toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              })}
            </span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Create Voucher
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}