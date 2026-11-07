"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { KanbanBoard } from "./KanbanBoard";
import { ProspectoNotesDrawer } from "./ProspectoNotesDrawer";
import {
  EnrichedProspecto,
  KANBAN_STAGES,
  normalizeProspectoStage,
  formatCanalLabel,
  buildWhatsAppUrl,
  CRMConversationItem,
  CRMTaskItem,
} from "@/lib/utils/crm";
import {
  ProspectoFormModalClient,
  AsesorOption,
} from "@/app/(erp)/crm/prospectos/ProspectoFormModalClient";
import { updateProspectoStatusAction } from "@/app/actions/crm/prospectos";
import {
  LayoutGrid,
  ListFilter,
  Search,
  Table as TableIcon,
  RotateCcw,
  Phone,
  Mail,
  ExternalLink,
  Calendar,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Pencil,
  CalendarClock,
  Trash2,
} from "lucide-react";
import { ProspectoDeleteModal } from "./ProspectoDeleteModal";

interface CRMWorkspaceClientProps {
  initialProspectos: EnrichedProspecto[];
  initialSeguimientos?: CRMConversationItem[];
  initialTareas?: CRMTaskItem[];
  programas: { id: string; nombre: string; codigo?: string }[];
  planes: { id: string; nombre: string; programa_id: string | null }[];
  ediciones: { id: string; codigo: string; programa_id?: string | null }[];
  catalogos: { codigo: string; nombre: string; tipo_catalogo: string }[];
  asesores: AsesorOption[];
  currentUserId?: string;
  isAdvisor?: boolean;
  initialQuery?: string;
  initialStatus?: string;
}

export function CRMWorkspaceClient({
  initialProspectos,
  initialSeguimientos = [],
  initialTareas = [],
  programas,
  planes,
  ediciones,
  catalogos,
  asesores,
  currentUserId,
  isAdvisor = false,
  initialQuery = "",
  initialStatus = "TODOS",
}: CRMWorkspaceClientProps) {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [prospectos, setProspectos] = useState<EnrichedProspecto[]>(initialProspectos);
  const [conversaciones, setConversaciones] = useState<CRMConversationItem[]>(initialSeguimientos);
  const [tareas, setTareas] = useState<CRMTaskItem[]>(initialTareas);
  const [drawerProspecto, setDrawerProspecto] = useState<EnrichedProspecto | null>(null);
  const [drawerMode, setDrawerMode] = useState<"NOTA" | "TAREA">("NOTA");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingProspecto, setEditingProspecto] = useState<EnrichedProspecto | null>(null);
  const [deletingProspecto, setDeletingProspecto] = useState<EnrichedProspecto | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cerrar menú desplegable al hacer clic fuera o presionar Escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-row-dropdown]")) {
        setOpenDropdownId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdownId]);

  // Filtros en cascada en tiempo real
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState(
    initialStatus && initialStatus !== "NUEVO" ? initialStatus : "TODOS"
  );
  const [programaFilter, setProgramaFilter] = useState("TODOS");
  const [canalFilter, setCanalFilter] = useState("TODOS");
  const [asesorFilter, setAsesorFilter] = useState("TODOS");
  const [dateRangeFilter, setDateRangeFilter] = useState("TODOS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sincronizar si cambian los datos del servidor
  React.useEffect(() => {
    setProspectos(initialProspectos);
  }, [initialProspectos]);

  React.useEffect(() => {
    if (initialSeguimientos) {
      setConversaciones(initialSeguimientos);
    }
  }, [initialSeguimientos]);

  React.useEffect(() => {
    if (initialTareas) {
      setTareas(initialTareas);
    }
  }, [initialTareas]);

  const handleOpenNotes = (p: EnrichedProspecto) => {
    setDrawerProspecto(p);
    setDrawerMode("NOTA");
    setIsDrawerOpen(true);
  };

  const handleOpenTask = (p: EnrichedProspecto) => {
    setDrawerProspecto(p);
    setDrawerMode("TAREA");
    setIsDrawerOpen(true);
  };

  const handleNoteAdded = (newNote: CRMConversationItem) => {
    setConversaciones(prev => [newNote, ...prev]);
  };

  const handleTaskAdded = (newTask: CRMTaskItem) => {
    setTareas(prev => [newTask, ...prev]);
  };

  const handleTaskCompleted = (completedTask: CRMTaskItem) => {
    setTareas(prev => prev.map(t => (t.id === completedTask.id ? completedTask : t)));
  };

  const canalesUnicos = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of catalogos.filter(cat => cat.tipo_catalogo === "CANAL")) {
      map.set(c.codigo.toUpperCase(), c.nombre);
    }
    for (const p of prospectos) {
      if (p.canal_captacion) {
        const code = p.canal_captacion.toUpperCase();
        if (!map.has(code)) {
          map.set(code, formatCanalLabel(p.canal_captacion));
        }
      }
    }
    if (map.size === 0) {
      map.set("WHATSAPP", "WhatsApp");
      map.set("FACEBOOK_ADS", "Facebook Ads");
      map.set("WEB", "Página Web");
      map.set("PRESENCIAL", "Presencial");
    }
    return Array.from(map.entries()).map(([codigo, nombre]) => ({ codigo, nombre }));
  }, [catalogos, prospectos]);

  const handlePresetDateChange = (preset: string) => {
    setDateRangeFilter(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === "TODOS") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "HOY") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7_DIAS") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(sevenDaysAgo.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "ESTE_MES") {
      const firstDayMonth = `${now.toISOString().slice(0, 7)}-01`;
      setStartDate(firstDayMonth);
      setEndDate(todayStr);
    }
  };

  const clearDates = () => {
    setDateRangeFilter("TODOS");
    setStartDate("");
    setEndDate("");
  };

  const filteredProspectos = useMemo(() => {
    return prospectos.filter(p => {
      // 1. Búsqueda por texto (nombre, apellidos, código, DNI, teléfono, email)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = [
          p.nombres,
          p.apellidos,
          p.codigo,
          p.numero_documento,
          p.telefono,
          p.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // 2. Filtro por Estado / Etapa del Embudo
      if (statusFilter !== "TODOS") {
        const normalized = normalizeProspectoStage(p.status);
        if (normalized !== statusFilter) return false;
      }

      // 3. Filtro por Programa Académico
      if (programaFilter !== "TODOS") {
        if (p.programa_id !== programaFilter) return false;
      }

      // 4. Filtro por Canal de Captación
      if (canalFilter !== "TODOS") {
        if ((p.canal_captacion || "").toUpperCase() !== canalFilter.toUpperCase()) return false;
      }

      // 5. Filtro por Asesor Asignado
      if (isAdvisor && currentUserId) {
        if (p.asesor_id && p.asesor_id !== currentUserId) return false;
      } else if (asesorFilter !== "TODOS") {
        if (asesorFilter === "SIN_ASIGNAR") {
          if (p.asesor_id) return false;
        } else if (p.asesor_id !== asesorFilter) {
          return false;
        }
      }

      // 6. Filtro por Rango de Fechas (Desde / Hasta inclusivo sobre created_at)
      if (startDate || endDate) {
        const createdAtStr = p.created_at || "";
        if (!createdAtStr) return false;
        const createdDatePart = createdAtStr.slice(0, 10);

        if (startDate && createdDatePart < startDate) return false;
        if (endDate && createdDatePart > endDate) return false;
      }

      return true;
    });
  }, [
    prospectos,
    searchQuery,
    statusFilter,
    programaFilter,
    canalFilter,
    asesorFilter,
    startDate,
    endDate,
    isAdvisor,
    currentUserId,
  ]);

  const handleStageUpdate = (id: string, newStage: string) => {
    setProspectos(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStage } : item))
    );
  };

  const handleInlineStageSelect = (id: string, newStage: string) => {
    handleStageUpdate(id, newStage);
    startTransition(async () => {
      await updateProspectoStatusAction(id, newStage);
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("TODOS");
    setProgramaFilter("TODOS");
    setCanalFilter("TODOS");
    setAsesorFilter("TODOS");
    setDateRangeFilter("TODOS");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "TODOS" ||
    programaFilter !== "TODOS" ||
    canalFilter !== "TODOS" ||
    asesorFilter !== "TODOS" ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    dateRangeFilter !== "TODOS";

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

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case "NUEVO":
        return "bg-red-50 text-[#C4121A] border-red-200";
      case "CONTACTADO":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "EN SEGUIMIENTO":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "INTERESADO":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "PREMATRICULA":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "MATRICULADO":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PERDIDO":
        return "bg-slate-100 text-slate-600 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTemperatureBadge = (nivel: string | null) => {
    const n = (nivel || "MEDIO").toUpperCase();
    if (n.includes("ALTO") || n.includes("ALTA")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Alta 🔥
        </span>
      );
    }
    if (n.includes("BAJO") || n.includes("BAJA")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          Baja ❄️
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Media ⚡
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Herramientas: Pestañas de Visualización + Filtros Avanzados en Cascada */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Pestañas: Listado de prospectos vs Embudo Kanban */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 self-start">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === "table"
                  ? "bg-white text-[#C4121A] shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Listado de prospectos ({filteredProspectos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === "kanban"
                  ? "bg-white text-[#C4121A] shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Embudo Kanban (7 etapas)</span>
            </button>
          </div>

          {/* Botón de Acción Primaria: Nuevo Prospecto con Selector de Asesor */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
            <ProspectoFormModalClient
              programas={programas}
              planes={planes}
              ediciones={ediciones}
              catalogos={catalogos}
              asesores={asesores}
              currentUserId={currentUserId}
              isAdvisor={isAdvisor}
              triggerText="Nuevo prospecto"
            />
          </div>
        </div>

        {/* Filtros en Cascada en Tiempo Real (incluyendo Rango de Fechas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-center">
          {/* 1. Buscador rápido */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar nombre, DNI, código..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800"
            />
          </div>

          {/* 2. Filtro por Etapa del Embudo */}
          <div className="flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-700 font-medium"
            >
              <option value="TODOS">Todas las Etapas ({prospectos.length})</option>
              {KANBAN_STAGES.map(st => (
                <option key={st.key} value={st.key}>
                  Etapa: {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filtro por Programa Académico */}
          <div>
            <select
              value={programaFilter}
              onChange={e => setProgramaFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-700 font-medium"
            >
              <option value="TODOS">Todos los Programas</option>
              {programas.map(prog => (
                <option key={prog.id} value={prog.id}>
                  {prog.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filtro por Canal de Captación */}
          <div>
            <select
              value={canalFilter}
              onChange={e => setCanalFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-700 font-medium"
            >
              <option value="TODOS">Todos los Canales</option>
              {canalesUnicos.map(c => (
                <option key={c.codigo} value={c.codigo}>
                  Canal: {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Filtro por Asesor Asignado */}
          <div>
            {isAdvisor ? (
              <div
                title="Visualizando exclusivamente tus prospectos asignados"
                className="w-full py-1.5 px-2.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Mis prospectos</span>
              </div>
            ) : (
              <select
                value={asesorFilter}
                onChange={e => setAsesorFilter(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-700 font-medium"
              >
                <option value="TODOS">Todos los Asesores</option>
                {asesores.map(a => (
                  <option key={a.id} value={a.id}>
                    Asesor: {a.display_name || a.email || "Activo"}
                  </option>
                ))}
                <option value="SIN_ASIGNAR">Sin asesor asignado</option>
              </select>
            )}
          </div>

          {/* 6. Atajo rápido de Rango de Fechas */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
            <select
              value={dateRangeFilter}
              onChange={e => handlePresetDateChange(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-700 font-medium"
            >
              <option value="TODOS">Fecha: Todos los rangos</option>
              <option value="HOY">Fecha: Hoy</option>
              <option value="7_DIAS">Fecha: Últimos 7 días</option>
              <option value="ESTE_MES">Fecha: Este mes</option>
              <option value="PERSONALIZADO">Rango personalizado (Desde / Hasta)</option>
            </select>
          </div>
        </div>

        {/* Selector de Rango de Fechas: Desde / Hasta */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-[#C4121A]" />
            Rango de registro:
          </span>

          <div className="flex items-center gap-1.5">
            <label htmlFor="crm-fecha-desde" className="text-xs font-semibold text-slate-500">
              Desde:
            </label>
            <input
              id="crm-fecha-desde"
              name="fecha_desde"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={e => {
                setStartDate(e.target.value);
                setDateRangeFilter(e.target.value || endDate ? "PERSONALIZADO" : "TODOS");
              }}
              className="py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="crm-fecha-hasta" className="text-xs font-semibold text-slate-500">
              Hasta:
            </label>
            <input
              id="crm-fecha-hasta"
              name="fecha_hasta"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => {
                setEndDate(e.target.value);
                setDateRangeFilter(startDate || e.target.value ? "PERSONALIZADO" : "TODOS");
              }}
              className="py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800"
            />
          </div>

          {(startDate || endDate || dateRangeFilter !== "TODOS") && (
            <button
              type="button"
              onClick={clearDates}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#C4121A] hover:text-[#9e0e15] bg-red-50/70 hover:bg-red-100/80 border border-red-200 rounded-md transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar fechas</span>
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: LISTADO AVANZADO DE PROSPECTOS */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 min-w-[200px]">Prospecto / Documento</th>
                  <th className="py-3.5 px-3 min-w-[170px]">Contacto</th>
                  <th className="py-3.5 px-3 min-w-[170px]">Programa &amp; Canal</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Temperatura</th>
                  <th className="py-3.5 px-3 min-w-[140px]">Asesor Asignado</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Registro</th>
                  <th className="py-3.5 px-3 min-w-[145px]">Etapa Comercial</th>
                  <th className="py-3.5 px-4 text-right min-w-[130px] whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProspectos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No se encontraron prospectos con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProspectos.map((p, index) => {
                    const progObj = Array.isArray(p.programas) ? p.programas[0] : p.programas;
                    const advisorObj = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                    const advisorFromList = asesores.find(a => a.id === p.asesor_id);
                    const advisorName =
                      advisorObj?.display_name ||
                      advisorFromList?.display_name ||
                      advisorObj?.email ||
                      advisorFromList?.email ||
                      "Asesor Institucional";
                    const normalizedStage = normalizeProspectoStage(p.status);
                    const fullName = `${p.nombres || ""} ${p.apellidos || ""}`.trim() || p.codigo;
                    const fechaRegistro = p.created_at
                      ? new Date(p.created_at).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "-";
                    const whatsAppUrl = buildWhatsAppUrl({
                      phone: p.telefono,
                      prospectoName: fullName,
                      programaName: progObj?.nombre,
                    });
                    const noteCount = conversaciones.filter(c => c.prospecto_id === p.id).length;
                    const pendingTasksCount = tareas.filter(
                      t => t.prospecto_id === p.id && t.status === "PENDIENTE"
                    ).length;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(fullName)}
                            </div>
                            <div>
                              <Link
                                href={`/crm/prospectos/${p.id}`}
                                className="font-bold text-slate-900 hover:text-[#C4121A] transition block"
                              >
                                {fullName}
                              </Link>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span className="font-mono text-slate-600">{p.codigo}</span>
                                <span>•</span>
                                <span>
                                  {p.tipo_documento || "DNI"}: {p.numero_documento || "No reg."}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{p.telefono || "-"}</span>
                            </div>
                            {whatsAppUrl && (
                              <a
                                href={whatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir chat de WhatsApp con mensaje precargado"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs shrink-0"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600 fill-emerald-600/20" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                          {p.email && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[160px]">{p.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">
                            {progObj?.nombre || "Programa General"}
                          </div>
                          <div className="mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {formatCanalLabel(p.canal_captacion)}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">{getTemperatureBadge(p.nivel_interes)}</td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 text-[#C4121A] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {getInitials(advisorName)}
                            </div>
                            <span className="font-medium text-slate-800">{advisorName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-medium">{fechaRegistro}</td>

                        <td className="py-3 px-3">
                          <select
                            value={normalizedStage}
                            disabled={isPending}
                            onChange={e => handleInlineStageSelect(p.id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${getStageBadgeClass(
                              normalizedStage
                            )}`}
                          >
                            {KANBAN_STAGES.map(st => (
                              <option key={st.key} value={st.key}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Botón Principal Destacado: Gestionar Ficha */}
                            <Link
                              href={`/crm/prospectos/${p.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#C4121A] hover:bg-[#A30D14] transition shadow-2xs whitespace-nowrap"
                              title="Gestionar ficha del prospecto"
                            >
                              <span>Gestionar</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* Menú Desplegable Moderno para Acciones Secundarias (...) */}
                            <div className="relative inline-block text-left" data-row-dropdown>
                              <button
                                type="button"
                                onClick={() => setOpenDropdownId(openDropdownId === p.id ? null : p.id)}
                                className={`relative p-1.5 rounded-lg border transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 ${
                                  openDropdownId === p.id
                                    ? "bg-slate-100 text-[#C4121A] border-slate-300"
                                    : "bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200"
                                }`}
                                aria-haspopup="true"
                                aria-expanded={openDropdownId === p.id}
                                title="Más opciones del prospecto"
                              >
                                <MoreVertical className="w-4 h-4" />
                                {(noteCount > 0 || pendingTasksCount > 0) && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C4121A] ring-2 ring-white" />
                                )}
                              </button>

                              {openDropdownId === p.id && (
                                <div
                                  className={`absolute right-0 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 divide-y divide-slate-100 text-left animate-in fade-in zoom-in-95 duration-100 ${
                                    index >= filteredProspectos.length - 2 && filteredProspectos.length > 2
                                      ? "bottom-full mb-1.5 origin-bottom-right"
                                      : "top-full mt-1.5 origin-top-right"
                                  }`}
                                >
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleOpenNotes(p);
                                      }}
                                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#C4121A] transition text-left"
                                    >
                                      <span className="flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Notas e historial</span>
                                      </span>
                                      {noteCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-[#C4121A]">
                                          {noteCount}
                                        </span>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        handleOpenTask(p);
                                      }}
                                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-700 transition text-left"
                                    >
                                      <span className="flex items-center gap-2">
                                        <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Programar tarea</span>
                                      </span>
                                      {pendingTasksCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          {pendingTasksCount}
                                        </span>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setEditingProspecto(p);
                                      }}
                                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#C4121A] transition text-left"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Editar prospecto</span>
                                    </button>
                                  </div>

                                  <div className="py-1">
                                    {whatsAppUrl && (
                                      <a
                                        href={whatsAppUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setOpenDropdownId(null)}
                                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition text-left"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Enviar WhatsApp</span>
                                      </a>
                                    )}
                                    {p.telefono && (
                                      <a
                                        href={`tel:${p.telefono}`}
                                        onClick={() => setOpenDropdownId(null)}
                                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left"
                                      >
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Llamar por teléfono</span>
                                      </a>
                                    )}
                                  </div>

                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setDeletingProspecto(p);
                                      }}
                                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition text-left"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Eliminar prospecto</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Mostrando <strong>{filteredProspectos.length}</strong> de{" "}
              <strong>{prospectos.length}</strong> prospectos registrados en CRM
            </span>
            <span className="text-[11px] text-slate-400">
              Cambia la etapa directamente desde la tabla o en el Embudo Kanban
            </span>
          </div>
        </div>
      ) : (
        /* VISTA 2: EMBUDO COMERCIAL KANBAN DE 7 ETAPAS */
        <KanbanBoard
          prospectos={filteredProspectos}
          conversaciones={conversaciones}
          onOpenNotes={handleOpenNotes}
          onStageUpdated={handleStageUpdate}
        />
      )}

      {/* Drawer lateral de bitácora, notas y tareas permanentes */}
      <ProspectoNotesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        prospecto={drawerProspecto}
        conversaciones={conversaciones}
        tareas={tareas}
        initialMode={drawerMode}
        onNoteAdded={handleNoteAdded}
        onTaskAdded={handleTaskAdded}
        onTaskCompleted={handleTaskCompleted}
        onStageChanged={handleStageUpdate}
      />

      {/* Modal controlado de edición rápida de prospecto */}
      {editingProspecto && (
        <ProspectoFormModalClient
          prospecto={editingProspecto}
          programas={programas}
          planes={planes}
          ediciones={ediciones}
          catalogos={catalogos}
          asesores={asesores}
          currentUserId={currentUserId}
          isAdvisor={isAdvisor}
          isOpen={Boolean(editingProspecto)}
          onClose={() => setEditingProspecto(null)}
        />
      )}

      {/* Modal de eliminación con doble confirmación */}
      {deletingProspecto && (
        <ProspectoDeleteModal
          isOpen={Boolean(deletingProspecto)}
          onClose={() => setDeletingProspecto(null)}
          prospectoId={deletingProspecto.id}
          prospectoCodigo={deletingProspecto.codigo}
          prospectoNombre={
            `${deletingProspecto.nombres || ''} ${deletingProspecto.apellidos || ''}`.trim() ||
            deletingProspecto.codigo
          }
          onDeleted={(deletedId) => {
            setProspectos((prev) => prev.filter((item) => item.id !== deletedId));
            setDeletingProspecto(null);
          }}
        />
      )}
    </div>
  );
}
