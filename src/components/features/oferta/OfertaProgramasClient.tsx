"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Users,
  Clock,
  Award,
  Search,
  FileText,
  ArrowRight,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  LayoutGrid,
  MapPin,
  UserCheck,
} from "lucide-react";
import { ProgramaFormModalClient } from "@/app/(erp)/oferta/programas/ProgramaFormModalClient";
import { EdicionFormModalClient } from "@/app/(erp)/oferta/ediciones/EdicionFormModalClient";
import { PeriodoFormModalClient } from "@/app/(erp)/oferta/periodos/PeriodoFormModalClient";

interface OfertaProgramasClientProps {
  programas: any[];
  ediciones: any[];
  cursos: any[];
  planes: any[];
  periodos: any[];
  ciclos: any[];
  horarios?: any[];
  matriculasCountByEdicion: Record<string, number>;
  initialTab?: string;
}

export function OfertaProgramasClient({
  programas,
  ediciones,
  cursos,
  planes,
  periodos,
  ciclos,
  matriculasCountByEdicion,
  initialTab = "programas",
}: OfertaProgramasClientProps) {
  const [activeTab, setActiveTab] = useState<
    "programas" | "ediciones" | "periodos" | "cursos"
  >(
    initialTab === "ediciones" ||
      initialTab === "periodos" ||
      initialTab === "cursos"
      ? initialTab
      : "programas"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [tipoFilter, setTipoFilter] = useState("TODOS");

  // Enriquecer cada programa con métricas financieras, créditos, cursos y ediciones
  const enrichedProgramas = useMemo(() => {
    return programas.map(prog => {
      const progPlanes = planes.filter(p => p.programa_id === prog.id);
      const planIds = new Set(progPlanes.map(p => p.id));
      const progCursos = cursos.filter(c => c.plan_id && planIds.has(c.plan_id));
      const progEdiciones = ediciones.filter(e => e.programa_id === prog.id);
      const edicionesActivas = progEdiciones.filter(
        e => (e.status || "").toUpperCase() === "ACTIVO"
      );

      const edicionConPrecio =
        edicionesActivas.find(
          e =>
            (e.precio_pension !== null && e.precio_pension !== undefined) ||
            (e.precio_matricula !== null && e.precio_matricula !== undefined)
        ) ||
        progEdiciones.find(
          e =>
            (e.precio_pension !== null && e.precio_pension !== undefined) ||
            (e.precio_matricula !== null && e.precio_matricula !== undefined)
        );
      const edicionRef = edicionConPrecio || edicionesActivas[0] || progEdiciones[0] || null;
      const inversionMensual =
        edicionRef?.precio_pension !== null && edicionRef?.precio_pension !== undefined
          ? Number(edicionRef.precio_pension)
          : null;
      const inversionMatricula =
        edicionRef?.precio_matricula !== null && edicionRef?.precio_matricula !== undefined
          ? Number(edicionRef.precio_matricula)
          : null;

      const totalCreditos = progCursos.reduce(
        (acc, c) => acc + Number(c.creditos || 0),
        0
      );
      const totalHorasSemanales = progCursos.reduce(
        (acc, c) => acc + Number(c.horas_semanales || 0),
        0
      );
      const horasPedagogicas =
        totalHorasSemanales > 0
          ? totalHorasSemanales * 16
          : (Number(prog.duracion_cantidad) || 6) * 40;

      let vacantesTotales = 0;
      let vacantesOcupadas = 0;
      for (const ed of edicionesActivas) {
        vacantesTotales += Number(ed.vacantes || 30);
        vacantesOcupadas += matriculasCountByEdicion[ed.id] || 0;
      }

      const duracionTexto =
        prog.duracion_cantidad && prog.duracion_unidad
          ? `${prog.duracion_cantidad} ${prog.duracion_unidad}`
          : prog.total_ciclos
            ? `${prog.total_ciclos} Ciclos`
            : "6 Meses";

      const certificacionTipo =
        prog.tipo_programa === "CARRERA_TECNICA"
          ? "Título / Certificación Técnica"
          : prog.tipo_programa === "CURSO_CORTO"
            ? "Certificación Especializada"
            : "Diploma de Capacitación";

      return {
        ...prog,
        planesCount: progPlanes.length,
        cursosCount: progCursos.length,
        edicionesActivasCount: edicionesActivas.length,
        inversionMensual,
        inversionMatricula,
        totalCreditos: totalCreditos > 0 ? totalCreditos : (prog.total_ciclos || 2) * 18,
        horasPedagogicas,
        duracionTexto,
        certificacionTipo,
        vacantesTotales,
        vacantesOcupadas,
        modalidadPrincipal: edicionRef?.modalidad || "PRESENCIAL",
      };
    });
  }, [programas, planes, cursos, ediciones, matriculasCountByEdicion]);

  const filteredProgramas = useMemo(() => {
    return enrichedProgramas.filter(p => {
      if (statusFilter !== "TODOS" && (p.status || "").toUpperCase() !== statusFilter) {
        return false;
      }
      if (tipoFilter !== "TODOS" && (p.tipo_programa || "") !== tipoFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${p.codigo || ""} ${p.nombre || ""} ${p.descripcion || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedProgramas, statusFilter, tipoFilter, searchQuery]);

  const filteredEdiciones = useMemo(() => {
    return ediciones.filter(ed => {
      if (statusFilter !== "TODOS" && (ed.status || "").toUpperCase() !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const progName = ed.programas?.nombre || "";
        const hay = `${ed.codigo || ""} ${ed.nombre || ""} ${progName} ${ed.modalidad || ""} ${ed.turno || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ediciones, statusFilter, searchQuery]);

  const filteredCursos = useMemo(() => {
    return cursos.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${c.codigo || ""} ${c.nombre || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cursos, searchQuery]);

  const navTabs = [
    {
      id: "programas" as const,
      label: "Programas y Carreras",
      count: enrichedProgramas.length,
      icon: GraduationCap,
    },
    {
      id: "ediciones" as const,
      label: "Ediciones y Grupos Activos",
      count: ediciones.length,
      icon: Users,
    },
    {
      id: "periodos" as const,
      label: "Periodos Académicos",
      count: periodos.length,
      icon: Calendar,
    },
    {
      id: "cursos" as const,
      label: "Cursos Modulares",
      count: cursos.length,
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Barra de Pestañas + Buscador y Acciones */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Pestañas de Navegación */}
          <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition ${
                    isSelected
                      ? "bg-white text-[#C4121A] shadow-2xs border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-red-50 text-[#C4121A]"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/oferta/periodos"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-2xs text-xs font-bold transition"
            >
              <Calendar className="w-3.5 h-3.5 text-[#C4121A]" />
              <span>Ver Periodos</span>
            </Link>
            <PeriodoFormModalClient triggerText="+ Nuevo Periodo" variant="primary" />
            <Link
              href="/oferta/ficha"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-2xs text-xs font-bold transition"
            >
              <FileText className="w-3.5 h-3.5 text-[#C4121A]" />
              <span>Catálogo PDF</span>
            </Link>
            <EdicionFormModalClient
              triggerText="+ Nueva Edición"
              programas={programas.map(p => ({ id: p.id, nombre: p.nombre }))}
              planes={planes.map(pl => ({
                id: pl.id,
                nombre: pl.nombre,
                programa_id: pl.programa_id,
              }))}
              periodos={periodos}
              ciclos={ciclos}
            />
            <ProgramaFormModalClient triggerText="+ Nuevo Programa" />
          </div>
        </div>

        {/* Barra de Filtros Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar programa, código, edición o curso modular..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 text-slate-700 font-medium"
            >
              <option value="TODOS">Todos los tipos formativos</option>
              <option value="CARRERA_TECNICA">Carreras Técnicas</option>
              <option value="CURSO_CORTO">Cursos Cortos / Certificaciones</option>
              <option value="PROGRAMA_VARIABLE">Programas Variables</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 text-slate-700 font-medium"
            >
              <option value="TODOS">Estado: Todos</option>
              <option value="ACTIVO">Estado: Vigentes / Activos</option>
              <option value="INACTIVO">Estado: Inactivos / Archivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* VISTA 1: CATÁLOGO VISUAL DE PROGRAMAS EN TARJETAS (GRID) */}
      {activeTab === "programas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProgramas.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              No se encontraron programas académicos con los filtros seleccionados.
            </div>
          ) : (
            filteredProgramas.map(prog => {
              const isActivo = (prog.status || "").toUpperCase() === "ACTIVO";
              const isCarrera = prog.tipo_programa === "CARRERA_TECNICA";

              return (
                <div
                  key={prog.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between overflow-hidden group"
                >
                  {/* Cabecera de Tarjeta */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                        {prog.codigo}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCarrera
                              ? "bg-red-50 text-[#C4121A] border-red-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {isCarrera ? "Carrera Técnica" : "Certificación / Curso"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isActivo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {prog.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/oferta/programas/${prog.id}`}
                        className="text-base font-extrabold text-slate-900 group-hover:text-[#C4121A] transition-colors line-clamp-1"
                      >
                        {prog.nombre}
                      </Link>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                        {prog.descripcion ||
                          "Programa oficial de formación técnica y capacitación práctica con certificación institucional Brusben."}
                      </p>
                    </div>

                    {/* Atributos Académicos: Créditos, Duración, Horas y Certificación */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Duración / Ciclos
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-[#C4121A]" />
                          {prog.duracionTexto}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Créditos / Horas
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          {prog.totalCreditos} créd. · {prog.horasPedagogicas}h
                        </span>
                      </div>
                    </div>

                    {/* Tipo de Certificación */}
                    <div className="flex items-center justify-between text-[11px] bg-amber-50/60 border border-amber-200/70 rounded-lg px-3 py-2 text-amber-900">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {prog.certificacionTipo}
                      </span>
                      <span className="font-bold text-[10px] uppercase">
                        {prog.modalidadPrincipal}
                      </span>
                    </div>

                    {/* Bloque Financiero: Inversión Mensual y Matrícula */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Inversión Mensual
                        </span>
                        {prog.inversionMensual !== null ? (
                          <>
                            <span className="text-lg font-extrabold text-slate-900">
                              S/ {prog.inversionMensual.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">/ mes</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">
                            Sin configurar
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Derecho Matrícula
                        </span>
                        {prog.inversionMatricula !== null ? (
                          <span className="text-sm font-bold text-[#C4121A]">
                            S/ {prog.inversionMatricula.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">
                            Sin configurar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pie de Tarjeta con Acciones */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ProgramaFormModalClient
                        programa={prog}
                        triggerText="Editar"
                        variant="outline"
                      />
                      <Link
                        href={`/oferta/programas/${prog.id}/ficha`}
                        title="Descargar Ficha PDF del Programa"
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-[#C4121A] transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <Link
                      href={`/oferta/programas/${prog.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-[#C4121A] text-white text-xs font-bold transition"
                    >
                      <span>Malla y Vacantes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISTA 2: TABLA DE EDICIONES Y GRUPOS ACTIVOS CON CONTROL DE VACANTES */}
      {activeTab === "ediciones" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Código / Grupo</th>
                  <th className="py-3.5 px-3">Programa &amp; Sede</th>
                  <th className="py-3.5 px-3">Modalidad / Turno</th>
                  <th className="py-3.5 px-3">Inversión</th>
                  <th className="py-3.5 px-3">Cronograma</th>
                  <th className="py-3.5 px-3">Control de Vacantes / Aforo</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEdiciones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No se encontraron ediciones con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredEdiciones.map(ed => {
                    const ocupadas = matriculasCountByEdicion[ed.id] || 0;
                    const capTotal = Number(ed.vacantes || 30);
                    const libres = Math.max(0, capTotal - ocupadas);
                    const pct =
                      capTotal > 0
                        ? Math.min(100, Math.round((ocupadas / capTotal) * 100))
                        : 0;
                    const isCritico = pct >= 85;

                    return (
                      <tr key={ed.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/oferta/ediciones/${ed.id}`}
                            className="font-mono font-bold text-slate-900 hover:text-[#C4121A] block"
                          >
                            {ed.codigo}
                          </Link>
                          <span className="text-[11px] text-slate-500">
                            {ed.nombre || "Grupo Regular"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-800">
                            {ed.programas?.nombre || "Programa Académico"}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>Sede Central · Aula Técnica</span>
                          </p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {ed.modalidad || "PRESENCIAL"}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Turno: {ed.turno || "Semanal"}
                          </p>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-900">
                            Pensión:{" "}
                            {ed.precio_pension !== null && ed.precio_pension !== undefined
                              ? `S/ ${Number(ed.precio_pension).toFixed(2)}`
                              : "Sin configurar"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Matrícula:{" "}
                            {ed.precio_matricula !== null && ed.precio_matricula !== undefined
                              ? `S/ ${Number(ed.precio_matricula).toFixed(2)}`
                              : "Sin configurar"}
                            {ed.numero_pensiones ? ` (${ed.numero_pensiones} cuotas)` : ""}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 text-[11px] text-slate-600">
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Inicio: {ed.fecha_inicio || "Por definir"}</span>
                          </p>
                          <p className="text-slate-400 pl-4">
                            Fin: {ed.fecha_fin || "—"}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 min-w-[180px]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-800">
                              {ocupadas}/{capTotal} inscritos
                            </span>
                            <span
                              className={`font-bold ${
                                libres === 0
                                  ? "text-rose-700"
                                  : isCritico
                                    ? "text-amber-700"
                                    : "text-emerald-700"
                              }`}
                            >
                              {libres === 0 ? "Aforo lleno" : `${libres} libres`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                libres === 0
                                  ? "bg-rose-600"
                                  : isCritico
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <EdicionFormModalClient
                              edicion={ed}
                              programas={programas.map(p => ({ id: p.id, nombre: p.nombre }))}
                              planes={planes.map(pl => ({
                                id: pl.id,
                                nombre: pl.nombre,
                                programa_id: pl.programa_id,
                              }))}
                              periodos={periodos}
                              ciclos={ciclos}
                              triggerText="Editar"
                              variant="outline"
                            />
                            <Link
                              href={`/oferta/ediciones/${ed.id}`}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                            >
                              Detalle
                            </Link>
                            <Link
                              href={`/horarios?edicionId=${ed.id}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#C4121A] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Horarios</span>
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
        </div>
      )}

      {/* VISTA: PERIODOS ACADÉMICOS */}
      {activeTab === "periodos" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Periodos Académicos Oficiales</h3>
              <p className="text-xs text-slate-500">Base estructural del calendario y convocatorias institucionales.</p>
            </div>
            <PeriodoFormModalClient triggerText="+ Nuevo Periodo" variant="primary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-3">Denominación Oficial</th>
                  <th className="py-3 px-3">Fecha de Inicio</th>
                  <th className="py-3 px-3">Fecha de Fin</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No hay periodos académicos registrados.
                    </td>
                  </tr>
                ) : (
                  periodos.map(per => (
                    <tr key={per.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{per.codigo}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{per.nombre}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {per.fecha_inicio ? new Date(per.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE') : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {per.fecha_fin ? new Date(per.fecha_fin + 'T00:00:00').toLocaleDateString('es-PE') : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          per.status === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {per.status || 'ACTIVO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <PeriodoFormModalClient periodo={per} triggerText="Editar" variant="outline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: CURSOS MODULARES */}
      {activeTab === "cursos" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Código Curso</th>
                  <th className="py-3.5 px-4">Asignatura / Módulo Formativo</th>
                  <th className="py-3.5 px-3">Plan / Ciclo</th>
                  <th className="py-3.5 px-3">Créditos Académicos</th>
                  <th className="py-3.5 px-3">Horas Semanales</th>
                  <th className="py-3.5 px-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCursos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No hay cursos modulares que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredCursos.map(c => {
                    const plan = planes.find(p => p.id === c.plan_id);
                    const ciclo = ciclos.find(ci => ci.id === c.ciclo_id);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {c.codigo || "CRS-MOD"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {c.nombre}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {plan?.codigo || "Plan General"} ·{" "}
                          {ciclo ? `Ciclo ${ciclo.numero_orden}` : "Modular"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {c.creditos || 4} créditos
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {c.horas_semanales || 4} hrs / semana
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status || "ACTIVO"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
