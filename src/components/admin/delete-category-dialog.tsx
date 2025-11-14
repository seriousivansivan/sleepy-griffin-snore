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

  const hasSubCategories = category?.sub_categories && category.sub_categories.length > 0;

  const handleDelete = async () => {
    if (!category || hasSubCategories) return;

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
            {hasSubCategories ? (
              <>
                You cannot delete the category <span className="font-bold">{category?.name}</span> because it has sub-categories. Please delete or re-assign its sub-categories first.
              </>
            ) : (
              <>
                This action cannot be undone. This will permanently delete the
                category <span className="font-bold">{category?.name}</span>.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {hasSubCategories ? "OK" : "Cancel"}
          </AlertDialogCancel>
          {!hasSubCategories && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, delete category"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}