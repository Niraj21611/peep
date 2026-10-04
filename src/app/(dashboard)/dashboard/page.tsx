import { requireUser } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Authenticated Session Active for {user.email}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Authentication Verified</CardTitle>
            <CardDescription>
              HTTP-only cookie authentication session is active and secure.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Financial ledger, budget management, and analytical dashboard modules will be built in upcoming phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
