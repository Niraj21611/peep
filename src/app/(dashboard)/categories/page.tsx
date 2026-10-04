import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tags } from "lucide-react";

export default async function CategoriesPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage dynamic income and expense classification categories."
      >
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </PageHeader>

      <Card className="border-dashed">
        <CardHeader className="text-center py-16">
          <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground w-fit mb-4">
            <Tags className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Dynamic Categories Module</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Category creation, type classification (Income/Expense), and activation controls will be implemented in the category management phase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
