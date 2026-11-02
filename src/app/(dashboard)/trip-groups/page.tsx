import { requireUser } from "@/lib/auth/session";
import { getTripGroupsByUserId } from "@/lib/db/trip-groups";
import { getCategoriesByUserId } from "@/lib/db/categories";
import { TripGroupList } from "@/components/trip-groups/trip-group-list";

export default async function TripGroupsPage() {
  const user = await requireUser();

  const [tripGroups, categories] = await Promise.all([
    getTripGroupsByUserId(user.id),
    getCategoriesByUserId(user.id, true),
  ]);

  return (
    <div className="space-y-5">
      <TripGroupList tripGroups={tripGroups} categories={categories} />
    </div>
  );
}
