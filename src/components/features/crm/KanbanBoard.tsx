"use client";

import { useTransition, useState } from "react";
import { Database } from "@/types/database.types";
import { updateProspectoStatus } from "@/app/actions/crm";
import { cn } from "@/lib/utils/cn";

type Prospecto = Database["public"]["Tables"]["prospectos"]["Row"];

interface KanbanBoardProps {
  prospectos: Prospecto[];
}

const COLUMNS = ["NUEVO", "CONTACTADO", "INTERESADO"];

export function KanbanBoard({ prospectos }: KanbanBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const getStage = (status: string | null) => {
    const s = (status || "NUEVO").toUpperCase();
    if (COLUMNS.includes(s)) return s;
    if (s.includes("NUEVO")) return "NUEVO";
    if (s.includes("CONTACT")) return "CONTACTADO";
    if (s.includes("INTERES")) return "INTERESADO";
    return "NUEVO";
  };

  const getInterestBadge = (nivel: string | null) => {
    const n = (nivel || "").toUpperCase();
    if (n.includes("ALTO")) return <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Alto 🔥</span>;
    if (n.includes("MEDIO")) return <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Medio</span>;
    if (n.includes("BAJO")) return <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Bajo</span>;
    return <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">No definido</span>;
  };
  
  const getColumnColor = (col: string) => {
    switch (col) {
      case "NUEVO": return "bg-red-50/50 border-[#C4121A]/20";
      case "CONTACTADO": return "bg-blue-50/50 border-blue-500/20";
      case "INTERESADO": return "bg-purple-50/50 border-purple-500/20";
      default: return "bg-slate-50 border-slate-200";
    }
  };
  
  const getColumnBadgeColor = (col: string) => {
    switch (col) {
      case "NUEVO": return "bg-red-100 text-[#C4121A]";
      case "CONTACTADO": return "bg-blue-100 text-blue-700";
      case "INTERESADO": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-200 text-slate-700";
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    if (!draggedId) return;

    startTransition(async () => {
      await updateProspectoStatus(draggedId, newStatus);
    });
    setDraggedId(null);
  };

  const handleStatusChangeClick = (id: string, currentStatus: string) => {
    const currentIndex = COLUMNS.indexOf(currentStatus);
    const nextStatus = COLUMNS[(currentIndex + 1) % COLUMNS.length];
    
    startTransition(async () => {
      await updateProspectoStatus(id, nextStatus);
    });
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
    <div className="flex flex-col md:flex-row gap-4 items-start h-full">
      {COLUMNS.map(col => (
        <div 
          key={col} 
          className={cn(
            "flex-1 w-full p-4 rounded-xl border flex flex-col min-h-[500px]",
            getColumnColor(col)
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{col}</h3>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              getColumnBadgeColor(col)
            )}>
              {grouped[col].length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {grouped[col].map(p => (
              <div 
                key={p.id} 
                draggable
                onDragStart={() => handleDragStart(p.id)}
                onClick={() => handleStatusChangeClick(p.id, col)}
                className={cn(
                  "bg-white border border-slate-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-300 hover:shadow transition-all",
                  isPending ? "opacity-50 pointer-events-none" : "",
                  draggedId === p.id ? "opacity-50 border-[#C4121A] border-dashed" : ""
                )}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="font-bold text-sm text-slate-900 leading-tight">
                    {p.nombres} {p.apellidos}
                  </div>
                  {getInterestBadge(p.nivel_interes)}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  {p.telefono || "Sin teléfono"}
                </div>
              </div>
            ))}
            {grouped[col].length === 0 && (
              <div className="text-center text-xs font-medium text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                Arrastra un prospecto aquí
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
