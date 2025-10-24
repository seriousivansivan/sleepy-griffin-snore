"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the type for the voucher details
type VoucherDetails = {
  payTo: string;
  date: string;
  particulars: string;
};

// Update the Voucher type to include the structured details
export type Voucher = {
  id: number;
  total_amount: number;
  details: VoucherDetails; // Use the new type
  created_at: string;
  companies: { name: string } | null;
};

type VoucherListProps = {
  vouchers: Voucher[];
  isLoading: boolean;
};

export function VoucherList({ vouchers, isLoading }: VoucherListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // This will now format the date from the details object
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Vouchers</CardTitle>
          <CardDescription>
            Here is a list of your recent vouchers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Your Vouchers</CardTitle>
          <CardDescription>
            Here is a list of your recent vouchers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vouchers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                You haven't created any vouchers yet.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Create New Voucher" to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Pay To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Particulars</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {voucher.companies?.name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {voucher.details?.payTo || "N/A"}
                    </TableCell>
                    <TableCell>
                      {formatDate(voucher.details?.date || voucher.created_at)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(voucher.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger className="truncate max-w-[200px] text-left block">
                          {voucher.details?.particulars || "No details"}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {voucher.details?.particulars}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}