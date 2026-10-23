'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import {
  GraduationCap,
  Clock,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export interface MatriculasMetricsData {
  totalRecaudadoMes: number;
  metaMes: number;
  porcentajeMeta: number;
  matriculasActivas: number;
  alumnosRegulares: number;
  alumnosBecas: number;
  vouchersPendientesCount: number;
  vouchersPendientesMonto: number;
  montoMorosidad: number;
  porcentajeMorosidad: number;
  cuotasVencidasCount: number;
  cobranzaHoy: number;
  tasaCumplimiento: number;
}

export function MatriculasMetrics({ metrics }: { metrics: MatriculasMetricsData }) {
  return (
    <div className="space-y-4">
      {/* 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Recaudado en el Mes */}
        <Card className="bg-white border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Recaudado (Mes)
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black font-mono text-xs border border-emerald-200">
                S/
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(metrics.totalRecaudadoMes)}
              </span>
            </div>

            {/* Comparativa con Meta */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Meta: {formatCurrency(metrics.metaMes)}</span>
                <span className="font-bold text-emerald-700">{metrics.porcentajeMeta}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(metrics.porcentajeMeta, 100)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              Recaudación acumulada del periodo actual
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Matrículas del Ciclo Activo */}
        <Card className="bg-white border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Matrículas Ciclo Activo
              </span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {metrics.matriculasActivas}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                estudiantes vigentes
              </span>
            </div>

            {/* Desglose: Alumnos Regulares vs Becas */}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                {metrics.alumnosRegulares} regulares
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {metrics.alumnosBecas} becas / conv.
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Alumnos con habilitación y cronograma financiero activo
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Pagos por Validar / Vouchers Pendientes */}
        <Card className="bg-white border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Vouchers por Validar
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {metrics.vouchersPendientesCount}
              </span>
              <span className="text-xs font-semibold text-amber-700">
                {formatCurrency(metrics.vouchersPendientesMonto)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">Yape</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">Plin</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">BCP / BBVA</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Prematrículas o transferencias bancarias en verificación
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Morosidad / Cuotas Vencidas */}
        <Card className="bg-white border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Morosidad / Vencidas
              </span>
              <div className="w-9 h-9 rounded-lg bg-red-50 text-[#C4121A] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-red-600">
                {formatCurrency(metrics.montoMorosidad)}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                {metrics.porcentajeMorosidad}%
              </span>
            </div>

            <div className="mt-3 text-xs font-medium text-slate-600">
              <span>{metrics.cuotasVencidasCount} cuota(s) fuera de término</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Cuotas vencidas sujetas a gestión de cobranza y mora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Franja Inferior Institucional: Cobranza del Día y Cumplimiento */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldCheck className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Cobranza de Hoy
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                En vivo
              </span>
            </div>
            <p className="text-xl font-extrabold text-white">
              {formatCurrency(metrics.cobranzaHoy)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[11px]">Tasa de Cumplimiento:</span>
              <span className="font-bold text-white text-sm">{metrics.tasaCumplimiento}% a tiempo</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-400 block text-[11px]">Conciliación Bancaria:</span>
              <span className="font-bold text-white text-sm">Al día (Tumbes · Sede Central)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
