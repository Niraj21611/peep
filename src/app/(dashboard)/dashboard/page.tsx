import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Finance Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dashboard view modules will be implemented in subsequent development steps.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
