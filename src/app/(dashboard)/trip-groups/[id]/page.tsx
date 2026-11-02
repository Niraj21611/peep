import { requireUser } from "@/lib/auth/session";
import { getTripGroupById } from "@/lib/db/trip-groups";
import { getCategoriesByUserId } from "@/lib/db/categories";
import { TripGroupDetail } from "@/components/trip-groups/trip-group-detail";
import { notFound } from "next/navigation";

interface TripGroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripGroupDetailPage({
  params,
}: TripGroupDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const [tripGroup, categories] = await Promise.all([
    getTripGroupById(id, user.id),
    getCategoriesByUserId(user.id, true),
  ]);

  if (!tripGroup) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <TripGroupDetail tripGroup={tripGroup} categories={categories} />
    </div>
  );
}
