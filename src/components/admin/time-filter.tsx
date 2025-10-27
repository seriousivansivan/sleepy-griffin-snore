"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

export type TimeRange =
  | "all"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year";

export type DateRange = {
  start: Date | null;
  end: Date | null;
};

type TimeFilterProps = {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
};

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
];

/**
 * Calculates the start and end dates for a given time range.
 * @param range The selected time range.
 * @returns DateRange object with start and end dates.
 */
export function calculateDateRange(range: TimeRange): DateRange {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  switch (range) {
    case "this_week":
      start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "this_month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "last_month":
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    case "this_year":
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case "all":
    default:
      // start and end remain null for 'All Time'
      break;
  }

  // Ensure end date is set to the very end of the day for accurate filtering
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export function TimeFilter({ range, onRangeChange }: TimeFilterProps) {
  return (
    <Select
      value={range}
      onValueChange={(value) => onRangeChange(value as TimeRange)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Time Range" />
      </SelectTrigger>
      <SelectContent>
        {timeRangeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}