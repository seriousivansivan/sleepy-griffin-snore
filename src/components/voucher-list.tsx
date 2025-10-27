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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";

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
  companies: { name: string; logo_url: string | null } | null;
  user_id: { user_name: string | null } | null; // Added for creator name
};

type VoucherListProps = {
  vouchers: Voucher[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showCreator?: boolean; // New prop to control visibility of 'Created By' column
  showActions?: boolean; // New prop to control visibility of 'Actions' column
};

const VOUCHERS_PER_PAGE = 10;

export function VoucherList({
  vouchers,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  showCreator = true, // Default to true (visible)
  showActions = true, // Default to true (visible)
}: VoucherListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // Changed to USD as per English-only requirement
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
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

  // Calculate the subset of vouchers to display for the current page
  const startIndex = (currentPage - 1) * VOUCHERS_PER_PAGE;
  const endIndex = startIndex + VOUCHERS_PER_PAGE;
  const currentVouchers = vouchers.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voucher History</CardTitle>
          <CardDescription>
            Here is a list of recent vouchers.
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

  const renderPaginationItems = () => {
    const items = [];
    // Always show page 1
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => onPageChange(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Logic for ellipsis and intermediate pages
    if (totalPages > 1) {
      if (currentPage > 3) {
        items.push(<PaginationItem key="start-ellipsis">...</PaginationItem>);
      }

      // Show pages around the current page
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationItem key="end-ellipsis">...</PaginationItem>);
      }

      // Show last page if it's not page 1 and not already shown
      if (totalPages > 1 && totalPages !== 1) {
        if (totalPages !== 1 && !items.some(item => item.key === totalPages)) {
          items.push(
            <PaginationItem key={totalPages}>
              <PaginationLink
                onClick={() => onPageChange(totalPages)}
                isActive={currentPage === totalPages}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
    }
    return items;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Voucher History</CardTitle>
          <CardDescription>
            Here is a list of recent vouchers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {vouchers.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-gray-500">
                No vouchers found for this user.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showCreator && <TableHead>Created By</TableHead>}
                      <TableHead>Company</TableHead>
                      <TableHead>Pay To</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Particulars</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {showActions && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentVouchers.map((voucher) => (
                      <TableRow key={voucher.id}>
                        {showCreator && (
                          <TableCell className="font-medium">
                            {voucher.user_id?.user_name || "N/A"}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline">
                            {voucher.companies?.name || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {voucher.details?.payTo || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatDate(
                            voucher.details?.date || voucher.created_at
                          )}
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
                        {showActions && (
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
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => onPageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => onPageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}