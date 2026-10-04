"use client";

import { MonthlyComparisonData } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface MonthlyComparisonChartProps {
  data: MonthlyComparisonData[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const hasData = data.some((item) => item.income > 0 || item.expense > 0);

  return (
    <Card className="flex flex-col h-full border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
            <CardDescription className="text-xs">Historical cash flow comparison over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
        {hasData ? (
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), ""]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  formatter={(value) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{value}</span>}
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No historical transaction data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
