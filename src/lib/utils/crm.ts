import { Database } from "@/types/database.types";

type ProspectoRow = Database["public"]["Tables"]["prospectos"]["Row"];

export interface EnrichedProspecto extends ProspectoRow {
  programas?:
    | { id?: string; nombre: string; codigo?: string }
    | { id?: string; nombre: string; codigo?: string }[]
    | null;
  ediciones?:
    | { id?: string; codigo: string }
    | { id?: string; codigo: string }[]
    | null;
  profiles?:
    | { id?: string; display_name: string | null; email?: string | null; photo_url?: string | null }
    | { id?: string; display_name: string | null; email?: string | null; photo_url?: string | null }[]
    | null;
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

export const normalizeProspectStage = normalizeProspectoStage;

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
