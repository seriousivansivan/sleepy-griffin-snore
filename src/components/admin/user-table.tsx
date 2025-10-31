"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/components/providers/supabase-auth-provider";
import Link from "next/link";
import { cn } from "@/lib/utils";

type UserTableProps = {
  users: Profile[];
  onUserUpdated: () => void; // Kept for consistency, though updates happen on the detail page
};

export function UserTable({ users }: UserTableProps) {
  // Removed editingUser state and EditUserDialog import/usage

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Monthly Allowance</TableHead>
            <TableHead className="text-right">Remaining Credit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.user_name || "N/A"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {user.has_unlimited_credit ? (
                  <Badge variant="outline">Unlimited</Badge>
                ) : (
                  (user.monthly_credit_allowance ?? 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )
                )}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right",
                  !user.has_unlimited_credit &&
                    (user.credit ?? 0) < 0 &&
                    "text-destructive"
                )}
              >
                {user.has_unlimited_credit ? (
                  <Badge variant="outline">Unlimited</Badge>
                ) : (
                  (user.credit ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/users/${user.id}`}>Edit Details</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}