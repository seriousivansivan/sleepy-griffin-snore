"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditPayeeDialog } from "./edit-payee-dialog";
import { DeletePayeeDialog } from "./delete-payee-dialog";
import type { Payee } from "@/app/admin/payees/page";

type PayeeTableProps = {
  payees: Payee[];
  onActionComplete: () => void;
};

export function PayeeTable({ payees, onActionComplete }: PayeeTableProps) {
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
  const [deletingPayee, setDeletingPayee] = useState<Payee | null>(null);

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payees.map((payee) => (
              <TableRow key={payee.id}>
                <TableCell className="font-medium">{payee.name}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPayee(payee)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingPayee(payee)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditPayeeDialog
        payee={editingPayee}
        isOpen={!!editingPayee}
        onClose={() => setEditingPayee(null)}
        onPayeeUpdated={onActionComplete}
      />

      <DeletePayeeDialog
        payee={deletingPayee}
        isOpen={!!deletingPayee}
        onClose={() => setDeletingPayee(null)}
        onPayeeDeleted={onActionComplete}
      />
    </>
  );
}