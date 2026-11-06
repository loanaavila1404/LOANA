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

/**
 * Limpia y normaliza un número de teléfono para enlaces internacionales (Perú por defecto +51)
 */
export function cleanPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  // Si son 9 dígitos y empieza en 9 (celular Perú)
  if (digits.length === 9 && digits.startsWith("9")) {
    return `51${digits}`;
  }
  // Si son 11 dígitos y empieza con 51
  if (digits.length === 11 && digits.startsWith("51")) {
    return digits;
  }
  if (digits.length >= 8) {
    return digits;
  }
  return null;
}

/**
 * Genera el enlace oficial a WhatsApp con mensaje precargado y profesional
 */
export function buildWhatsAppUrl(options: {
  phone: string | null | undefined;
  prospectoName?: string | null;
  programaName?: string | null;
}): string | null {
  const cleanPhone = cleanPhoneNumber(options.phone);
  if (!cleanPhone) return null;

  const firstName = options.prospectoName?.trim() ? ` ${options.prospectoName.trim().split(" ")[0]}` : "";
  const progPart = options.programaName?.trim()
    ? ` en nuestro programa de *${options.programaName.trim()}*`
    : " en nuestros programas de formación continua";

  const message = `¡Hola${firstName}! 👋 Te escribimos del *Centro de Capacitaciones Brusben*. Nos comunicamos con mucho gusto respecto a tu interés${progPart}. ¿Tienes disponibilidad para conversar sobre el plan de estudios, horarios y facilidades de matrícula?`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface CRMConversationItem {
  id: string;
  prospecto_id: string | null;
  tipo_actividad: string | null;
  fecha_hora: string | null;
  resultado: string | null;
  nota: string | null;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  proximo_seguimiento?: string | null;
  asesor_id?: string | null;
  profiles?:
    | { id?: string; display_name: string | null; email?: string | null }
    | { id?: string; display_name: string | null; email?: string | null }[]
    | null;
}

