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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Category } from "@/app/admin/categories/page";

const formSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  parent_id: z.string().nullable(),
});

type EditCategoryDialogProps = {
  category?: Category | null;
  mainCategories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onCategoryUpdated: () => void;
};

export function EditCategoryDialog({
  category,
  mainCategories,
  isOpen,
  onClose,
  onCategoryUpdated,
}: EditCategoryDialogProps) {
  const { supabase } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!category;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: category?.name || "",
        parent_id: category?.parent_id || null,
      });
    }
  }, [category, isOpen, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const upsertData = {
        name: values.name,
        parent_id: values.parent_id || null,
      };

      if (isEditMode && category) {
        const { error } = await supabase
          .from("voucher_categories")
          .update(upsertData)
          .eq("id", category.id);
        if (error) throw error;
        toast.success("Category updated successfully.");
      } else {
        const { error } = await supabase
          .from("voucher_categories")
          .insert(upsertData);
        if (error) throw error;
        toast.success("Category created successfully.");
      }

      onCategoryUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Category" : "Add New Category"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the category details below." : "Enter the details for the new category."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Office Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (This is a main category)</SelectItem>
                      {mainCategories
                        .filter(c => c.id !== category?.id) // Prevent self-parenting
                        .map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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