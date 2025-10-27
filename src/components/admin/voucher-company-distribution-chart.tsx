"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Voucher } from "@/components/voucher-list";
import { Skeleton } from "@/components/ui/skeleton";

type VoucherCompanyDistributionChartProps = {
  vouchers: Voucher[];
  isLoading: boolean;
};

// Define colors based on Shadcn chart variables (using CSS HSL values)
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Custom tooltip content for the Pie Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-semibold">{data.name}</p>
        <p className="text-muted-foreground">
          {data.value.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })}
        </p>
      </div>
    );
  }
  return null;
};

export function VoucherCompanyDistributionChart({
  vouchers,
  isLoading,
}: VoucherCompanyDistributionChartProps) {
  // Aggregate data: Calculate total amount per company
  const chartData = useMemo(() => {
    const companyTotals = new Map<string, number>();

    vouchers.forEach((voucher) => {
      const companyName = voucher.companies?.name || "Unknown Company";
      const currentTotal = companyTotals.get(companyName) || 0;
      companyTotals.set(companyName, currentTotal + voucher.total_amount);
    });

    return Array.from(companyTotals.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [vouchers]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vouchers by Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Vouchers by Company
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 p-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No voucher data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ paddingLeft: "10px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}