"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Payee } from "@/app/admin/payees/page";

const formSchema = z.object({
  name: z.string().min(2, "Payee name must be at least 2 characters."),
});

type EditPayeeDialogProps = {
  payee?: Payee | null;
  isOpen: boolean;
  onClose: () => void;
  onPayeeUpdated: () => void;
};

export function EditPayeeDialog({
  payee,
  isOpen,
  onClose,
  onPayeeUpdated,
}: EditPayeeDialogProps) {
  const { supabase } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!payee;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (payee) {
      form.reset({ name: payee.name });
    } else {
      form.reset({ name: "" });
    }
  }, [payee, isOpen, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        if (!payee) throw new Error("Payee data is missing for editing.");
        const { error } = await supabase
          .from("payees")
          .update({ name: values.name })
          .eq("id", payee.id);
        if (error) throw error;
        toast.success("Payee updated successfully.");
      } else {
        const { error } = await supabase
          .from("payees")
          .insert({ name: values.name });
        if (error) throw error;
        toast.success("Payee created successfully.");
      }

      onPayeeUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error saving payee:", error);
      toast.error(error.message || "Failed to save payee.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Payee" : "Add New Payee"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the payee's name below." : "Enter the name for the new payee."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payee Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}