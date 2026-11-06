"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  EnrichedProspecto,
  CRMConversationItem,
  KANBAN_STAGES,
  normalizeProspectoStage,
  buildWhatsAppUrl,
} from "@/lib/utils/crm";
import { createSeguimientoAction } from "@/app/actions/crm/actividades";

interface ProspectoNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prospecto: EnrichedProspecto | null;
  conversaciones: CRMConversationItem[];
  onNoteAdded: (newNote: CRMConversationItem) => void;
  onStageChanged?: (prospectoId: string, newStage: string) => void;
  currentUserName?: string;
}

const ACTIVITY_TYPES = [
  { key: "WHATSAPP", label: "WhatsApp", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "LLAMADA", label: "Llamada", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "NOTA_INTERNA", label: "Nota Interna", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "CORREO", label: "Correo", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "REUNION", label: "Reunión", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
] as const;

const QUICK_OUTCOMES = [
  "Interesado / Positivo",
  "Información Enviada",
  "Volver a Llamar",
  "No Contestó / Ocupado",
  "Esperando Pago / Matrícula",
  "No Interesado",
];

export function ProspectoNotesDrawer({
  isOpen,
  onClose,
  prospecto,
  conversaciones,
  onNoteAdded,
  onStageChanged,
  currentUserName,
}: ProspectoNotesDrawerProps) {
  const [tipoActividad, setTipoActividad] = useState<string>("WHATSAPP");
  const [resultado, setResultado] = useState<string>("Interesado / Positivo");
  const [nota, setNota] = useState<string>("");
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Escuchar tecla Esc para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !prospecto) return null;

  const progObj = Array.isArray(prospecto.programas) ? prospecto.programas[0] : prospecto.programas;
  const fullName = `${prospecto.nombres || ""} ${prospecto.apellidos || ""}`.trim() || prospecto.codigo;
  const currentStage = normalizeProspectoStage(prospecto.status);

  const whatsAppUrl = buildWhatsAppUrl({
    phone: prospecto.telefono,
    prospectoName: fullName,
    programaName: progObj?.nombre,
  });

  // Filtrar notas que pertenecen a este prospecto
  const prospectoNotes = conversaciones.filter(c => c.prospecto_id === prospecto.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nota.trim()) {
      setErrorMsg("Por favor, ingresa el contenido de la nota o conversación.");
      return;
    }
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("prospecto_id", prospecto.id);
    formData.append("tipo_actividad", tipoActividad);
    formData.append("resultado", resultado);
    formData.append("nota", nota.trim());
    if (nuevoEstado) {
      formData.append("estado_nuevo", nuevoEstado);
    }

    startTransition(async () => {
      const res = await createSeguimientoAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.data) {
        onNoteAdded(res.data as unknown as CRMConversationItem);
        if (nuevoEstado && onStageChanged) {
          onStageChanged(prospecto.id, nuevoEstado);
        }
        setNota("");
        setNuevoEstado("");
      }
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "AS";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() || "")
        .join("") || "AS"
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Fondo difuminado con clic para cerrar */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-all ease-in-out duration-300">
          
          {/* CABECERA DEL PROSPECTO */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 text-[#C4121A] font-bold text-sm flex items-center justify-center shrink-0">
                  {getInitials(fullName)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base leading-snug">
                    {fullName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-slate-600 font-semibold">{prospecto.codigo}</span>
                    <span>•</span>
                    <span>{prospecto.tipo_documento || "DNI"}: {prospecto.numero_documento || "S/D"}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fila Informativa de Programa y Acciones Rápidas */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-[#C4121A] shrink-0" />
                <span className="truncate max-w-[200px]" title={progObj?.nombre}>
                  {progObj?.nombre || "Programa General"}
                </span>
              </div>

              {/* Botones Rápidos de Contacto: WhatsApp & Llamada */}
              <div className="flex items-center gap-1.5">
                {whatsAppUrl ? (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                    title="Abrir chat de WhatsApp con mensaje precargado"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                ) : null}

                {prospecto.telefono && (
                  <a
                    href={`tel:${prospecto.telefono}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
                    title={`Llamar a ${prospecto.telefono}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{prospecto.telefono}</span>
                  </a>
                )}

                <Link
                  href={`/crm/prospectos/${prospecto.id}`}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
                  title="Ver expediente comercial completo"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* CONTENIDO SCROLLABLE: FORMULARIO + TIMELINE */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* FORMULARIO DE REGISTRO RÁPIDO DE INTERACCIÓN */}
            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#C4121A]" />
                  <span>Nueva Interacción / Nota Comercial</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {currentUserName ? `Asesor: ${currentUserName}` : "Registro inmediato"}
                </span>
              </div>

              {errorMsg && (
                <div className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Selector de Canal / Tipo */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Canal de Interacción
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_TYPES.map(act => (
                    <button
                      key={act.key}
                      type="button"
                      onClick={() => setTipoActividad(act.key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border transition ${
                        tipoActividad === act.key
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Resultado Rápido */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Resultado de la Gestión
                </label>
                <select
                  value={resultado}
                  onChange={e => setResultado(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800"
                >
                  {QUICK_OUTCOMES.map(out => (
                    <option key={out} value={out}>
                      {out}
                    </option>
                  ))}
                </select>
              </div>

              {/* Textarea de la Nota */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Detalle / Acuerdos de la Conversación *
                </label>
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  rows={3}
                  placeholder="Ej: Se le brindó información del curso y horarios. Solicita facilidades en 2 cuotas. Volver a llamar el viernes por la tarde..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Opcional: Avanzar Etapa del Prospecto */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Avanzar etapa (opcional):</span>
                </div>
                <select
                  value={nuevoEstado}
                  onChange={e => setNuevoEstado(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none text-slate-700 font-semibold"
                >
                  <option value="">Mantener etapa ({currentStage})</option>
                  {KANBAN_STAGES.map(st => (
                    <option key={st.key} value={st.key}>
                      → {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending || !nota.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#C4121A] hover:bg-[#A30D14] disabled:opacity-50 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPending ? "Guardando..." : "Registrar Nota"}</span>
                </button>
              </div>
            </form>

            {/* BANDEJA DE CONVERSACIONES E HISTORIAL EN VIVO */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Historial de Conversaciones ({prospectoNotes.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Orden cronológico</span>
              </div>

              {prospectoNotes.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <Sparkles className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Aún no hay interacciones registradas</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Utiliza el formulario superior para registrar la primera llamada, chat de WhatsApp o nota interna de este prospecto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {prospectoNotes.map(item => {
                    const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                    const advisorName = prof?.display_name || prof?.email || "Asesor Comercial";
                    const formattedDate = item.fecha_hora
                      ? new Date(item.fecha_hora).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Fecha no reg.";

                    const channelBadge =
                      ACTIVITY_TYPES.find(a => a.key === item.tipo_actividad)?.color ||
                      "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <div key={item.id} className="relative pl-7 group">
                        {/* Punto de la línea de tiempo */}
                        <div className="absolute left-2 top-2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#C4121A] group-hover:scale-110 transition" />

                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${channelBadge}`}
                            >
                              {item.tipo_actividad || "GESTIÓN"}
                            </span>
                            <span className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formattedDate}
                            </span>
                          </div>

                          {item.resultado && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{item.resultado}</span>
                            </div>
                          )}

                          <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                            {item.nota || "Sin observaciones adicionales."}
                          </p>

                          {item.estado_nuevo && item.estado_nuevo !== item.estado_anterior && (
                            <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block border border-indigo-200">
                              Avance de etapa: {item.estado_anterior || "NUEVO"} → {item.estado_nuevo}
                            </div>
                          )}

                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>Por: <strong>{advisorName}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* PIE DEL PANEL */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition"
            >
              Cerrar Panel
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}
