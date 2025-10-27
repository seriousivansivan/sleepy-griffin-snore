"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Voucher } from "@/components/voucher-list";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type AggregationMode = 'amount' | 'count';

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
const CustomTooltip = ({ active, payload, mode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value;
    
    let formattedValue;
    if (mode === 'amount') {
      formattedValue = value.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
      });
    } else {
      formattedValue = `${value} voucher${value !== 1 ? 's' : ''}`;
    }

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-semibold">{data.name}</p>
        <p className="text-muted-foreground">{formattedValue}</p>
      </div>
    );
  }
  return null;
};

export function VoucherCompanyDistributionChart({
  vouchers,
  isLoading,
}: VoucherCompanyDistributionChartProps) {
  const [mode, setMode] = useState<AggregationMode>('amount');

  // Aggregate data based on the selected mode
  const chartData = useMemo(() => {
    const companyData = new Map<string, number>();

    vouchers.forEach((voucher) => {
      const companyName = voucher.companies?.name || "Unknown Company";
      const currentValue = companyData.get(companyName) || 0;
      
      if (mode === 'amount') {
        companyData.set(companyName, currentValue + voucher.total_amount);
      } else {
        // mode === 'count'
        companyData.set(companyName, currentValue + 1);
      }
    });

    return Array.from(companyData.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [vouchers, mode]);

  const chartTitle = mode === 'amount' ? 'Vouchers by Currency' : 'Vouchers by Quantity';

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
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium pt-2">
          {chartTitle}
        </CardTitle>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value: AggregationMode) => {
            if (value) setMode(value);
          }}
          className="h-8"
        >
          <ToggleGroupItem value="amount" aria-label="Toggle by currency" className="h-8 text-xs px-3">
            By Currency
          </ToggleGroupItem>
          <ToggleGroupItem value="count" aria-label="Toggle by quantity" className="h-8 text-xs px-3">
            By Quantity
          </ToggleGroupItem>
        </ToggleGroup>
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
              <Tooltip content={<CustomTooltip mode={mode} />} />
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