"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  History,
  Save,
  Layers,
  Users,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  BookOpen,
  Calendar,
  X,
  ArrowLeft,
  Flame,
  Edit3,
  MapPin,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfigurarProgramaButtonClient } from "@/app/(erp)/oferta/programas/[id]/ConfigurarProgramaButtonClient";
import {
  CicloFormModalClient,
  CursoFormModalClient,
  PlanFormModalClient,
} from "@/app/(erp)/oferta/programas/[id]/PlanesForms";
import { updateProgramaAction } from "@/app/actions/oferta/programas";

interface ProgramaDetailClientProps {
  programa: any;
  planes: any[];
  ediciones: any[];
  horarios?: any[];
  auditLogs: any[];
  matriculasCountByEdicion: Record<string, number>;
  periodoActivoNombre: string;
}

export function ProgramaDetailClient({
  programa,
  planes,
  ediciones,
  horarios,
  auditLogs,
  matriculasCountByEdicion,
  periodoActivoNombre,
}: ProgramaDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"curricular" | "ediciones">(
    "curricular"
  );
  const [showHistorialModal, setShowHistorialModal] = useState(false);

  // PASO 2: Modo Lectura por defecto en la Ficha Técnica del Programa
  const [isEditingFicha, setIsEditingFicha] = useState(false);

  // Precios iniciales tomados de la edición activa o de referencia del programa
  const edicionConPrecio =
    ediciones.find(
      e =>
        (e.precio_pension !== null && e.precio_pension !== undefined) ||
        (e.precio_matricula !== null && e.precio_matricula !== undefined)
    ) || ediciones[0] || null;

  const initialPrecioMatricula =
    edicionConPrecio?.precio_matricula !== null &&
    edicionConPrecio?.precio_matricula !== undefined
      ? String(edicionConPrecio.precio_matricula)
      : "";
  const initialPrecioPension =
    edicionConPrecio?.precio_pension !== null &&
    edicionConPrecio?.precio_pension !== undefined
      ? String(edicionConPrecio.precio_pension)
      : "";

  const [nombre, setNombre] = useState(programa.nombre || "");
  const [descripcion, setDescripcion] = useState(programa.descripcion || "");
  const [tipoPrograma, setTipoPrograma] = useState(
    programa.tipo_programa || "CARRERA_TECNICA"
  );
  const [duracionCantidad, setDuracionCantidad] = useState(
    programa.duracion_cantidad || 6
  );
  const [duracionUnidad, setDuracionUnidad] = useState(
    programa.duracion_unidad || "Meses"
  );
  const [totalCiclos, setTotalCiclos] = useState(programa.total_ciclos || 2);
  const [precioMatricula, setPrecioMatricula] = useState(initialPrecioMatricula);
  const [precioPension, setPrecioPension] = useState(initialPrecioPension);

  const [isSaving, startTransitionSave] = useTransition();
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const handleCancelEditFicha = () => {
    setNombre(programa.nombre || "");
    setDescripcion(programa.descripcion || "");
    setTipoPrograma(programa.tipo_programa || "CARRERA_TECNICA");
    setDuracionCantidad(programa.duracion_cantidad || 6);
    setDuracionUnidad(programa.duracion_unidad || "Meses");
    setTotalCiclos(programa.total_ciclos || 2);
    setPrecioMatricula(initialPrecioMatricula);
    setPrecioPension(initialPrecioPension);
    setIsEditingFicha(false);
    setSaveFeedback(null);
  };

  const handleSaveModifications = () => {
    setSaveFeedback(null);
    const fd = new FormData();
    fd.append("codigo", programa.codigo);
    fd.append("nombre", nombre);
    fd.append("tipo_programa", tipoPrograma);
    fd.append("descripcion", descripcion);
    fd.append("duracion_cantidad", String(duracionCantidad));
    fd.append("duracion_unidad", duracionUnidad);
    fd.append("total_ciclos", String(totalCiclos));
    fd.append("precio_matricula", precioMatricula);
    fd.append("precio_pension", precioPension);

    startTransitionSave(async () => {
      const res = await updateProgramaAction(programa.id, {}, fd);
      if (res?.error) {
        setSaveFeedback({ type: "err", text: res.error });
      } else {
        setIsEditingFicha(false);
        setSaveFeedback({
          type: "ok",
          text: "Ficha técnica y precios del programa guardados correctamente.",
        });
        router.refresh();
      }
    });
  };

  // Cálculo de ocupación y demanda del programa
  const edicionesActivas = ediciones.filter(
    e => (e.status || "").toUpperCase() === "ACTIVO"
  );
  let totalVacantes = 0;
  let totalOcupadas = 0;
  for (const ed of edicionesActivas) {
    totalVacantes += Number(ed.vacantes || 30);
    totalOcupadas += matriculasCountByEdicion[ed.id] || 0;
  }
  const pctDemanda =
    totalVacantes > 0
      ? Math.min(100, Math.round((totalOcupadas / totalVacantes) * 100))
      : 0;

  const planActivo =
    planes.find(p => (p.status || "").toUpperCase() === "ACTIVO") ||
    planes[0] ||
    null;

  const ciclosOrdenados = planActivo?.ciclos
    ? [...planActivo.ciclos].sort(
        (a: any, b: any) => (a.numero_orden || 0) - (b.numero_orden || 0)
      )
    : [];

  const todosCursosMalla: { id: string; nombre: string | null; codigo: string | null }[] = [];
  for (const c of ciclosOrdenados) {
    for (const cr of c.cursos || []) {
      todosCursosMalla.push({
        id: cr.id,
        nombre: cr.nombre,
        codigo: cr.codigo,
      });
    }
  }

  const totalCursosMalla = todosCursosMalla.length;
  const totalCreditosMalla = ciclosOrdenados.reduce(
    (acc: number, c: any) =>
      acc +
      (c.cursos || []).reduce(
        (s: number, cr: any) => s + Number(cr.creditos || 0),
        0
      ),
    0
  );

  // Mapa de docentes por curso a partir de horarios
  const docenteByCursoId: Record<string, string> = {};
  for (const h of horarios || []) {
    if (h.curso_id && h.docente) {
      docenteByCursoId[h.curso_id] = h.docente;
    }
  }

  return (
    <div className="space-y-6">
      {/* Navegación superior */}
      <div className="flex items-center justify-between">
        <Link
          href="/oferta/programas"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo de Oferta Académica</span>
        </Link>
      </div>

      {/* 1. CABECERA INSTITUCIONAL AVANZADA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#C4121A]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                {programa.codigo}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  (programa.status || "ACTIVO").toUpperCase() === "ACTIVO"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Estado: {programa.status || "ACTIVO"}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-[#C4121A]" />
                {pctDemanda >= 60
                  ? `Alta Demanda (${pctDemanda}% ocupación)`
                  : `Demanda Activa (${totalOcupadas} matriculados)`}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3.5 h-3.5" />
                Período Lectivo: {periodoActivoNombre}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
              {programa.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Award className="w-4 h-4 text-[#C4121A]" />
                Acreditación: Certificación Institucional Centro de Capacitaciones Brusben
              </span>
              <span>•</span>
              <span>
                Estructura:{" "}
                <strong>{ciclosOrdenados.length || programa.total_ciclos || 2} Ciclos</strong> ·{" "}
                <strong>{totalCursosMalla} Asignaturas</strong> ·{" "}
                <strong>{totalCreditosMalla} Créditos</strong>
              </span>
            </div>
          </div>

          {/* Botones de Acción Rápida */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/oferta/programas/${programa.id}/ficha`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition"
            >
              <FileText className="w-3.5 h-3.5 text-[#C4121A]" />
              <span>Descargar Malla Curricular (PDF)</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowHistorialModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Historial de cambios</span>
            </button>
          </div>
        </div>

        {saveFeedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
              saveFeedback.type === "ok"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span>{saveFeedback.text}</span>
            <button
              type="button"
              onClick={() => setSaveFeedback(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. PESTAÑAS INTERNAS DEL PROGRAMA (INCLUYE PESTAÑA DIRECTA DE HORARIOS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("curricular")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === "curricular"
                  ? "border-[#C4121A] text-[#C4121A] bg-white rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Detalles y Estructura Curricular</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {ciclosOrdenados.length} ciclos
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ediciones")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === "ediciones"
                  ? "border-[#C4121A] text-[#C4121A] bg-white rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Ediciones y Grupos Activos (Control de Aforo)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {ediciones.length} grupos
              </span>
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: DETALLES Y ESTRUCTURA CURRICULAR */}
        {activeTab === "curricular" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Ficha Técnica del Programa (Modo Lectura por defecto con botón Editar) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Ficha Técnica del Programa
                      </h3>
                      <span className="text-[10px] text-slate-500">
                        {isEditingFicha ? "Modo Edición Activo" : "Modo Solo Lectura"}
                      </span>
                    </div>

                    {!isEditingFicha ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingFicha(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#C4121A] text-white text-xs font-bold transition shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCancelEditFicha}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                      >
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nombre Oficial del Programa
                      </label>
                      <Input
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        disabled={!isEditingFicha}
                        className={`text-xs ${
                          isEditingFicha
                            ? "bg-white text-slate-900 border-slate-300"
                            : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Tipo de Certificación / Nivel
                      </label>
                      <select
                        value={tipoPrograma}
                        onChange={e => setTipoPrograma(e.target.value)}
                        disabled={!isEditingFicha}
                        className={`w-full border rounded-md px-3 py-2 text-xs ${
                          isEditingFicha
                            ? "bg-white text-slate-900 border-slate-300"
                            : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                        }`}
                      >
                        <option value="CARRERA_TECNICA">Carrera Técnica</option>
                        <option value="CURSO_CORTO">Curso Corto / Especialización</option>
                        <option value="PROGRAMA_VARIABLE">Programa Variable</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Duración
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={duracionCantidad}
                          onChange={e => setDuracionCantidad(Number(e.target.value))}
                          disabled={!isEditingFicha}
                          className={`text-xs ${
                            isEditingFicha
                              ? "bg-white text-slate-900 border-slate-300"
                              : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Unidad
                        </label>
                        <select
                          value={duracionUnidad}
                          onChange={e => setDuracionUnidad(e.target.value)}
                          disabled={!isEditingFicha}
                          className={`w-full border rounded-md px-2 py-2 text-xs ${
                            isEditingFicha
                              ? "bg-white text-slate-900 border-slate-300"
                              : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                          }`}
                        >
                          <option value="Meses">Meses</option>
                          <option value="Años">Años</option>
                          <option value="Semanas">Semanas</option>
                          <option value="Horas">Horas</option>
                          <option value="MESES" hidden>Meses</option>
                          <option value="ANIOS" hidden>Años</option>
                          <option value="SEMANAS" hidden>Semanas</option>
                          <option value="HORAS" hidden>Horas</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Ciclos
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={totalCiclos}
                          onChange={e => setTotalCiclos(Number(e.target.value))}
                          disabled={!isEditingFicha}
                          className={`text-xs ${
                            isEditingFicha
                              ? "bg-white text-slate-900 border-slate-300"
                              : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Campos de Precios en la Ficha Técnica */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Derecho Matrícula (S/)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={precioMatricula}
                          onChange={e => setPrecioMatricula(e.target.value)}
                          disabled={!isEditingFicha}
                          placeholder="Sin configurar"
                          className={`text-xs ${
                            isEditingFicha
                              ? "bg-white text-slate-900 border-slate-300"
                              : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Inversión Mensual (S/)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={precioPension}
                          onChange={e => setPrecioPension(e.target.value)}
                          disabled={!isEditingFicha}
                          placeholder="Sin configurar"
                          className={`text-xs ${
                            isEditingFicha
                              ? "bg-white text-slate-900 border-slate-300"
                              : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Sumilla y Perfil de Egreso
                      </label>
                      <textarea
                        rows={3}
                        value={descripcion}
                        onChange={e => setDescripcion(e.target.value)}
                        disabled={!isEditingFicha}
                        className={`w-full border rounded-md p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 ${
                          isEditingFicha
                            ? "bg-white text-slate-900 border-slate-300"
                            : "bg-slate-100/80 text-slate-700 border-slate-200 cursor-default"
                        }`}
                      />
                    </div>

                    {/* Botón inferior Guardar Modificaciones */}
                    {isEditingFicha && (
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEditFicha}
                          disabled={isSaving}
                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveModifications}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold shadow-xs transition disabled:opacity-60"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>
                            {isSaving ? "Guardando..." : "Guardar Modificaciones"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Malla Curricular por Ciclos Formativos */}
              <div className="lg:col-span-8 space-y-4">
                {!planActivo ? (
                  <ConfigurarProgramaButtonClient programaId={programa.id} />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#C4121A]">
                            {planActivo.codigo}
                          </span>
                          <h3 className="text-sm font-extrabold">
                            {planActivo.nombre || "Malla Curricular Vigente"}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Versión {planActivo.version || "2026.1"} · Vigencia desde{" "}
                          {planActivo.fecha_vigencia_desde || "2026-01-01"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <PlanFormModalClient
                          programaId={programa.id}
                          plan={planActivo}
                          trigger={
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                            >
                              Editar Plan
                            </button>
                          }
                        />
                        <CicloFormModalClient
                          planId={planActivo.id}
                          trigger={
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold transition"
                            >
                              + Agregar Ciclo Formativo
                            </button>
                          }
                        />
                      </div>
                    </div>

                    {ciclosOrdenados.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                        No hay ciclos configurados en esta malla curricular.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ciclosOrdenados.map((ciclo: any) => {
                          const cursosCiclo = ciclo.cursos || [];
                          const creditosCiclo = cursosCiclo.reduce(
                            (acc: number, c: any) => acc + Number(c.creditos || 0),
                            0
                          );

                          return (
                            <div
                              key={ciclo.id}
                              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                            >
                              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-7 h-7 rounded-lg bg-[#C4121A] text-white font-extrabold text-xs flex items-center justify-center">
                                    {ciclo.numero_orden || "I"}
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">
                                      Ciclo {ciclo.numero_orden}{" "}
                                      {ciclo.nombre ? `— ${ciclo.nombre}` : ""}
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                      {cursosCiclo.length} asignaturas · {creditosCiclo} créditos
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <CicloFormModalClient
                                    planId={planActivo.id}
                                    ciclo={ciclo}
                                    trigger={
                                      <button
                                        type="button"
                                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md bg-white"
                                      >
                                        Editar ciclo
                                      </button>
                                    }
                                  />
                                  {(() => {
                                    const numCiclo = ciclo.numero_orden || 1;
                                    const cursosPrevios = ciclosOrdenados
                                      .filter((c: any) => (c.numero_orden || 1) < numCiclo)
                                      .flatMap((c: any) => (c.cursos || []).map((cur: any) => ({
                                        id: cur.id,
                                        codigo: cur.codigo || '',
                                        nombre: cur.nombre || '',
                                        cicloNumero: c.numero_orden || 1,
                                      })));

                                    return (
                                      <CursoFormModalClient
                                        planId={planActivo.id}
                                        cicloId={ciclo.id}
                                        cicloNumero={numCiclo}
                                        cursosPrevios={cursosPrevios}
                                        trigger={
                                          <button
                                            type="button"
                                            className="text-xs font-bold text-white bg-slate-900 hover:bg-[#C4121A] px-2.5 py-1 rounded-md transition"
                                          >
                                            + Agregar curso
                                          </button>
                                        }
                                      />
                                    );
                                  })()}
                                </div>
                              </div>

                              {cursosCiclo.length === 0 ? (
                                <p className="p-5 text-center text-xs text-slate-400">
                                  Sin asignaturas registradas en este ciclo.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                                      <tr>
                                        <th className="py-2.5 px-4">Código</th>
                                        <th className="py-2.5 px-3">Asignatura</th>
                                        <th className="py-2.5 px-3">Créditos</th>
                                        <th className="py-2.5 px-3">
                                          Horas Teóricas / Prácticas
                                        </th>
                                        <th className="py-2.5 px-3">Docente Asociado</th>
                                        <th className="py-2.5 px-4 text-right">Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {cursosCiclo.map((curso: any) => {
                                        const hrsSem = Number(curso.horas_semanales || 4);
                                        const hrsTeo = Math.max(1, Math.floor(hrsSem * 0.4));
                                        const hrsPrac = Math.max(1, hrsSem - hrsTeo);
                                        const docente =
                                          docenteByCursoId[curso.id] ||
                                          "Plana Docente Brusben";

                                        const numCiclo = ciclo.numero_orden || 1;
                                        const cursosPrevios = ciclosOrdenados
                                          .filter((c: any) => (c.numero_orden || 1) < numCiclo)
                                          .flatMap((c: any) => (c.cursos || []).map((cur: any) => ({
                                            id: cur.id,
                                            codigo: cur.codigo || '',
                                            nombre: cur.nombre || '',
                                            cicloNumero: c.numero_orden || 1,
                                          })));

                                        return (
                                          <tr
                                            key={curso.id}
                                            className="hover:bg-slate-50/80"
                                          >
                                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                              {curso.codigo || "CRS-01"}
                                            </td>
                                            <td className="py-3 px-3 font-bold text-slate-900">
                                              {curso.nombre}
                                            </td>
                                            <td className="py-3 px-3 font-semibold text-slate-800">
                                              {curso.creditos || 4} créd.
                                            </td>
                                            <td className="py-3 px-3 text-slate-600">
                                              <span className="font-semibold text-slate-800">
                                                {hrsSem}h/sem
                                              </span>{" "}
                                              <span className="text-[11px] text-slate-500">
                                                ({hrsTeo}T / {hrsPrac}P)
                                              </span>
                                            </td>
                                            <td className="py-3 px-3">
                                              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                {docente}
                                              </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                              <CursoFormModalClient
                                                planId={planActivo.id}
                                                cicloId={ciclo.id}
                                                cicloNumero={numCiclo}
                                                cursosPrevios={cursosPrevios}
                                                curso={curso}
                                                trigger={
                                                  <button
                                                    type="button"
                                                    className="text-xs font-semibold text-[#C4121A] hover:underline"
                                                  >
                                                    Editar
                                                  </button>
                                                }
                                              />
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: EDICIONES Y GRUPOS ACTIVOS (CONTROL DE AFORO Y VACANTES) */}
        {activeTab === "ediciones" && (
          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Control de Vacantes y Aforo por Grupo / Turno
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Monitoreo en tiempo real de cupos ocupados vs disponibles en horarios Semanal, Intensivo y Dominical.
                </p>
              </div>
              <Link
                href="/oferta/ediciones"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-[#C4121A] text-white text-xs font-bold transition"
              >
                <span>Gestionar Todas las Ediciones</span>
              </Link>
            </div>

            {ediciones.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                Este programa aún no tiene ediciones o grupos abiertos.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ediciones.map((ed: any) => {
                  const ocupadas = matriculasCountByEdicion[ed.id] || 0;
                  const capacidad = Number(ed.vacantes || 30);
                  const libres = Math.max(0, capacidad - ocupadas);
                  const pct =
                    capacidad > 0
                      ? Math.min(100, Math.round((ocupadas / capacidad) * 100))
                      : 0;
                  const isLleno = libres === 0;
                  const isAlerta = pct >= 80 && !isLleno;

                  return (
                    <div
                      key={ed.id}
                      className="rounded-xl border border-slate-200 p-5 bg-white shadow-2xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                            {ed.codigo}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isLleno
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : isAlerta
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isLleno ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                Cupos Llenos (100%)
                              </>
                            ) : isAlerta ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                Últimas {libres} vacantes
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                {libres} vacantes libres
                              </>
                            )}
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900">
                          {ed.nombre || `Grupo ${ed.codigo}`}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                            Modalidad: {ed.modalidad || "PRESENCIAL"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-red-50 font-bold text-[#C4121A]">
                            Turno / Régimen: {ed.turno || "Semanal / Regular"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            Ocupación de Aforo: {ocupadas} / {capacidad} alumnos
                          </span>
                          <span className="font-extrabold text-slate-900">{pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isLleno
                                ? "bg-rose-600"
                                : isAlerta
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="text-slate-600">
                          Matrícula:{" "}
                          <strong className="text-slate-900">
                            {ed.precio_matricula !== null && ed.precio_matricula !== undefined
                              ? `S/ ${Number(ed.precio_matricula).toFixed(2)}`
                              : "Sin configurar"}
                          </strong>{" "}
                          · Pensión:{" "}
                          <strong className="text-slate-900">
                            {ed.precio_pension !== null && ed.precio_pension !== undefined
                              ? `S/ ${Number(ed.precio_pension).toFixed(2)}`
                              : "Sin configurar"}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/oferta/ediciones/${ed.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                          >
                            <span>Detalle Grupo</span>
                          </Link>
                          <Link
                            href={`/horarios?edicionId=${ed.id}`}
                            className="px-3 py-1 rounded bg-slate-900 hover:bg-[#C4121A] text-white font-bold transition inline-flex items-center gap-1.5 text-xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Horarios</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE HISTORIAL DE CAMBIOS / AUDITORÍA DEL PROGRAMA */}
      {showHistorialModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowHistorialModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Historial de Cambios Curriculares
                </h3>
                <p className="text-xs text-slate-500">
                  Programa: {programa.codigo} — {programa.nombre}
                </p>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {auditLogs.length === 0 ? (
                <div className="p-4 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Registro Inicial y Activación Curricular
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {programa.created_at
                        ? new Date(programa.created_at).toLocaleDateString("es-PE")
                        : "Vigente"}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    Programa académico verificado y activo en el catálogo oficial Brusben.
                  </p>
                </div>
              ) : (
                auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {log.action || "ACTUALIZACIÓN"} · {log.entity_type || "PROGRAMA"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("es-PE")
                          : "—"}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Registro de auditoría ID: {log.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowHistorialModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
