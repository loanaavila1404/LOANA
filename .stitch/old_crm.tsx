import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/features/crm/KanbanBoard";
import { CRMHeader } from "@/components/features/crm/CRMHeader";

export default async function CRMPage() {
  const supabase = await createClient();

  // Fetch prospectos data
  const { data: prospectos, error } = await supabase
    .from("prospectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching prospectos:", error);
  }

  return (
    <div className="space-y-6">
      <CRMHeader />
      <KanbanBoard prospectos={prospectos || []} />
    </div>
  );
}

