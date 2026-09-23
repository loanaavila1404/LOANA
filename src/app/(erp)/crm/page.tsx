import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { PlusCircle } from "lucide-react";
import { KanbanBoard } from "@/components/features/crm/KanbanBoard";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">CRM Comercial</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Prospecto
        </Button>
      </div>

      <KanbanBoard prospectos={prospectos || []} />
    </div>
  );
}
