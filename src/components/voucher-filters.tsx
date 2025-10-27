"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
};

type VoucherFiltersProps = {
  companies: Company[];
  onFilterChange: (filters: {
    searchTerm: string;
    companyId: string | null;
  }) => void;
};

export function VoucherFilters({
  companies,
  onFilterChange,
}: VoucherFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );

  // Debounce the search term input to prevent excessive database queries
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Effect to trigger the parent callback when filters change
  useEffect(() => {
    onFilterChange({
      searchTerm: debouncedSearchTerm,
      companyId: selectedCompanyId,
    });
  }, [debouncedSearchTerm, selectedCompanyId, onFilterChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Pay To name..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Company Filter Select */}
      <div className="w-full sm:w-48">
        <Select
          onValueChange={(value) =>
            setSelectedCompanyId(value === "all" ? null : value)
          }
          defaultValue="all"
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}