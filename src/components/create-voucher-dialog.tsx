"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CreateVoucherForm } from "./create-voucher-form";

export function CreateVoucherDialog({
  userId,
  companies,
}: {
  userId: string;
  companies: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-8">
          <Plus className="mr-2 h-4 w-4" />
          Create Voucher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Voucher</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new voucher.
          </DialogDescription>
        </DialogHeader>
        <CreateVoucherForm
          userId={userId}
          companies={companies}
          onVoucherCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}