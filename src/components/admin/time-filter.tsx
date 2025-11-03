"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
 * Calculates the start and end dates for a given time range, based entirely on UTC.
 * This prevents local browser timezones from affecting database queries.
 * @param range The selected time range.
 * @returns DateRange object with start and end dates as UTC Date objects.
 */
export function calculateDateRange(range: TimeRange): DateRange {
  const now = new Date();

  let start: Date | null = null;
  let end: Date | null = null;

  switch (range) {
    case "this_week": {
      const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days to subtract to get to Monday
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
      start = startOfDay;
      // End of the week is 7 days after start, minus one millisecond
      end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      break;
    }
    case "this_month": {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      // To get end of month, go to the start of the next month and subtract a millisecond
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      end = new Date(nextMonth.getTime() - 1);
      break;
    }
    case "last_month": {
      const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      end = new Date(firstOfThisMonth.getTime() - 1); // This is the exact end of last month in UTC
      start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1)); // This is the start of that same month
      break;
    }
    case "this_year": {
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
      break;
    }
    case "all":
    default:
      return { start: null, end: null };
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