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
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Link from "next/link";

// Define the types for the new voucher structure
type VoucherItem = {
  particulars: string;
  amount: number;
};

type VoucherDetails = {
  payTo: string;
  date: string;
  items: VoucherItem[];
};

export type Voucher = {
  id: number;
  total_amount: number;
  details: VoucherDetails;
  created_at: string;
  companies: { name: string; logo_url: string | null } | null; // UPDATED: Added logo_url
};

type VoucherListProps = {
  vouchers: Voucher[];
  isLoading: boolean;
};

export function VoucherList({ vouchers, isLoading }: VoucherListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // Changed to USD as per English-only requirement
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getParticularsPreview = (items: VoucherItem[]) => {
    if (!items || items.length === 0) return "No details";
    const firstItem = items[0].particulars;
    if (items.length > 1) {
      return `${firstItem} (+${items.length - 1} more)`;
    }
    return firstItem;
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
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger className="truncate max-w-[200px] text-left block">
                          {getParticularsPreview(voucher.details?.items)}
                        </TooltipTrigger>
                        <TooltipContent>
                          <ul className="list-disc pl-4">
                            {voucher.details?.items?.map((item, index) => (
                              <li key={index}>{item.particulars}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(voucher.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/dashboard/voucher/${voucher.id}/print`}
                              target="_blank"
                            >
                              <Printer className="h-4 w-4" />
                              <span className="sr-only">Print Voucher</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Print Voucher</p>
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