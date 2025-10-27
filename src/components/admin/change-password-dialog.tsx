"use client";

import { useState } from "react";
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

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type ChangePasswordDialogProps = {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ChangePasswordDialog({
  userId,
  isOpen,
  onClose,
}: ChangePasswordDialogProps) {
  const { supabase } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  const handlePasswordChange = async (
    values: z.infer<typeof passwordSchema>
  ) => {
    setIsSubmitting(true);
    try {
      // Invoke the secure Edge Function to update the user's password
      const { error } = await supabase.functions.invoke('admin-update-user-password', {
        body: {
          userId: userId,
          newPassword: values.password,
        },
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      onClose();
      form.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(
        `Failed to change password: ${error.message || "An unknown error occurred."}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Password</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePasswordChange)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter a new password for this user. This action is performed with
              administrative privileges.
            </p>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}