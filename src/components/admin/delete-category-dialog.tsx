"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import type { Category } from "@/app/admin/categories/page";

type DeleteCategoryDialogProps = {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onCategoryDeleted: () => void;
};

export function DeleteCategoryDialog({
  category,
  isOpen,
  onClose,
  onCategoryDeleted,
}: DeleteCategoryDialogProps) {
  const { supabase } = useSupabaseAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("voucher_categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;

      toast.success(`Category "${category.name}" deleted successfully.`);
      onCategoryDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            category <span className="font-bold">{category?.name}</span>.
            If this is a main category, its sub-categories will become main categories.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Yes, delete category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}