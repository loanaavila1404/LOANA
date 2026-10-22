"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import { Database } from "@/types/database.types";
import { updateProspectoStatusAction } from "@/app/actions/crm/prospectos";
import { cn } from "@/lib/utils/cn";
import { Phone, BookOpen, ArrowRight, ExternalLink, FileCheck } from "lucide-react";

type ProspectoRow = Database["public"]["Tables"]["prospectos"]["Row"];

export interface EnrichedProspecto extends ProspectoRow {
  programas?: { id?: string; nombre: string; codigo?: string } | { id?: string; nombre: string; codigo?: string }[] | null;
  ediciones?: { id?: string; codigo: string } | { id?: string; codigo: string }[] | null;
  profiles?: { id?: string; display_name: string | null; email?: string | null; photo_url?: string | null } | { id?: string; display_name: string | null; email?: string | null; photo_url?: string | null }[] | null;
}

interface KanbanBoardProps {
  prospectos: EnrichedProspecto[];
  onStageUpdated?: (id: string, newStage: string) => void;
}

export const KANBAN_STAGES = [
  { key: "NUEVO", label: "NUEVO", shortLabel: "Nuevos" },
  { key: "CONTACTADO", label: "CONTACTADO", shortLabel: "Contactados" },
  { key: "EN SEGUIMIENTO", label: "EN SEGUIMIENTO", shortLabel: "Seguimiento" },
  { key: "INTERESADO", label: "INTERESADO", shortLabel: "Interesados" },
  { key: "PREMATRICULA", label: "PREMATRICULA", shortLabel: "Prematrícula" },
  { key: "MATRICULADO", label: "MATRICULADO", shortLabel: "Matriculados" },
  { key: "PERDIDO", label: "PERDIDO", shortLabel: "Perdidos" },
] as const;

export function normalizeProspectoStage(status: string | null | undefined): string {
  const s = (status || "NUEVO").trim().toUpperCase();
  if (s === "NUEVO") return "NUEVO";
  if (s === "CONTACTADO") return "CONTACTADO";
  if (s === "SEGUIMIENTO" || s === "EN_SEGUIMIENTO" || s === "EN SEGUIMIENTO") return "EN SEGUIMIENTO";
  if (s === "INTERESADO" || s === "ENTREVISTA") return "INTERESADO";
  if (s === "PREMATRICULA" || s === "PRE_MATRICULADO" || s === "RESERVADA") return "PREMATRICULA";
  if (s === "MATRICULADO" || s === "CONVERTIDO") return "MATRICULADO";
  if (s === "PERDIDO" || s === "DESCARTADO") return "PERDIDO";
  return "NUEVO";
}

const CANAL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  FACEBOOK_ADS: "Facebook Ads",
  FACEBOOK: "Facebook Ads",
  INSTAGRAM: "Instagram",
  WEB: "Página Web",
  TIKTOK: "TikTok",
  LLAMADA: "Llamada",
  PRESENCIAL: "Presencial",
  REFERIDO: "Referido",
};

export function formatCanalLabel(canal: string | null | undefined): string {
  if (!canal) return "Canal Directo";
  const key = canal.toUpperCase();
  return CANAL_LABELS[key] || canal.replace(/_/g, " ");
}

export function KanbanBoard({ prospectos, onStageUpdated }: KanbanBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AS";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() || "")
        .join("") || "AS"
    );
  };

  const getTemperatureBadge = (nivel: string | null) => {
    const n = (nivel || "MEDIO").toUpperCase();
    if (n.includes("ALTO") || n.includes("ALTA")) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
          Alta 🔥
        </span>
      );
    }
    if (n.includes("BAJO") || n.includes("BAJA")) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
          Baja
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
        Media
      </span>
    );
  };

  const getColumnTheme = (col: string) => {
    switch (col) {
      case "NUEVO":
        return {
          container: "bg-red-50/40 border-red-200/70",
          badge: "bg-red-100 text-[#C4121A] border border-red-200",
          dot: "bg-[#C4121A]",
        };
      case "CONTACTADO":
        return {
          container: "bg-blue-50/40 border-blue-200/70",
          badge: "bg-blue-100 text-blue-700 border border-blue-200",
          dot: "bg-blue-600",
        };
      case "EN SEGUIMIENTO":
        return {
          container: "bg-amber-50/40 border-amber-200/70",
          badge: "bg-amber-100 text-amber-800 border border-amber-200",
          dot: "bg-amber-500",
        };
      case "INTERESADO":
        return {
          container: "bg-purple-50/40 border-purple-200/70",
          badge: "bg-purple-100 text-purple-700 border border-purple-200",
          dot: "bg-purple-600",
        };
      case "PREMATRICULA":
        return {
          container: "bg-indigo-50/40 border-indigo-200/70",
          badge: "bg-indigo-100 text-indigo-700 border border-indigo-200",
          dot: "bg-indigo-600",
        };
      case "MATRICULADO":
        return {
          container: "bg-emerald-50/40 border-emerald-200/70",
          badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
          dot: "bg-emerald-600",
        };
      case "PERDIDO":
        return {
          container: "bg-slate-100/70 border-slate-200",
          badge: "bg-slate-200 text-slate-700 border border-slate-300",
          dot: "bg-slate-500",
        };
      default:
        return {
          container: "bg-slate-50 border-slate-200",
          badge: "bg-slate-200 text-slate-700",
          dot: "bg-slate-400",
        };
    }
  };

  const changeProspectoStage = (id: string, newStage: string) => {
    if (onStageUpdated) {
      onStageUpdated(id, newStage);
    }
    startTransition(async () => {
      await updateProspectoStatusAction(id, newStage);
    });
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, colKey: string) => {
    e.preventDefault();
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedId) return;
    const id = draggedId;
    setDraggedId(null);
    changeProspectoStage(id, newStage);
  };

  const grouped = KANBAN_STAGES.reduce<Record<string, EnrichedProspecto[]>>((acc, stage) => {
    acc[stage.key] = [];
    return acc;
  }, {});

  for (const p of prospectos) {
    const stageKey = normalizeProspectoStage(p.status);
    if (grouped[stageKey]) {
      grouped[stageKey].push(p);
    } else {
      grouped["NUEVO"].push(p);
    }
  }

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex gap-3.5 min-w-[1480px] items-stretch">
        {KANBAN_STAGES.map((stage, stageIdx) => {
          const theme = getColumnTheme(stage.key);
          const cards = grouped[stage.key] || [];
          const nextStage =
            stageIdx < KANBAN_STAGES.length - 2
              ? KANBAN_STAGES[stageIdx + 1]?.key
              : null;

          return (
            <div
              key={stage.key}
              onDragOver={e => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stage.key)}
              className={cn(
                "w-[260px] shrink-0 rounded-xl border p-3 flex flex-col min-h-[540px] transition-all",
                theme.container,
                dragOverCol === stage.key ? "ring-2 ring-[#C4121A] bg-red-50/60" : ""
              )}
            >
              {/* Cabecera de Columna */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", theme.dot)} />
                  <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">
                    {stage.label}
                  </h3>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", theme.badge)}>
                  {cards.length}
                </span>
              </div>

              {/* Lista de Tarjetas */}
              <div className="space-y-2.5 flex-1">
                {cards.map(p => {
                  const progObj = Array.isArray(p.programas) ? p.programas[0] : p.programas;
                  const advisorObj = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                  const advisorName = advisorObj?.display_name || advisorObj?.email || "Asesor Asignado";
                  const fullName = `${p.nombres || ""} ${p.apellidos || ""}`.trim() || p.codigo;

                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => handleDragStart(p.id)}
                      className={cn(
                        "bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs cursor-grab active:cursor-grabbing hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-2.5",
                        isPending && draggedId === p.id ? "opacity-60" : "",
                        draggedId === p.id ? "opacity-50 border-[#C4121A] border-dashed" : ""
                      )}
                    >
                      <div>
                        {/* Fila 1: Código + Temperatura */}
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {p.codigo}
                          </span>
                          {getTemperatureBadge(p.nivel_interes)}
                        </div>

                        {/* Fila 2: Nombre del Prospecto */}
                        <Link
                          href={`/crm/prospectos/${p.id}`}
                          className="font-bold text-xs text-slate-900 hover:text-[#C4121A] leading-snug block transition"
                        >
                          {fullName}
                        </Link>

                        {/* Fila 3: DNI y Teléfono */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-slate-500">
                          <span className="font-medium text-slate-600">
                            {p.tipo_documento || "DNI"}: {p.numero_documento || "S/D"}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {p.telefono || "-"}
                          </span>
                        </div>

                        {/* Fila 4: Programa de Interés */}
                        <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 flex items-start gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#C4121A] shrink-0 mt-0.5" />
                          <span className="text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2">
                            {progObj?.nombre || "Programa General"}
                          </span>
                        </div>

                        {/* Fila 5: Canal de Captación */}
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {formatCanalLabel(p.canal_captacion)}
                          </span>
                          {p.matricula_id && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                              <FileCheck className="w-3 h-3" />
                              Con matrícula
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pie de Tarjeta: Asesor con Avatar + Avance rápido de Etapa */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 text-[#C4121A] font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(advisorName)}
                          </div>
                          <span className="text-[10.5px] font-medium text-slate-600 truncate">
                            {advisorName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {nextStage && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                changeProspectoStage(p.id, nextStage);
                              }}
                              title={`Avanzar a ${nextStage}`}
                              className="p-1 rounded-md text-slate-500 hover:text-[#C4121A] hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link
                            href={`/crm/prospectos/${p.id}`}
                            title="Abrir ficha del prospecto"
                            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {cards.length === 0 && (
                  <div className="text-center text-[11px] font-medium text-slate-400 py-10 px-3 border-2 border-dashed border-slate-200/80 rounded-xl bg-white/50">
                    Arrastra un prospecto a <strong className="text-slate-500">{stage.shortLabel}</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
