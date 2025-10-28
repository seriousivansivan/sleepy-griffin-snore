"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Voucher } from "@/components/voucher-list";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeRange } from "@/components/admin/time-filter";
import { format, parseISO } from "date-fns";

type VoucherTrendChartProps = {
  vouchers: Voucher[];
  isLoading: boolean;
  timeRange: TimeRange;
};

// Define colors based on Shadcn chart variables
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Custom tooltip for the Line Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toLocaleString(undefined, {
              style: "currency",
              currency: "THB",
            })}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function VoucherTrendChart({
  vouchers,
  isLoading,
  timeRange,
}: VoucherTrendChartProps) {
  const { chartData, companyNames } = useMemo(() => {
    if (vouchers.length === 0) return { chartData: [], companyNames: [] };

    const isLongRange = timeRange === "this_year" || timeRange === "all";
    const dateFormat = isLongRange ? "yyyy-MM" : "yyyy-MM-dd";

    const dataMap = new Map<string, any>();
    const uniqueCompanyNames = new Set<string>();

    const sortedVouchers = [...vouchers].sort(
      (a, b) =>
        parseISO(a.details.date || a.created_at).getTime() -
        parseISO(b.details.date || b.created_at).getTime()
    );

    sortedVouchers.forEach((voucher) => {
      const companyName = voucher.companies?.name || "Unknown";
      uniqueCompanyNames.add(companyName);

      const date = parseISO(voucher.details.date || voucher.created_at);
      const key = format(date, dateFormat);

      if (!dataMap.has(key)) {
        dataMap.set(key, {
          date: format(date, isLongRange ? "MMM yyyy" : "dd MMM"),
        });
      }

      const entry = dataMap.get(key);
      entry[companyName] = (entry[companyName] || 0) + voucher.total_amount;
    });

    const finalCompanyNames = Array.from(uniqueCompanyNames);
    const finalChartData = Array.from(dataMap.values()).map(entry => {
        finalCompanyNames.forEach(name => {
            if (!entry[name]) {
                entry[name] = 0;
            }
        });
        return entry;
    });

    return { chartData: finalChartData, companyNames: finalCompanyNames };
  }, [vouchers, timeRange]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trend by Company</CardTitle>
      </CardHeader>
      <CardContent className="h-80 p-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data to display trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {companyNames.map((companyName, index) => (
                <Line
                  key={companyName}
                  type="monotone"
                  dataKey={companyName}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}