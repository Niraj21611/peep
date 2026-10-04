"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, FilterX } from "lucide-react";

interface DashboardDateFilterProps {
  startDateStr: string;
  endDateStr: string;
}

export function DashboardDateFilter({
  startDateStr,
  endDateStr,
}: DashboardDateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateDates = (start: string, end: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (start) params.set("startDate", start);
    else params.delete("startDate");

    if (end) params.set("endDate", end);
    else params.delete("endDate");

    router.push(`/dashboard?${params.toString()}`);
  };

  const handleQuickPreset = (preset: "thisMonth" | "lastMonth" | "last30" | "thisYear") => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (preset === "thisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === "last30") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    updateDates(formatDateStr(start), formatDateStr(end));
  };

  const handleClear = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border bg-background shadow-sm">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Dashboard Date Range</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">From:</span>
          <Input
            type="date"
            value={startDateStr}
            onChange={(e) => updateDates(e.target.value, endDateStr)}
            className="h-8 w-[140px] text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">To:</span>
          <Input
            type="date"
            value={endDateStr}
            onChange={(e) => updateDates(startDateStr, e.target.value)}
            className="h-8 w-[140px] text-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset("thisMonth")}
            className="h-8 text-xs px-2.5"
          >
            This Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset("lastMonth")}
            className="h-8 text-xs px-2.5"
          >
            Last Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset("thisYear")}
            className="h-8 text-xs px-2.5"
          >
            This Year
          </Button>
          {(startDateStr || endDateStr) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
