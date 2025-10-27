"use client";

import { useEffect, useState, useMemo } from "react";
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
import { uploadFileAndGetUrl } from "@/lib/supabase-storage";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import type { Company } from "@/app/admin/companies/page";

const LOGO_BUCKET = "company_logos";

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
});

type EditCompanyDialogProps = {
  company?: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onCompanyUpdated: () => void;
};

export function EditCompanyDialog({
  company,
  isOpen,
  onClose,
  onCompanyUpdated,
}: EditCompanyDialogProps) {
  const { supabase } = useSupabaseAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!company;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (company) {
      form.reset({ name: company.name });
    } else {
      form.reset({ name: "" });
    }
    setFile(null); // Reset file on dialog open/close or company change
  }, [company, isOpen, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let logoUrl = company?.logo_url ?? null;
    let companyId = company?.id;

    try {
      // If creating a new company, generate a UUID first
      if (!isEditMode) {
        const { data, error } = await supabase.rpc('gen_random_uuid');
        if (error) throw new Error("Could not generate UUID for new company.");
        companyId = data;
      }

      if (!companyId) throw new Error("Company ID is missing.");

      // Handle file upload if a new file is selected
      if (file) {
        const fileExtension = file.name.split(".").pop();
        const storagePath = `logos/${companyId}.${fileExtension}`;
        const publicUrl = await uploadFileAndGetUrl(file, LOGO_BUCKET, storagePath);
        if (!publicUrl) throw new Error("Logo upload failed.");
        logoUrl = publicUrl;
      }

      // Upsert company data
      if (isEditMode) {
        const { error } = await supabase
          .from("companies")
          .update({ name: values.name, logo_url: logoUrl })
          .eq("id", companyId);
        if (error) throw error;
        toast.success("Company updated successfully.");
      } else {
        const { error } = await supabase
          .from("companies")
          .insert({ id: companyId, name: values.name, logo_url: logoUrl });
        if (error) throw error;
        toast.success("Company created successfully.");
      }

      onCompanyUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast.error(error.message || "Failed to save company.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return company?.logo_url;
  }, [file, company]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the company details below." : "Enter the details for the new company."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Company Logo</FormLabel>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border border-dashed flex items-center justify-center rounded-lg bg-muted/50">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Logo Preview"
                      width={64}
                      height={64}
                      style={{ objectFit: "contain" }}
                      className="max-h-full max-w-full p-1"
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="flex-1"
                />
              </div>
            </div>

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