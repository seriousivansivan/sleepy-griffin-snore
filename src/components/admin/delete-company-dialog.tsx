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
import type { Company } from "@/app/admin/companies/page";

type DeleteCompanyDialogProps = {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onCompanyDeleted: () => void;
};

const LOGO_BUCKET = "company_logos";

export function DeleteCompanyDialog({
  company,
  isOpen,
  onClose,
  onCompanyDeleted,
}: DeleteCompanyDialogProps) {
  const { supabase } = useSupabaseAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!company) return;

    setIsDeleting(true);
    try {
      // 1. Delete logo from storage if it exists
      if (company.logo_url) {
        const path = company.logo_url.split(`${LOGO_BUCKET}/`)[1];
        if (path) {
          const { error: storageError } = await supabase.storage
            .from(LOGO_BUCKET)
            .remove([path]);
          if (storageError) {
            // Log error but proceed with DB deletion
            console.error("Could not delete company logo:", storageError);
            toast.warning("Could not delete company logo, but proceeding with deletion.");
          }
        }
      }

      // 2. Delete company from database
      const { error: dbError } = await supabase
        .from("companies")
        .delete()
        .eq("id", company.id);

      if (dbError) throw dbError;

      toast.success(`Company "${company.name}" deleted successfully.`);
      onCompanyDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast.error(error.message || "Failed to delete company.");
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
            company <span className="font-bold">{company?.name}</span> and all
            associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Yes, delete company"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}