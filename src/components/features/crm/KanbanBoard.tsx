"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Database } from "@/types/database.types";

type Prospecto = Database["public"]["Tables"]["prospectos"]["Row"];

interface KanbanBoardProps {
  prospectos: Prospecto[];
}

const COLUMNS = ["NUEVO", "CONTACTADO", "INTERESADO"];

export function KanbanBoard({ prospectos }: KanbanBoardProps) {
  const getStage = (status: string | null) => {
    const s = (status || "NUEVO").toUpperCase();
    if (COLUMNS.includes(s)) return s;
    // Basic fallback logic
    if (s.includes("NUEVO")) return "NUEVO";
    if (s.includes("CONTACT")) return "CONTACTADO";
    if (s.includes("INTERES")) return "INTERESADO";
    return "NUEVO";
  };

  const getInterestVariant = (nivel: string | null) => {
    const n = (nivel || "").toUpperCase();
    if (n.includes("ALTO")) return "success";
    if (n.includes("MEDIO")) return "warning";
    if (n.includes("BAJO")) return "danger";
    return "default";
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = [];
    return acc;
  }, {} as Record<string, Prospecto[]>);

  prospectos.forEach(p => {
    const stage = getStage(p.status);
    if (grouped[stage]) {
      grouped[stage].push(p);
    } else {
      grouped["NUEVO"].push(p);
    }
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {COLUMNS.map(col => (
        <div key={col} className="flex-1 w-full bg-muted/30 p-4 rounded-xl min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-graphite-800">{col}</h3>
            <Badge variant="default">{grouped[col].length}</Badge>
          </div>
          <div className="space-y-4">
            {grouped[col].map(p => (
              <Card key={p.id} className="cursor-pointer hover:border-brand-500 transition-colors">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="font-medium text-graphite-900">
                    {p.nombres} {p.apellidos}
                  </div>
                  <div className="text-sm text-graphite-600">
                    {p.telefono || "Sin teléfono"}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-graphite-500 font-medium">Interés:</span>
                    <Badge variant={getInterestVariant(p.nivel_interes)}>
                      {p.nivel_interes || "No definido"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {grouped[col].length === 0 && (
              <div className="text-center text-sm text-graphite-400 py-8 border-2 border-dashed border-border rounded-lg">
                No hay prospectos
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
