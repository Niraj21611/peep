import { requireUser } from "@/lib/auth/session";
import { getCategoriesByUserId } from "@/lib/db/categories";
import { getTemplatesByUserId } from "@/lib/db/templates";
import { TemplateList } from "@/components/templates/template-list";

export const metadata = {
  title: "Transaction Templates | Personal Finance Tracker",
  description: "Manage quick transaction templates and preset amount chunks",
};

export default async function TemplatesPage() {
  const user = await requireUser();

  const [categories, templates] = await Promise.all([
    getCategoriesByUserId(user.id, true),
    getTemplatesByUserId(user.id),
  ]);

  return <TemplateList templates={templates} categories={categories} />;
}
