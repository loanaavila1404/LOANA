"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  KanbanBoard,
  EnrichedProspecto,
  KANBAN_STAGES,
  normalizeProspectoStage,
  formatCanalLabel,
} from "./KanbanBoard";
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
} from "lucide-react";

interface CRMWorkspaceClientProps {
  initialProspectos: EnrichedProspecto[];
  programas: { id: string; nombre: string; codigo?: string }[];
  planes: { id: string; nombre: string; programa_id: string | null }[];
  ediciones: { id: string; codigo: string; programa_id?: string | null }[];
  catalogos: { codigo: string; nombre: string; tipo_catalogo: string }[];
  asesores: AsesorOption[];
  currentUserId?: string;
  initialQuery?: string;
  initialStatus?: string;
}

export function CRMWorkspaceClient({
  initialProspectos,
  programas,
  planes,
  ediciones,
  catalogos,
  asesores,
  currentUserId,
  initialQuery = "",
  initialStatus = "TODOS",
}: CRMWorkspaceClientProps) {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [prospectos, setProspectos] = useState<EnrichedProspecto[]>(initialProspectos);
  const [isPending, startTransition] = useTransition();

  // Filtros en cascada en tiempo real
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState(
    initialStatus && initialStatus !== "NUEVO" ? initialStatus : "TODOS"
  );
  const [programaFilter, setProgramaFilter] = useState("TODOS");
  const [canalFilter, setCanalFilter] = useState("TODOS");
  const [asesorFilter, setAsesorFilter] = useState("TODOS");

  // Sincronizar si cambian los datos del servidor
  React.useEffect(() => {
    setProspectos(initialProspectos);
  }, [initialProspectos]);

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
      if (asesorFilter !== "TODOS") {
        if (asesorFilter === "SIN_ASIGNAR") {
          if (p.asesor_id) return false;
        } else if (p.asesor_id !== asesorFilter) {
          return false;
        }
      }

      return true;
    });
  }, [prospectos, searchQuery, statusFilter, programaFilter, canalFilter, asesorFilter]);

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
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "TODOS" ||
    programaFilter !== "TODOS" ||
    canalFilter !== "TODOS" ||
    asesorFilter !== "TODOS";

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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Alta 🔥
        </span>
      );
    }
    if (n.includes("BAJO") || n.includes("BAJA")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Baja
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Media
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
              triggerText="Nuevo prospecto"
            />
          </div>
        </div>

        {/* Filtros en Cascada en Tiempo Real */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-center">
          {/* 1. Buscador rápido */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI, código o tel..."
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
          </div>
        </div>
      </div>

      {/* VISTA 1: LISTADO AVANZADO DE PROSPECTOS */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Prospecto / Documento</th>
                  <th className="py-3.5 px-3">Contacto</th>
                  <th className="py-3.5 px-3">Programa &amp; Canal</th>
                  <th className="py-3.5 px-3">Temperatura</th>
                  <th className="py-3.5 px-3">Asesor Asignado</th>
                  <th className="py-3.5 px-3">Etapa Comercial</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProspectos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No se encontraron prospectos con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProspectos.map(p => {
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
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{p.telefono || "-"}</span>
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

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <ProspectoFormModalClient
                              prospecto={p}
                              programas={programas}
                              planes={planes}
                              ediciones={ediciones}
                              catalogos={catalogos}
                              asesores={asesores}
                              currentUserId={currentUserId}
                              triggerText="Editar"
                              variant="outline"
                            />
                            <Link
                              href={`/crm/prospectos/${p.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-white bg-[#C4121A] hover:bg-[#A30D14] transition"
                            >
                              <span>Gestionar</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
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
          onStageUpdated={handleStageUpdate}
        />
      )}
    </div>
  );
}
