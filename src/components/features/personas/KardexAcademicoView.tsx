'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  GraduationCap,
  Layers,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  FileText
} from 'lucide-react';
import { ResumenKardex, CicloKardexItem, CursoKardexItem } from '@/lib/academic/arrastres';
import { Button } from '@/components/ui/Button';

interface KardexAcademicoViewProps {
  persona: any;
  estudiante: any;
  programaNombre: string;
  kardex: ResumenKardex;
  initials: string;
}

export function KardexAcademicoView({
  persona,
  estudiante,
  programaNombre,
  kardex,
  initials,
}: KardexAcademicoViewProps) {
  const [selectedCiclo, setSelectedCiclo] = useState<number | 'TODOS'>('TODOS');

  const nombreCompleto = `${persona.nombres || ''} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim();
  const codigoEstudiantil = estudiante?.codigo_estudiante || 'EST-2026-000';
  const dniEstudiante = persona.numero_documento || '00000000';

  const handlePrintKardex = () => {
    window.print();
  };

  const getNotaColor = (nota: number | null) => {
    if (nota === null) return 'text-slate-400';
    if (nota >= 14) return 'text-emerald-700 font-bold';
    if (nota >= 13) return 'text-blue-700 font-bold';
    return 'text-rose-700 font-black bg-rose-50 px-1.5 py-0.5 rounded';
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. BANNER INSTITUCIONAL DE CONDICIÓN ACADÉMICA Y BLOQUEOS      */}
      {/* ============================================================== */}
      {kardex.condicion === 'BLOQUEADO_TRES_ARRASTRES' ? (
        <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm print:border-rose-400">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white tracking-wider">
                    REGLA DE BLOQUEO ACTIVA
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-800">
                    {kardex.totalArrastresActivos} Cursos Desaprobados
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-rose-950">
                  MATRÍCULA BLOQUEADA: Requiere Nivelación en Ciclo de Verano
                </h2>
                <p className="text-xs text-rose-800 max-w-3xl leading-relaxed">
                  Conforme a la normativa institucional del Centro de Capacitaciones Brusben, el estudiante que acumule <strong>3 o más cursos desaprobados</strong> queda <strong>automáticamente inhabilitado para matricularse en el siguiente ciclo regular</strong>. Debe regularizar estas asignaturas obligatoriamente en el Ciclo de Verano / Nivelación previo a su promoción.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto print:hidden">
              <Link
                href={`/matriculas/nueva?estudiante_id=${estudiante?.id}&tipo=VERANO`}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Derivar a Ciclo de Verano</span>
              </Link>
            </div>
          </div>
        </div>
      ) : kardex.condicion === 'APTO_CON_ARRASTRES' ? (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white tracking-wider">
                    APTO CONDICIONAL
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    {kardex.totalArrastresActivos} {kardex.totalArrastresActivos === 1 ? 'Arrastre' : 'Arrastres'}
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-amber-950">
                  Apto para Matrícula en Ciclo Siguiente con Deuda Académica
                </h2>
                <p className="text-xs text-amber-800 max-w-3xl leading-relaxed">
                  El estudiante cuenta con 1 o 2 cursos pendientes. Se le permite matricularse en el ciclo regular siguiente llevando el arrastre en paralelo, o subsanarlo de manera intensiva en el Ciclo de Verano.
                </p>
              </div>
            </div>

            <div className="shrink-0 print:hidden">
              <Link
                href="/matriculas/ratificacion"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Gestionar Ratificación</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white tracking-wider">
                    ESTUDIANTE INVICTO
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800">
                    0 Arrastres Pendientes
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-emerald-950">
                  Situación Académica Regular: Apto para Promoción Directa
                </h2>
                <p className="text-xs text-emerald-800 max-w-3xl leading-relaxed">
                  Todas las asignaturas cursadas han sido aprobadas satisfactoriamente (calificaciones $\ge 13$). El estudiante cumple con la totalidad de prerrequisitos para su promoción al siguiente ciclo.
                </p>
              </div>
            </div>

            <div className="shrink-0 print:hidden">
              <Link
                href="/matriculas/ratificacion"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ratificar al Ciclo {kardex.cicloSiguienteNumero}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TARJETAS DE KPIS Y RESUMEN GENERAL                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Promedio Ponderado Acumulado */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Promedio Ponderado (PPA)
            </span>
            <Award className="w-4 h-4 text-[#C4121A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">
              {kardex.promedioPonderadoAcumulado.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">/ 20</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Escala vigesimal peruana oficial
          </p>
        </div>

        {/* KPI 2: Avance Curricular / Créditos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Créditos Aprobados
            </span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">
              {kardex.totalCreditosAprobados}
            </span>
            <span className="text-xs text-slate-500">/ {kardex.totalCreditosPlan} cr.</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((kardex.totalCreditosAprobados / (kardex.totalCreditosPlan || 1)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>

        {/* KPI 3: Cursos en Arrastre Activos */}
        <div
          className={`border rounded-2xl p-4 shadow-2xs relative overflow-hidden ${
            kardex.totalArrastresActivos >= 3
              ? 'bg-rose-50/50 border-rose-300'
              : kardex.totalArrastresActivos > 0
              ? 'bg-amber-50/50 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Cursos en Arrastre
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                kardex.totalArrastresActivos >= 3
                  ? 'text-rose-600'
                  : kardex.totalArrastresActivos > 0
                  ? 'text-amber-600'
                  : 'text-slate-400'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-heading ${
                kardex.totalArrastresActivos >= 3
                  ? 'text-rose-700'
                  : kardex.totalArrastresActivos > 0
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {kardex.totalArrastresActivos}
            </span>
            <span className="text-xs text-slate-500">asignaturas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {kardex.totalArrastresActivos >= 3
              ? 'Bloqueo estricto por 3+'
              : kardex.totalArrastresActivos > 0
              ? 'Apto condicional (<3)'
              : 'Récord limpio'}
          </p>
        </div>

        {/* KPI 4: Trayectoria y Promoción */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ciclo Académico
            </span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">
              Ciclo {kardex.cicloActualNumero}
            </span>
            <span className="text-xs text-slate-500">de 6</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {kardex.puedeMatricularSiguienteCiclo
              ? `Apto para Ciclo ${kardex.cicloSiguienteNumero}`
              : 'Detenido en Ciclo de Verano'}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SECCIÓN DE ARRASTRES Y ASIGNATURAS POR REGULARIZAR          */}
      {/* ============================================================== */}
      {kardex.arrastresDetalle.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Bitácora de Cursos en Arrastre y Deuda Académica ({kardex.arrastresDetalle.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Nota mínima requerida: 13
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Asignatura Reprobada</th>
                  <th className="py-2 px-3">Ciclo de Origen</th>
                  <th className="py-2 px-3 text-center">Calificación</th>
                  <th className="py-2 px-3">Condición de Arrastre</th>
                  <th className="py-2 px-3 text-right">Acción Administrativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {kardex.arrastresDetalle.map(a => (
                  <tr key={a.cursoCodigo} className="hover:bg-rose-50/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {a.cursoCodigo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      {a.cursoNombre}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      Ciclo {a.cicloOrden}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700 bg-rose-50/50">
                      {String(a.nota).padStart(2, '0')} / 20
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {kardex.totalArrastresActivos >= 3 ? 'Bloqueante para Ciclo Siguiente' : 'Arrastre Regular Permitido'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/matriculas/nueva?estudiante_id=${estudiante?.id}&curso=${a.cursoCodigo}`}
                        className="text-[11px] font-bold text-[#C4121A] hover:underline"
                      >
                        Inscribir a Ciclo de Verano &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TRAYECTORIA LONGITUDINAL DE LOS 6 CICLOS                    */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Cabecera y Filtro de Ciclos */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Malla Curricular y Récord Académico Longitudinal (Ciclos I al VI)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Carrera Técnica de 3 Años · Centro de Capacitaciones Brusben · Sede Central Tumbes
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrintKardex}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Imprimir Kardex Oficial (PDF / A4)</span>
            </button>
          </div>
        </div>

        {/* Listado de los 6 Ciclos */}
        <div className="divide-y divide-slate-200">
          {kardex.ciclos.map(ciclo => {
            return (
              <div key={ciclo.cicloNumero} className="p-5 space-y-3">
                {/* Cabecera del Ciclo */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                      C{ciclo.cicloNumero}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {ciclo.cicloNombre}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Total {ciclo.cursos.length} asignaturas · {ciclo.creditosTotales} créditos académicos
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ciclo.promedioPonderado !== null && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white border border-slate-200 text-slate-900 shadow-2xs">
                        PPA Ciclo: {ciclo.promedioPonderado.toFixed(2)}
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        ciclo.estadoCiclo === 'APROBADO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ciclo.estadoCiclo === 'CON_ARRASTRES'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : ciclo.estadoCiclo === 'BLOQUEADO'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : ciclo.estadoCiclo === 'EN_CURSO'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ciclo.estadoCiclo === 'APROBADO'
                        ? 'CICLO APROBADO'
                        : ciclo.estadoCiclo === 'CON_ARRASTRES'
                        ? `${ciclo.arrastresCount} ARRASTRE(S)`
                        : ciclo.estadoCiclo === 'BLOQUEADO'
                        ? 'BLOQUEADO (3+ ARRASTRES)'
                        : ciclo.estadoCiclo === 'EN_CURSO'
                        ? 'EN CURSO (ACTUAL)'
                        : 'PENDIENTE DE CURSAR'}
                    </span>
                  </div>
                </div>

                {/* Tabla de Cursos del Ciclo */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Asignatura</th>
                        <th className="py-2 px-2 text-center">Créd.</th>
                        <th className="py-2 px-2 text-center">Hrs.</th>
                        <th className="py-2 px-3">Prerrequisito</th>
                        <th className="py-2 px-2 text-center font-mono">EC1 (20%)</th>
                        <th className="py-2 px-2 text-center font-mono">EC2 (20%)</th>
                        <th className="py-2 px-2 text-center font-mono">EP (30%)</th>
                        <th className="py-2 px-2 text-center font-mono">EF (30%)</th>
                        <th className="py-2 px-2 text-center font-mono font-black">PF</th>
                        <th className="py-2 px-2 text-center">Asist.</th>
                        <th className="py-2 px-3 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ciclo.cursos.map(c => {
                        const pf = c.evaluaciones.promedioFinal;
                        const isApproved = pf !== null && pf >= 13;
                        const isFailed = pf !== null && pf < 13;

                        return (
                          <tr key={c.codigo} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {c.codigo}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {c.nombre}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                              {c.creditos}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-500 font-mono">
                              {c.horasSemanales}
                            </td>
                            <td className="py-2.5 px-3">
                              {c.prerrequisitoCodigo ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                    c.prerrequisitoCumplido
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {c.prerrequisitoCumplido ? '✓' : '✗'} {c.prerrequisitoCodigo}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Sin prerrequisito</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                              {c.evaluaciones.ec1 !== null ? String(c.evaluaciones.ec1).padStart(2, '0') : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                              {c.evaluaciones.ec2 !== null ? String(c.evaluaciones.ec2).padStart(2, '0') : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                              {c.evaluaciones.ep !== null ? String(c.evaluaciones.ep).padStart(2, '0') : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                              {c.evaluaciones.ef !== null ? String(c.evaluaciones.ef).padStart(2, '0') : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-black text-sm">
                              <span className={getNotaColor(pf)}>
                                {pf !== null ? String(pf).padStart(2, '0') : '--'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600">
                              {c.asistenciaPct > 0 ? `${c.asistenciaPct}%` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Aprobado
                                </span>
                              ) : isFailed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Arrastre
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  <Clock className="w-2.5 h-2.5" />
                                  Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. VISTA OFICIAL IMPRIMIBLE DEL KARDEX ACADÉMICO (A4 / PDF)     */}
      {/* ============================================================== */}
      <div className="hidden print:block font-sans text-slate-900 p-4 space-y-6">
        {/* Cabecera Oficial */}
        <div className="flex items-center justify-between border-b-2 border-[#C4121A] pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center border-2 border-red-500">
              BR
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                Centro de Capacitaciones Brusben
              </h1>
              <p className="text-xs font-semibold text-slate-700">
                Resolución Directoral Regional · RUC: 20409499849 · Sede Central Tumbes
              </p>
              <p className="text-[11px] text-slate-500">
                Dirección Académica y Registros Curriculares Oficiales
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-red-700 block">
              KARDEX-ACAD-{codigoEstudiantil}
            </span>
            <span className="text-[10px] text-slate-500">
              Emisión: {new Date().toLocaleDateString('es-PE')}
            </span>
          </div>
        </div>

        {/* Ficha de Datos del Estudiante */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
          <div>
            <p><strong>Estudiante:</strong> {nombreCompleto}</p>
            <p><strong>DNI / Documento:</strong> {dniEstudiante}</p>
            <p><strong>Código Estudiantil:</strong> {codigoEstudiantil}</p>
          </div>
          <div>
            <p><strong>Carrera / Programa:</strong> {programaNombre}</p>
            <p><strong>Condición Oficial:</strong> {kardex.condicionTexto}</p>
            <p><strong>Promedio Ponderado Acumulado:</strong> {kardex.promedioPonderadoAcumulado.toFixed(2)} / 20</p>
          </div>
        </div>

        {/* Tabla Consolidada para Impresión */}
        <div className="space-y-4">
          {kardex.ciclos.map(ciclo => (
            <div key={ciclo.cicloNumero} className="space-y-1">
              <div className="flex justify-between items-center bg-slate-200 px-3 py-1 font-bold text-xs uppercase">
                <span>{ciclo.cicloNombre}</span>
                <span>PPA: {ciclo.promedioPonderado ? ciclo.promedioPonderado.toFixed(2) : '--'}</span>
              </div>
              <table className="w-full text-left text-[10px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-1">Cód.</th>
                    <th className="p-1">Asignatura</th>
                    <th className="p-1 text-center">Créd.</th>
                    <th className="p-1 text-center">EC1</th>
                    <th className="p-1 text-center">EC2</th>
                    <th className="p-1 text-center">EP</th>
                    <th className="p-1 text-center">EF</th>
                    <th className="p-1 text-center font-bold">PF</th>
                    <th className="p-1 text-right">Condición</th>
                  </tr>
                </thead>
                <tbody>
                  {ciclo.cursos.map(c => (
                    <tr key={c.codigo} className="border-b border-slate-200">
                      <td className="p-1 font-mono">{c.codigo}</td>
                      <td className="p-1">{c.nombre}</td>
                      <td className="p-1 text-center">{c.creditos}</td>
                      <td className="p-1 text-center font-mono">{c.evaluaciones.ec1 ?? '-'}</td>
                      <td className="p-1 text-center font-mono">{c.evaluaciones.ec2 ?? '-'}</td>
                      <td className="p-1 text-center font-mono">{c.evaluaciones.ep ?? '-'}</td>
                      <td className="p-1 text-center font-mono">{c.evaluaciones.ef ?? '-'}</td>
                      <td className="p-1 text-center font-mono font-bold">
                        {c.evaluaciones.promedioFinal ?? '--'}
                      </td>
                      <td className="p-1 text-right font-bold">
                        {c.evaluaciones.promedioFinal !== null && c.evaluaciones.promedioFinal >= 13
                          ? 'APROBADO'
                          : c.evaluaciones.promedioFinal !== null
                          ? 'DESAPROBADO (ARRASTRE)'
                          : 'PENDIENTE'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Firmas de Autoridad Académica */}
        <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs">
          <div className="border-t border-slate-600 pt-2">
            <p className="font-bold uppercase">Secretaría Académica General</p>
            <p className="text-[10px] text-slate-500">Centro de Capacitaciones Brusben</p>
          </div>
          <div className="border-t border-slate-600 pt-2">
            <p className="font-bold uppercase">Dirección General</p>
            <p className="text-[10px] text-slate-500">Sede Central - Tumbes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
