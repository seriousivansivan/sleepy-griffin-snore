"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subMonths, startOfMonth, endOfMonth, formatISO } from "date-fns";
import { toast } from "sonner";
import { PrintableSummary } from "@/components/report/printable-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Company = { id: string; name: string };
type SummaryData = { category: string; total_amount: number }[];

export default function SummaryPage() {
  const { supabase } = useSupabaseAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payees, setPayees] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedPayee, setSelectedPayee] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [bankName, setBankName] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [companyRes, payeeRes] = await Promise.all([
        supabase.from("companies").select("id, name").order("name"),
        supabase.from("vouchers").select("details->>payTo"),
      ]);

      if (companyRes.error) throw companyRes.error;
      setCompanies(companyRes.data || []);
      if (companyRes.data && companyRes.data.length > 0) {
        setSelectedCompanyId(companyRes.data[0].id);
      }

      if (payeeRes.error) throw payeeRes.error;
      if (payeeRes.data) {
        const uniqueNames = [
          ...new Set(payeeRes.data.map((v: any) => v.payTo).filter(Boolean)),
        ];
        setPayees(uniqueNames.sort());
      }
    } catch (error) {
      toast.error("Failed to load filter options.");
      console.error(error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  const generateSummary = async () => {
    if (!selectedCompanyId || !dateRange?.from || !dateRange?.to) {
      toast.warning("Please select a company and a valid date range.");
      return;
    }
    setIsLoading(true);
    setSummaryData(null);
    try {
      const { data, error } = await supabase.rpc(
        "get_voucher_summary_for_admin",
        {
          p_company_id: selectedCompanyId,
          p_start_date: formatISO(dateRange.from),
          p_end_date: formatISO(dateRange.to),
          p_payee: selectedPayee || null,
        }
      );

      if (error) throw error;
      setSummaryData(data);
    } catch (error) {
      toast.error("Failed to generate summary.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const payeeOptions = payees.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="no-print">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Generate Summary
        </h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Summary Filters</CardTitle>
          </CardHeader>
          <CardContent>
            {isInitialLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Select
                      value={selectedCompanyId}
                      onValueChange={setSelectedCompanyId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filter by Payee (Optional)</Label>
                    <Combobox
                      options={payeeOptions}
                      value={selectedPayee}
                      onChange={setSelectedPayee}
                      placeholder="All Payees"
                      searchPlaceholder="Search or type name..."
                      emptyMessage="No results."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Range of the Date</Label>
                    <DatePickerWithRange
                      date={dateRange}
                      onDateChange={setDateRange}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="e.g. Kasikorn Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account</Label>
                    <Input
                      id="bankAccount"
                      placeholder="e.g. 123-4-56789-0"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <Button onClick={generateSummary} disabled={isLoading}>
                    {isLoading ? "Generating..." : "Generate Summary"}
                  </Button>
                  {summaryData && (
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                      className="ml-auto"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {summaryData &&
        selectedCompany &&
        dateRange?.from &&
        dateRange.to && (
          <PrintableSummary
            data={summaryData}
            companyName={selectedCompany.name}
            dateRange={{ from: dateRange.from, to: dateRange.to }}
            personResponsible={selectedPayee || "All Payees"}
            bankName={bankName}
            bankAccount={bankAccount}
          />
        )}
    </div>
  );
}