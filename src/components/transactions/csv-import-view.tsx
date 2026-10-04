"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseAndValidateCsvAction, executeCsvImportAction } from "@/actions/transactions";
import { CsvImportSummary } from "@/lib/finance/csv-importer";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Loader2,
  Download,
} from "lucide-react";

const SAMPLE_CSV = `Date,Type,Category,Amount,Notes
2026-10-01,Expense,Groceries,1250.00,Weekly supermarket purchase
2026-10-02,Expense,Transport,77.00,Daily bus commute
2026-10-03,Income,Salary,45000.00,Monthly salary deposit
2026-10-04,Expense,Bills & Subscriptions,499.00,Monthly internet bill`;

export function CsvImportView() {
  const router = useRouter();

  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const [summary, setSummary] = useState<CsvImportSummary | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "VALID" | "INVALID" | "DUPLICATE">("ALL");
  const [importedSuccessCount, setImportedSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (file: File) => {
    if (!file) return;

    setParsing(true);
    setSummary(null);
    setImportedSuccessCount(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const res = await parseAndValidateCsvAction(content);
      setParsing(false);

      if (res.success && res.data) {
        setSummary(res.data);
        toast.success(res.message);
      } else {
        toast.error(res.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "finance_import_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (!summary || summary.validCount === 0) return;

    setImporting(true);
    const validRows = summary.rows.filter((r) => r.status === "VALID");
    const result = await executeCsvImportAction(validRows);
    setImporting(false);

    if (result.success && result.data) {
      setImportedSuccessCount(result.data.importedCount);
      toast.success(result.message);
    } else {
      toast.error(result.message || "Failed to import transactions.");
    }
  };

  const filteredRows = summary
    ? summary.rows.filter((row) => filterStatus === "ALL" || row.status === filterStatus)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Navigation Back Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/transactions")}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Ledger
        </Button>
      </div>

      {/* Step 1: Upload Card (If no summary parsed yet) */}
      {!summary && (
        <Card className="border-dashed border-2 p-8 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-3">
            <div className="mx-auto p-4 rounded-full bg-primary/10 text-primary w-fit">
              <FileSpreadsheet className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold">Upload Transactions CSV</h2>
            <p className="text-sm text-muted-foreground">
              Import existing transaction records from Excel or Google Sheets. The CSV file must contain Date, Type, Category, and Amount headers.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
            <label className="w-full cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                disabled={parsing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <div className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow hover:bg-primary/90 transition-colors">
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Parsing & Validating CSV...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Select CSV File
                  </>
                )}
              </div>
            </label>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadSample}
              className="gap-2 text-xs text-muted-foreground"
            >
              <Download className="h-3.5 w-3.5" /> Download Sample CSV Template
            </Button>
          </div>
        </Card>
      )}

      {/* Success View */}
      {importedSuccessCount !== null && (
        <Alert className="border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="text-emerald-700 font-bold">Import Completed!</AlertTitle>
          <AlertDescription className="text-emerald-600 text-sm">
            Successfully imported <strong>{importedSuccessCount}</strong> transaction(s) into your financial ledger.
          </AlertDescription>
          <div className="pt-3">
            <Button size="sm" onClick={() => router.push("/transactions")}>
              View Updated Transactions Ledger
            </Button>
          </div>
        </Alert>
      )}

      {/* Step 2: Validation Preview & Confirmation */}
      {summary && importedSuccessCount === null && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="border">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Rows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalRows}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Valid Rows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{summary.validCount}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Invalid Rows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">{summary.invalidCount}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Duplicates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{summary.duplicateCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("ALL")}
              >
                All ({summary.totalRows})
              </Button>
              <Button
                variant={filterStatus === "VALID" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("VALID")}
                className={filterStatus === "VALID" ? "bg-emerald-600" : ""}
              >
                Valid ({summary.validCount})
              </Button>
              <Button
                variant={filterStatus === "INVALID" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("INVALID")}
                className={filterStatus === "INVALID" ? "bg-rose-600" : ""}
              >
                Invalid ({summary.invalidCount})
              </Button>
              <Button
                variant={filterStatus === "DUPLICATE" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("DUPLICATE")}
                className={filterStatus === "DUPLICATE" ? "bg-amber-600" : ""}
              >
                Duplicates ({summary.duplicateCount})
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSummary(null)}
              >
                Re-upload CSV
              </Button>

              <Button
                onClick={handleExecuteImport}
                disabled={summary.validCount === 0 || importing}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Confirm & Import {summary.validCount} Valid Entries
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Parsed Rows Preview Table */}
          <Card className="overflow-hidden border">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="w-[60px]">Row #</TableHead>
                  <TableHead>Raw Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validation Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow
                    key={row.rowIndex}
                    className={
                      row.status === "INVALID"
                        ? "bg-rose-50/50 dark:bg-rose-950/20"
                        : row.status === "DUPLICATE"
                        ? "bg-amber-50/50 dark:bg-amber-950/20"
                        : undefined
                    }
                  >
                    <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.parsedDate ? formatDateDisplay(row.parsedDate) : row.rawDate || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.parsedType ? (
                        <Badge variant="outline" className={row.parsedType === "INCOME" ? "text-emerald-600" : "text-rose-600"}>
                          {row.parsedType}
                        </Badge>
                      ) : (
                        row.rawType || "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.categoryName || row.rawCategory || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-bold">
                      {row.parsedAmount !== undefined ? formatCurrency(row.parsedAmount) : row.rawAmount || "—"}
                    </TableCell>
                    <TableCell>
                      {row.status === "VALID" && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                        </Badge>
                      )}
                      {row.status === "INVALID" && (
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">
                          <XCircle className="h-3 w-3 mr-1" /> Error
                        </Badge>
                      )}
                      {row.status === "DUPLICATE" && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Duplicate
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.errors.length > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          {row.errors.join("; ")}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Ready to import</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
