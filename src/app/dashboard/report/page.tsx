"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { PrintableReport } from "@/components/report/printable-report";
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

type Company = { id: string; name: string };
type ReportData = any[];

export default function ReportPage() {
  const { supabase, profile } = useSupabaseAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [responsiblePeople, setResponsiblePeople] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
  });

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const fetchDropdownData = useCallback(async () => {
    if (!profile) return;
    try {
      const companyIds = profile.user_companies.map((uc) => uc.company_id);
      if (companyIds.length > 0) {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds)
          .order("name");
        if (companyError) throw companyError;
        setCompanies(companyData || []);
        if (companyData && companyData.length > 0) {
          setSelectedCompanyId(companyData[0].id);
        }
      }

      const { data: voucherData, error: voucherError } = await supabase
        .from("vouchers")
        .select("details->>payTo");
      if (voucherError) throw voucherError;
      if (voucherData) {
        const uniqueNames = [
          ...new Set(voucherData.map((v: any) => v.payTo).filter(Boolean)),
        ];
        setResponsiblePeople(uniqueNames.sort());
      }
    } catch (error) {
      toast.error("Failed to load filter options.");
      console.error(error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [supabase, profile]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  const generateReport = async () => {
    if (!selectedCompanyId || !dateRange?.from || !dateRange?.to) {
      toast.warning("Please select a company and a valid date range.");
      return;
    }
    setIsLoading(true);
    setReportData(null);
    try {
      const { data, error } = await supabase.rpc("get_petty_cash_log", {
        p_company_id: selectedCompanyId,
        p_start_date: dateRange.from.toISOString(),
        p_end_date: dateRange.to.toISOString(),
        p_approved_by: selectedPerson || null,
      });

      if (error) throw error;
      setReportData(data);
    } catch (error) {
      toast.error("Failed to generate report.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const responsiblePeopleOptions = responsiblePeople.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="no-print">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Generate Report
        </h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            {isInitialLoading ? (
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-10 w-40" />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
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
                <Combobox
                  options={responsiblePeopleOptions}
                  value={selectedPerson}
                  onChange={setSelectedPerson}
                  placeholder="Filter by Payee..."
                  searchPlaceholder="Search or type name..."
                  emptyMessage="No results. You can type a custom name."
                  className="w-full sm:w-auto min-w-[220px]"
                />
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                />
                <Button onClick={generateReport} disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate Report"}
                </Button>
                {reportData && (
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

      {reportData &&
        selectedCompany &&
        dateRange?.from &&
        dateRange.to && (
          <PrintableReport
            data={reportData}
            companyName={selectedCompany.name}
            dateRange={{ from: dateRange.from, to: dateRange.to }}
            personResponsible={profile?.user_name || "N/A"}
          />
        )}
    </div>
  );
}