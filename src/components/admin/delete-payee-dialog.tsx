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
import type { Payee } from "@/app/admin/payees/page";

type DeletePayeeDialogProps = {
  payee: Payee | null;
  isOpen: boolean;
  onClose: () => void;
  onPayeeDeleted: () => void;
};

export function DeletePayeeDialog({
  payee,
  isOpen,
  onClose,
  onPayeeDeleted,
}: DeletePayeeDialogProps) {
  const { supabase } = useSupabaseAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!payee) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("payees")
        .delete()
        .eq("id", payee.id);

      if (error) throw error;

      toast.success(`Payee "${payee.name}" deleted successfully.`);
      onPayeeDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error deleting payee:", error);
      toast.error(error.message || "Failed to delete payee.");
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
            payee <span className="font-bold">{payee?.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Yes, delete payee"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}