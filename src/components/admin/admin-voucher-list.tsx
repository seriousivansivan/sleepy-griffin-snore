"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { VoucherList, Voucher } from "@/components/voucher-list";
import { toast } from "sonner";
import { TimeFilter, TimeRange, calculateDateRange } from "./time-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";

type UserProfile = {
  id: string;
  user_name: string | null;
};

type Company = {
  id: string;
  name: string;
};

type RawVoucher = Omit<Voucher, "companies" | "user"> & {
  company_id: string;
  user_id: string;
};

export function AdminVoucherList() {
  const { supabase } = useSupabaseAuth();
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [searchPayTo, setSearchPayTo] = useState<string>("");

  // Data for filters
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, companiesRes, vouchersRes] = await Promise.all([
        supabase.from("profiles").select("id, user_name").order("user_name"),
        supabase.from("companies").select("id, name").order("name"),
        supabase.rpc("get_all_vouchers_for_admin"),
      ]);

      if (usersRes.error) throw usersRes.error;
      setAllUsers(usersRes.data as UserProfile[]);

      if (companiesRes.error) throw companiesRes.error;
      setAllCompanies(companiesRes.data);

      if (vouchersRes.error) throw vouchersRes.error;
      const rawVouchers = vouchersRes.data as RawVoucher[];

      const userMap = new Map(usersRes.data.map((u) => [u.id, u]));
      const companyMap = new Map(companiesRes.data.map((c) => [c.id, c]));

      const formattedVouchers: Voucher[] = rawVouchers.map((v) => ({
        ...v,
        id: v.id,
        total_amount: v.total_amount,
        details: v.details as Voucher["details"],
        created_at: v.created_at,
        companies: companyMap.get(v.company_id) || null,
        user: userMap.get(v.user_id)
          ? {
              id: v.user_id,
              user_name: userMap.get(v.user_id)?.user_name || "N/A",
            }
          : null,
      }));

      setAllVouchers(formattedVouchers);
    } catch (error) {
      console.error("Error fetching admin voucher data:", error);
      toast.error("Failed to load voucher data.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    let vouchers = [...allVouchers];
    const { start, end } = calculateDateRange(timeRange);

    if (start && end) {
      vouchers = vouchers.filter((v) => {
        const voucherDate = new Date(v.created_at);
        return voucherDate >= start && voucherDate <= end;
      });
    }
    if (selectedUser !== "all") {
      vouchers = vouchers.filter((v) => v.user?.id === selectedUser);
    }
    if (selectedCompany !== "all") {
      vouchers = vouchers.filter((v) => v.companies?.id === selectedCompany);
    }
    if (searchPayTo) {
      vouchers = vouchers.filter((v) =>
        v.details.payTo.toLowerCase().includes(searchPayTo.toLowerCase())
      );
    }

    setFilteredVouchers(vouchers);
    setCurrentPage(1);
  }, [timeRange, selectedUser, selectedCompany, searchPayTo, allVouchers]);

  const totalPages = useMemo(
    () => Math.ceil(filteredVouchers.length / 10),
    [filteredVouchers]
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by Payee..."
                value={searchPayTo}
                onChange={(e) => setSearchPayTo(e.target.value)}
              />
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.user_name || "Unnamed User"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {allCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TimeFilter range={timeRange} onRangeChange={setTimeRange} />
            </div>
          )}
        </CardContent>
      </Card>

      <VoucherList
        vouchers={filteredVouchers}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showCreator={true}
        showActions={true}
      />
    </div>
  );
}