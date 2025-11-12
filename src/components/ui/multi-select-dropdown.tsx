"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

type MultiSelectDropdownProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
}: MultiSelectDropdownProps) {
  const handleSelect = (item: string) => {
    const newSelected = selected.includes(item)
      ? selected.filter((i) => i !== item)
      : [...selected, item];
    onChange(newSelected);
  };

  const displayText =
    selected.length > 0
      ? `${selected.length} selected`
      : placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`w-full justify-between ${className}`}>
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
        <DropdownMenuLabel>Select Payees</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={() => handleSelect(option)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}