"use client";

import { CategoryExpenseBreakdown } from "@/lib/finance/dashboard";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

interface CategoryExpenseChartProps {
  data: CategoryExpenseBreakdown[];
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
  "#64748b", // slate
];

export function CategoryExpenseChart({ data }: CategoryExpenseChartProps) {
  const hasData = data.length > 0 && data.some((item) => item.amount > 0);

  return (
    <Card className="flex flex-col h-full border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600">
            <PieChartIcon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Expenses by Category</CardTitle>
            <CardDescription className="text-xs">Category spending distribution</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
        {hasData ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="name"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{value}</span>}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <PieChartIcon className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No expense data in selected date range</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
