"use client";

import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";
import type { Profile } from "@/components/providers/supabase-auth-provider";

const formSchema = z.object({
  role: z.enum(["user", "admin"]),
  monthly_credit_allowance: z.coerce
    .number()
    .min(0, "Allowance cannot be negative."),
});

type EditUserDialogProps = {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
};

export function EditUserDialog({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: EditUserDialogProps) {
  const { supabase } = useSupabaseAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({
        role: user.role as "user" | "admin",
        monthly_credit_allowance: user.monthly_credit_allowance,
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        role: values.role,
        monthly_credit_allowance: values.monthly_credit_allowance,
      })
      .eq("id", user.id);

    if (error) {
      toast.error(`Failed to update user: ${error.message}`);
    } else {
      toast.success("User updated successfully.");
      onUserUpdated();
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user?.user_name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthly_credit_allowance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Credit Allowance</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="300.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Current Remaining Credit</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={user?.credit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                />
              </FormControl>
            </FormItem>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}