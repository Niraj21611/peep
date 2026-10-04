import { requireUser } from "@/lib/auth/session";
import { getCategoriesByUserId } from "@/lib/db/categories";
import { CategoryList } from "@/components/categories/category-list";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await getCategoriesByUserId(user.id, true);

  return <CategoryList categories={categories} />;
}
