"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  MessageSquare,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Users,
  FileText,
  Plus,
  AlertCircle,
  Filter,
  Check,
  Send,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CRMConversationItem, CRMTaskItem } from "@/lib/utils/crm";
import {
  createSeguimientoAction,
  createTareaAction,
  completeTareaAction,
} from "@/app/actions/crm/actividades";

interface ProspectoBitacoraTimelineProps {
  prospectoId: string;
  currentStatus: string;
  seguimientos: CRMConversationItem[];
  tareas: CRMTaskItem[];
  isAdvisor?: boolean;
}

type TimelineFilter = "TODOS" | "NOTAS" | "TAREAS_PENDIENTES" | "TAREAS_COMPLETADAS";

export function ProspectoBitacoraTimeline({
  prospectoId,
  currentStatus,
  seguimientos: initialSeguimientos,
  tareas: initialTareas,
  isAdvisor = false,
}: ProspectoBitacoraTimelineProps) {
  const [seguimientos, setSeguimientos] = useState<CRMConversationItem[]>(initialSeguimientos);
  const [tareas, setTareas] = useState<CRMTaskItem[]>(initialTareas);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("TODOS");

  // Modales
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<CRMTaskItem | null>(null);
  const [completeOutcome, setCompleteOutcome] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar si cambian los datos de servidor
  React.useEffect(() => {
    setSeguimientos(initialSeguimientos);
  }, [initialSeguimientos]);

  React.useEffect(() => {
    setTareas(initialTareas);
  }, [initialTareas]);

  // Contadores
  const tareasPendientes = useMemo(
    () => tareas.filter(t => t.status === "PENDIENTE"),
    [tareas]
  );
  const tareasCompletadas = useMemo(
    () => tareas.filter(t => t.status === "COMPLETADA"),
    [tareas]
  );

  // Unificación de eventos cronológicos (Bitácora)
  const unifiedEvents = useMemo(() => {
    type EventItem = {
      id: string;
      kind: "NOTA" | "TAREA";
      date: Date;
      rawNote?: CRMConversationItem;
      rawTask?: CRMTaskItem;
    };

    const list: EventItem[] = [];

    // Agregar seguimientos
    for (const seg of seguimientos) {
      const d = seg.fecha_hora ? new Date(seg.fecha_hora) : new Date(0);
      list.push({
        id: `seg-${seg.id}`,
        kind: "NOTA",
        date: d,
        rawNote: seg,
      });
    }

    // Agregar tareas
    for (const tar of tareas) {
      // Usar fecha de cumplimiento si está completada, o fecha programada si está pendiente
      const dateStr = tar.fecha_realizada || tar.fecha_programada || tar.created_at;
      const d = dateStr ? new Date(dateStr) : new Date(0);
      list.push({
        id: `tar-${tar.id}`,
        kind: "TAREA",
        date: d,
        rawTask: tar,
      });
    }

    // Ordenar de más reciente a más antiguo
    list.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Filtrar según pestaña activa
    return list.filter(item => {
      if (activeFilter === "TODOS") return true;
      if (activeFilter === "NOTAS") return item.kind === "NOTA";
      if (activeFilter === "TAREAS_PENDIENTES") {
        return item.kind === "TAREA" && item.rawTask?.status === "PENDIENTE";
      }
      if (activeFilter === "TAREAS_COMPLETADAS") {
        return item.kind === "TAREA" && item.rawTask?.status === "COMPLETADA";
      }
      return true;
    });
  }, [seguimientos, tareas, activeFilter]);

  // Manejo de Registro de Nota
  const handleCreateNotaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.append("prospecto_id", prospectoId);

    startTransition(async () => {
      const res = await createSeguimientoAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.data) {
        setSeguimientos(prev => [res.data as unknown as CRMConversationItem, ...prev]);
        setIsNoteModalOpen(false);
      }
    });
  };

  // Manejo de Registro de Tarea
  const handleCreateTareaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.append("prospecto_id", prospectoId);

    startTransition(async () => {
      const res = await createTareaAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.data) {
        setTareas(prev => [res.data as unknown as CRMTaskItem, ...prev]);
        setIsTaskModalOpen(false);
      }
    });
  };

  // Manejo de Completar Tarea
  const [completeErrorMsg, setCompleteErrorMsg] = useState<string | null>(null);

  const handleConfirmCompleteTask = () => {
    if (!completingTask) return;
    if (!completeOutcome.trim()) {
      setCompleteErrorMsg("Por favor describe brevemente el resultado de la tarea realizada.");
      return;
    }
    setCompleteErrorMsg(null);

    const taskId = completingTask.id;
    const outcomeText = completeOutcome.trim();

    startTransition(async () => {
      const res = await completeTareaAction(taskId, prospectoId, outcomeText);
      if (res.error) {
        setCompleteErrorMsg(res.error);
      } else {
        // Actualizar tarea en memoria a COMPLETADA
        setTareas(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status: "COMPLETADA",
                  fecha_realizada: new Date().toISOString(),
                  resultado: outcomeText,
                }
              : t
          )
        );
        // Agregar nota automática de cumplimiento en la lista
        const newAuditNote: CRMConversationItem = {
          id: `comp-${Date.now()}`,
          prospecto_id: prospectoId,
          tipo_actividad: completingTask.tipo_tarea || "TAREA",
          resultado: `Tarea completada: ${outcomeText}`,
          nota: `Cumplimiento de tarea programada: "${completingTask.titulo || "Seguimiento"}".`,
          fecha_hora: new Date().toISOString(),
          profiles: completingTask.profiles,
        };
        setSeguimientos(prev => [newAuditNote, ...prev]);
        setCompletingTask(null);
        setCompleteOutcome("");
      }
    });
  };

  const getActivityIcon = (tipo: string | null) => {
    const t = (tipo || "").toUpperCase();
    if (t.includes("WHATSAPP")) return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
    if (t.includes("LLAMADA")) return <Phone className="w-3.5 h-3.5 text-blue-600" />;
    if (t.includes("CORREO")) return <Mail className="w-3.5 h-3.5 text-purple-600" />;
    if (t.includes("REUNION")) return <Users className="w-3.5 h-3.5 text-indigo-600" />;
    return <FileText className="w-3.5 h-3.5 text-amber-600" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
      {/* 1. CABECERA: TÍTULO Y BOTONES DE ACCIÓN PERMANENTES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C4121A]" />
            <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
              Bitácora y Cronograma Comercial
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial permanente de notas, conversaciones e hitos de tareas programadas.
          </p>
        </div>

        {/* Botones de acción directos: Registrar Nota y Programar Tarea */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTaskModalOpen(true)}
            className="text-xs font-semibold px-3 py-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
          >
            <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Programar Tarea</span>
          </Button>

          <Button
            type="button"
            onClick={() => setIsNoteModalOpen(true)}
            className="text-xs font-bold px-3 py-1.5 bg-[#C4121A] hover:bg-[#A30D14] text-white rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Registrar Nota</span>
          </Button>
        </div>
      </div>

      {/* 2. ALERTA DESTACADA: TAREAS PENDIENTES DE EJECUCIÓN (SI EXISTEN) */}
      {tareasPendientes.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              <span>Tareas Pendientes ({tareasPendientes.length})</span>
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
              Por cumplir
            </span>
          </div>

          <div className="space-y-2">
            {tareasPendientes.map(t => (
              <div
                key={t.id}
                className="bg-white border border-amber-200/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{t.titulo}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {t.tipo_tarea || "Tarea"}
                    </span>
                  </div>
                  {t.descripcion && (
                    <p className="text-xs text-slate-600 leading-snug">{t.descripcion}</p>
                  )}
                  <p className="text-[11px] text-slate-500 font-medium">
                    Programada para:{" "}
                    <strong>
                      {t.fecha_programada
                        ? new Date(t.fecha_programada).toLocaleString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Sin fecha"}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCompletingTask(t);
                    setCompleteOutcome("");
                    setCompleteErrorMsg(null);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Completar Tarea</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PESTAÑAS / FILTROS DE LA BITÁCORA */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveFilter("TODOS")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
            activeFilter === "TODOS"
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Todo el Historial ({seguimientos.length + tareas.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("NOTAS")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
            activeFilter === "NOTAS"
              ? "bg-[#C4121A] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Notas / Interacciones ({seguimientos.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("TAREAS_PENDIENTES")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
            activeFilter === "TAREAS_PENDIENTES"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tareas Pendientes ({tareasPendientes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("TAREAS_COMPLETADAS")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
            activeFilter === "TAREAS_COMPLETADAS"
              ? "bg-emerald-700 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tareas Cumplidas ({tareasCompletadas.length})
        </button>
      </div>

      {/* 4. HISTORIAL CRONOLÓGICO UNIFICADO (TIMELINE) */}
      <div className="pt-2">
        {unifiedEvents.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">Sin eventos registrados</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
              Usa los botones superiores para programar la primera llamada, enviar WhatsApp o registrar una nota interna de seguimiento.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4">
            {/* Línea vertical de la bitácora */}
            <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-slate-200" />

            {unifiedEvents.map(event => {
              if (event.kind === "NOTA" && event.rawNote) {
                const seg = event.rawNote;
                const advisorObj = Array.isArray(seg.profiles) ? seg.profiles[0] : seg.profiles;
                const advisorName = advisorObj?.display_name || advisorObj?.email || "Asesor";

                return (
                  <div key={event.id} className="relative group">
                    {/* Punto del timeline */}
                    <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white border-2 border-[#C4121A] flex items-center justify-center shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C4121A]" />
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs hover:border-slate-300 transition">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          {getActivityIcon(seg.tipo_actividad)}
                          <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                            {seg.tipo_actividad || "Nota"}
                          </span>
                          {seg.resultado && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                              {seg.resultado}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500 font-medium">
                          {seg.fecha_hora
                            ? new Date(seg.fecha_hora).toLocaleString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>

                      <p className="text-slate-800 font-normal leading-relaxed mt-2 whitespace-pre-line">
                        {seg.nota}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div>
                          {seg.estado_nuevo && seg.estado_nuevo !== seg.estado_anterior && (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <span>Etapa:</span>
                              <span>{seg.estado_nuevo}</span>
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-slate-600">
                          Registrado por: <strong>{advisorName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (event.kind === "TAREA" && event.rawTask) {
                const tar = event.rawTask;
                const isCompleted = tar.status === "COMPLETADA";
                const advisorObj = Array.isArray(tar.profiles) ? tar.profiles[0] : tar.profiles;
                const advisorName = advisorObj?.display_name || advisorObj?.email || "Asesor";

                return (
                  <div key={event.id} className="relative group">
                    {/* Punto del timeline: Verde si completada, Naranja si pendiente */}
                    <div
                      className={`absolute -left-6 top-2 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center shadow-xs ${
                        isCompleted ? "border-emerald-600" : "border-amber-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>

                    <div
                      className={`rounded-xl p-3.5 text-xs border transition ${
                        isCompleted
                          ? "bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300"
                          : "bg-amber-50/40 border-amber-200/80 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">
                            {isCompleted ? "Tarea Cumplida" : "Tarea Programada"} • {tar.tipo_tarea || "Seguimiento"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {tar.status}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-500 font-medium">
                          {isCompleted && tar.fecha_realizada
                            ? `Realizada: ${new Date(tar.fecha_realizada).toLocaleString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : tar.fecha_programada
                            ? `Para: ${new Date(tar.fecha_programada).toLocaleString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "-"}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        <h4 className="font-bold text-slate-900">{tar.titulo}</h4>
                        {tar.descripcion && (
                          <p className="text-slate-700 leading-snug whitespace-pre-line">
                            {tar.descripcion}
                          </p>
                        )}
                        {isCompleted && tar.resultado && (
                          <div className="mt-2 p-2 bg-white/80 rounded-lg border border-emerald-200/80 text-emerald-900 text-xs">
                            <strong>Resultado registrado:</strong> {tar.resultado}
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>
                          Responsable: <strong>{advisorName}</strong>
                        </span>

                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompletingTask(tar);
                              setCompleteOutcome("");
                            }}
                            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300 transition shadow-2xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Marcar como Cumplida</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL: REGISTRAR NOTA / INTERACCIÓN */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Registrar Nota / Conversación de Seguimiento"
      >
        <form onSubmit={handleCreateNotaSubmit} className="space-y-4 pt-3">
          {errorMsg && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Canal / Actividad *</label>
              <select
                name="tipo_actividad"
                required
                defaultValue="WHATSAPP"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4121A] bg-white font-medium"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="LLAMADA">Llamada Telefónica</option>
                <option value="NOTA_INTERNA">Nota Interna</option>
                <option value="CORREO">Correo Electrónico</option>
                <option value="REUNION">Reunión Presencial</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Resultado Rápido</label>
              <select
                name="resultado"
                defaultValue="Interesado"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4121A] bg-white font-medium"
              >
                <option value="Interesado / Positivo">Interesado / Positivo</option>
                <option value="Información enviada">Información enviada</option>
                <option value="Volver a llamar">Volver a llamar</option>
                <option value="No contestó">No contestó / Ocupado</option>
                <option value="Prematrícula solicitada">Prematrícula solicitada</option>
                <option value="No interesado">No interesado</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Contenido de la conversación / nota *
            </label>
            <textarea
              name="nota"
              required
              rows={3}
              placeholder="Detalla lo conversado, dudas sobre horarios, pagos o compromisos acordados..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4121A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Actualizar Etapa (Opcional)</label>
              <select
                name="estado_nuevo"
                defaultValue={currentStatus}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4121A] bg-white font-medium"
              >
                <option value="NUEVO">NUEVO</option>
                <option value="CONTACTADO">CONTACTADO</option>
                <option value="EN SEGUIMIENTO">EN SEGUIMIENTO</option>
                <option value="INTERESADO">INTERESADO</option>
                <option value="PREMATRICULA">PREMATRICULA</option>
                <option value="MATRICULADO">MATRICULADO</option>
                <option value="PERDIDO">PERDIDO</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Próximo Contacto</label>
              <Input type="datetime-local" name="proximo_seguimiento" />
            </div>
          </div>

          <div className="flex justify-end pt-3 space-x-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNoteModalOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#C4121A] hover:bg-[#A30D14] text-white"
            >
              {isPending ? "Guardando..." : "Guardar Nota"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL: PROGRAMAR TAREA */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Programar Tarea de Seguimiento Comercial"
      >
        <form onSubmit={handleCreateTareaSubmit} className="space-y-4 pt-3">
          {errorMsg && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Título de la Tarea *</label>
            <Input
              name="titulo"
              required
              placeholder="Ej: Llamar para confirmar asistencia a inducción"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tipo de Tarea</label>
              <select
                name="tipo_tarea"
                required
                defaultValue="LLAMADA"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4121A] bg-white font-medium"
              >
                <option value="LLAMADA">Llamada Telefónica</option>
                <option value="WHATSAPP">Mensaje WhatsApp</option>
                <option value="CORREO">Enviar Correo / Brochure</option>
                <option value="REUNION">Entrevista / Reunión</option>
                <option value="SEGUIMIENTO">Seguimiento General</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha y Hora Programada *</label>
              <Input type="datetime-local" name="fecha_programada" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Descripción / Instrucciones</label>
            <textarea
              name="descripcion"
              rows={2}
              placeholder="Objetivo del contacto o detalles importantes para el asesor..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4121A]"
            />
          </div>

          <div className="flex justify-end pt-3 space-x-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsTaskModalOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPending ? "Programando..." : "Programar Tarea"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. MODAL: COMPLETAR TAREA */}
      <Modal
        isOpen={Boolean(completingTask)}
        onClose={() => setCompletingTask(null)}
        title="Registrar Cumplimiento de Tarea"
      >
        <div className="space-y-4 pt-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-800">{completingTask?.titulo}</p>
            <p className="text-slate-500">
              Tipo: {completingTask?.tipo_tarea} • Programada para:{" "}
              {completingTask?.fecha_programada
                ? new Date(completingTask.fecha_programada).toLocaleString("es-PE")
                : "-"}
            </p>
          </div>

          {completeErrorMsg && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{completeErrorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Atajos de resultado rápido:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Llamada exitosa: Interesado",
                "Información enviada por WhatsApp",
                "Volver a llamar mañana",
                "No contestó, se dejó mensaje",
                "Compromiso de pago registrado",
                "No interesado",
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCompleteOutcome(opt)}
                  className={`text-[10.5px] px-2 py-1 rounded-md border transition font-medium ${
                    completeOutcome === opt
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Detalle del resultado obtenido *
            </label>
            <textarea
              rows={3}
              value={completeOutcome}
              onChange={e => setCompleteOutcome(e.target.value)}
              placeholder="Escribe el resultado de la gestión comercial realizada..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end pt-3 space-x-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCompletingTask(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCompleteTask}
              disabled={isPending || !completeOutcome.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isPending ? "Guardando..." : "Confirmar Cumplimiento"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
