"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

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
 * Calculates the start and end dates for a given time range, ensuring they are in UTC.
 * @param range The selected time range.
 * @returns DateRange object with start and end dates in UTC.
 */
export function calculateDateRange(range: TimeRange): DateRange {
  const now = new Date();
  let localStart: Date | null = null;
  let localEnd: Date | null = null;

  switch (range) {
    case "this_week":
      localStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
      localEnd = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "this_month":
      localStart = startOfMonth(now);
      localEnd = endOfMonth(now);
      break;
    case "last_month":
      const lastMonth = subMonths(now, 1);
      localStart = startOfMonth(lastMonth);
      localEnd = endOfMonth(lastMonth);
      break;
    case "this_year":
      localStart = startOfYear(now);
      localEnd = endOfYear(now);
      break;
    case "all":
    default:
      return { start: null, end: null };
  }

  // Convert local start and end dates to UTC Date objects.
  // This is crucial because the database operates in UTC. This conversion prevents
  // the user's local timezone from shifting the date range during the query,
  // which was causing bugs like including the next month's credit reset.
  const start = localStart
    ? new Date(
        Date.UTC(
          localStart.getFullYear(),
          localStart.getMonth(),
          localStart.getDate(),
          0, 0, 0, 0
        )
      )
    : null;

  const end = localEnd
    ? new Date(
        Date.UTC(
          localEnd.getFullYear(),
          localEnd.getMonth(),
          localEnd.getDate(),
          23, 59, 59, 999
        )
      )
    : null;

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