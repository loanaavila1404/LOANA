'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/currency';
import {
  Search,
  FileText,
  Eye,
  X,
  CreditCard,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  Download,
} from 'lucide-react';

export type CuotaItem = {
  id: string;
  matricula_id: string;
  tipo_cuota: string | null;
  numero_cuota: number;
  concepto: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  importe_original: number | null;
  descuento: number | null;
  recargo: number | null;
  importe_neto: number | null;
  saldo: number | null;
  status: string | null;
};

export type MatriculaRow = {
  id: string;
  codigo_matricula: string;
  status: string | null;
  estudiante_id: string;
  edicion_id: string;
  fecha_matricula: string | null;
  fecha_prematricula: string | null;
  importe_matricula: number | null;
  importe_pension: number | null;
  numero_pensiones: number | null;
  descuento_total: number | null;
  descuento_motivo: string | null;
  primer_vencimiento: string | null;
  frecuencia_meses: number | null;
  created_at: string | null;
  estudiante: {
    id: string;
    codigo_estudiante: string | null;
    personas: {
      nombres: string | null;
      apellido_paterno: string | null;
      apellido_materno: string | null;
      numero_documento: string | null;
      telefono?: string | null;
      email?: string | null;
    } | null;
  } | null;
  edicion: {
    id: string;
    codigo: string;
    nombre: string | null;
    turno?: string | null;
    modalidad?: string | null;
    vacantes?: number | null;
    programas: {
      id: string;
      nombre: string;
      codigo: string;
    } | null;
  } | null;
  cuotas: CuotaItem[];
  // Campos calculados
  totalNeto: number;
  totalPagado: number;
  totalSaldo: number;
  saldoVencido: number;
  tieneCuotasPorVencer: boolean;
  estadoFinanciero: 'AL_DIA' | 'VOUCHER_PENDIENTE' | 'POR_VENCER' | 'CON_DEUDA' | 'PAGADO_TOTAL';
};

interface Props {
  initialMatriculas: MatriculaRow[];
}

export function MatriculasTableWithDrawer({ initialMatriculas }: Props) {
  const [activeTab, setActiveTab] = useState<'TODAS' | 'AL_DIA' | 'VOUCHERS' | 'POR_VENCER' | 'CON_DEUDA'>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [selectedMatricula, setSelectedMatricula] = useState<MatriculaRow | null>(null);

  // Cerrar Drawer con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMatricula(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Conteos para las pestañas de filtrado rápido
  const counts = useMemo(() => {
    return {
      todas: initialMatriculas.length,
      alDia: initialMatriculas.filter(m => m.estadoFinanciero === 'AL_DIA' || m.estadoFinanciero === 'PAGADO_TOTAL').length,
      vouchers: initialMatriculas.filter(m => m.estadoFinanciero === 'VOUCHER_PENDIENTE').length,
      porVencer: initialMatriculas.filter(m => m.estadoFinanciero === 'POR_VENCER').length,
      conDeuda: initialMatriculas.filter(m => m.estadoFinanciero === 'CON_DEUDA').length,
    };
  }, [initialMatriculas]);

  // Filtrado de matrículas según pestaña, búsqueda y estado
  const filteredMatriculas = useMemo(() => {
    return initialMatriculas.filter(m => {
      // Filtro por pestaña
      if (activeTab === 'AL_DIA') {
        if (m.estadoFinanciero !== 'AL_DIA' && m.estadoFinanciero !== 'PAGADO_TOTAL') return false;
      } else if (activeTab === 'VOUCHERS') {
        if (m.estadoFinanciero !== 'VOUCHER_PENDIENTE') return false;
      } else if (activeTab === 'POR_VENCER') {
        if (m.estadoFinanciero !== 'POR_VENCER') return false;
      } else if (activeTab === 'CON_DEUDA') {
        if (m.estadoFinanciero !== 'CON_DEUDA') return false;
      }

      // Filtro por estado operativo
      if (statusFilter !== 'TODOS' && m.status !== statusFilter) {
        return false;
      }

      // Filtro por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codigoMat = m.codigo_matricula.toLowerCase();
        const p = m.estudiante?.personas;
        const nombreCompleto = `${p?.nombres || ''} ${p?.apellido_paterno || ''} ${p?.apellido_materno || ''}`.toLowerCase();
        const dni = (p?.numero_documento || '').toLowerCase();
        const codEst = (m.estudiante?.codigo_estudiante || '').toLowerCase();
        const prog = (m.edicion?.programas?.nombre || '').toLowerCase();
        const edCod = (m.edicion?.codigo || '').toLowerCase();

        return (
          codigoMat.includes(q) ||
          nombreCompleto.includes(q) ||
          dni.includes(q) ||
          codEst.includes(q) ||
          prog.includes(q) ||
          edCod.includes(q)
        );
      }

      return true;
    });
  }, [initialMatriculas, activeTab, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Pestañas de Filtrado Rápido */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('TODAS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'TODAS'
              ? 'border-[#C4121A] text-[#C4121A] bg-red-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>Todas las matrículas</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700">
            {counts.todas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AL_DIA')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'AL_DIA'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Al día / Sin deuda</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
            {counts.alDia}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VOUCHERS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'VOUCHERS'
              ? 'border-amber-500 text-amber-700 bg-amber-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Vouchers por validar</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
            {counts.vouchers}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('POR_VENCER')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'POR_VENCER'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Cuotas por vencer</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800">
            {counts.porVencer}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CON_DEUDA')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'CON_DEUDA'
              ? 'border-red-600 text-[#C4121A] bg-red-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-600" />
          <span>Morosos / Con deuda</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-800 font-extrabold">
            {counts.conDeuda}
          </span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, estudiante, DNI..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVA">Activa</option>
            <option value="PREMATRICULA">Prematrícula</option>
            <option value="RESERVADA">Reservada</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="RETIRADA">Retirada</option>
            <option value="ANULADA">Anulada</option>
            <option value="VENCIDA">Vencida</option>
          </select>

          <Link href="/matriculas/nueva">
            <Button className="h-8 px-3 text-xs bg-[#C4121A] hover:bg-red-700 text-white font-semibold">
              + Nueva Matrícula
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabla Principal */}
      <Card className="overflow-hidden border-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Programa / Edición</th>
                <th className="py-3 px-4">Estado Matrícula</th>
                <th className="py-3 px-4">Estado Financiero</th>
                <th className="py-3 px-4 text-right">Amortizado / Total</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatriculas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No se encontraron matrículas con este criterio</p>
                      <p className="text-xs text-slate-400">Intenta cambiar los filtros o la pestaña activa</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMatriculas.map(m => {
                  const p = m.estudiante?.personas;
                  const nombreCompleto = p ? `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim() : 'Estudiante sin datos';
                  const ed = m.edicion;
                  const prog = ed?.programas?.nombre || 'Programa';

                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMatricula(m)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Código */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-[#C4121A] transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#C4121A]" />
                          <span>{m.codigo_matricula}</span>
                        </div>
                      </td>

                      {/* Estudiante */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{nombreCompleto}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                          <span>DNI: {p?.numero_documento || '-'}</span>
                          {m.estudiante?.codigo_estudiante && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600">{m.estudiante.codigo_estudiante}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Programa / Edición */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{prog}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-600">
                            {ed?.codigo}
                          </span>
                          {ed?.turno && <span>• Turno {ed.turno}</span>}
                        </div>
                      </td>

                      {/* Estado Matrícula */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            m.status === 'ACTIVA'
                              ? 'success'
                              : m.status === 'PREMATRICULA'
                              ? 'default'
                              : m.status === 'RESERVADA'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {m.status}
                        </Badge>
                      </td>

                      {/* Estado Financiero */}
                      <td className="py-3 px-4">
                        {m.estadoFinanciero === 'CON_DEUDA' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            Moroso ({formatCurrency(m.saldoVencido)})
                          </span>
                        )}
                        {m.estadoFinanciero === 'POR_VENCER' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Cuota por vencer
                          </span>
                        )}
                        {m.estadoFinanciero === 'VOUCHER_PENDIENTE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Por Validar
                          </span>
                        )}
                        {m.estadoFinanciero === 'PAGADO_TOTAL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Pagado Total
                          </span>
                        )}
                        {m.estadoFinanciero === 'AL_DIA' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Al Día
                          </span>
                        )}
                      </td>

                      {/* Inversión / Amortizado */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(m.totalPagado)}
                          <span className="text-slate-400 font-normal text-[11px]"> / {formatCurrency(m.totalNeto)}</span>
                        </div>
                        {m.totalSaldo > 0 ? (
                          <div className="text-[11px] font-semibold text-red-600">
                            Resta: {formatCurrency(m.totalSaldo)}
                          </div>
                        ) : (
                          <div className="text-[11px] font-semibold text-emerald-600">
                            100% amortizado
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedMatricula(m)}
                            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Ver Panel Lateral Financiero"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </button>

                          <Link
                            href={`/matriculas/${m.id}/ficha`}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-600 hover:text-[#C4121A] transition-colors"
                            title="Ver Ficha PDF"
                          >
                            <FileText className="w-4 h-4 text-red-600" />
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
      </Card>

      {/* PANEL LATERAL DE DETALLE FINANCIERO (DRAWER) */}
      {selectedMatricula && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop con desenfoque suave */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedMatricula(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-300">
              
              {/* Header del Drawer */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Expediente Financiero
                    </span>
                    <Badge
                      variant={
                        selectedMatricula.status === 'ACTIVA'
                          ? 'success'
                          : selectedMatricula.status === 'PREMATRICULA'
                          ? 'default'
                          : 'warning'
                      }
                    >
                      {selectedMatricula.status}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {selectedMatricula.codigo_matricula}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMatricula(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* 1. Datos del Estudiante */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Estudiante Titular</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedMatricula.estudiante?.personas?.nombres}{' '}
                      {selectedMatricula.estudiante?.personas?.apellido_paterno}{' '}
                      {selectedMatricula.estudiante?.personas?.apellido_materno}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">DNI / Documento</span>
                        <span className="font-semibold text-slate-800">
                          {selectedMatricula.estudiante?.personas?.numero_documento || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Código Estudiantil</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedMatricula.estudiante?.codigo_estudiante || 'Pendiente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Teléfono</span>
                        <span>{selectedMatricula.estudiante?.personas?.telefono || 'No registrado'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Correo</span>
                        <span className="truncate block" title={selectedMatricula.estudiante?.personas?.email || ''}>
                          {selectedMatricula.estudiante?.personas?.email || 'No registrado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Programa y Edición */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                    <GraduationCap className="w-4 h-4 text-slate-500" />
                    <span>Oferta Académica</span>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedMatricula.edicion?.programas?.nombre}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Edición / Grupo</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedMatricula.edicion?.codigo} - {selectedMatricula.edicion?.nombre}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Turno / Modalidad</span>
                        <span className="font-semibold text-slate-800">
                          {selectedMatricula.edicion?.turno || 'Regular'} • {selectedMatricula.edicion?.modalidad || 'Presencial'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Indicadores de Amortización */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Resumen de Amortización
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {Math.round((selectedMatricula.totalPagado / (selectedMatricula.totalNeto || 1)) * 100)}% pagado
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          Math.round((selectedMatricula.totalPagado / (selectedMatricula.totalNeto || 1)) * 100),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Total Neto</span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {formatCurrency(selectedMatricula.totalNeto)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Amortizado</span>
                      <span className="text-xs font-extrabold text-emerald-600">
                        {formatCurrency(selectedMatricula.totalPagado)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Saldo Pendiente</span>
                      <span className={`text-xs font-extrabold ${selectedMatricula.totalSaldo > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {formatCurrency(selectedMatricula.totalSaldo)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Desglose de Aranceles */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Estructura Arancelaria
                  </span>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Matrícula Inicial:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(selectedMatricula.importe_matricula || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">
                        Pensiones ({selectedMatricula.numero_pensiones || 0} cuotas x {formatCurrency(selectedMatricula.importe_pension || 0)}):
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency((selectedMatricula.importe_pension || 0) * (selectedMatricula.numero_pensiones || 0))}
                      </span>
                    </div>
                    {Boolean(selectedMatricula.descuento_total && selectedMatricula.descuento_total > 0) && (
                      <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 bg-emerald-50/50 px-2 rounded">
                        <span>Descuento / Beca ({selectedMatricula.descuento_motivo || 'Beca Institucional'}):</span>
                        <span className="font-bold">-{formatCurrency(selectedMatricula.descuento_total || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 font-bold text-slate-900 text-sm">
                      <span>Inversión Total Neta:</span>
                      <span className="text-[#C4121A]">{formatCurrency(selectedMatricula.totalNeto)}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Cronograma de Cuotas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Cronograma de Cuotas ({selectedMatricula.cuotas.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      1er Vto: {selectedMatricula.primer_vencimiento || '-'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedMatricula.cuotas.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg text-center">
                        No hay cuotas generadas para esta matrícula.
                      </p>
                    ) : (
                      selectedMatricula.cuotas.map((c, idx) => (
                        <div
                          key={c.id || idx}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">
                              {c.concepto || (c.tipo_cuota === 'MATRICULA' ? 'Matrícula' : `Pensión ${c.numero_cuota}`)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Vence: {c.fecha_vencimiento || 'Inmediato'}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-slate-900">
                              {formatCurrency(c.importe_neto || 0)}
                            </div>
                            <div className="mt-0.5">
                              <Badge
                                variant={
                                  c.status === 'PAGADA'
                                    ? 'success'
                                    : c.status === 'PARCIAL'
                                    ? 'warning'
                                    : c.status === 'VENCIDA'
                                    ? 'danger'
                                    : 'default'
                                }
                              >
                                {c.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Footer con Acciones */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5">
                <Link
                  href={`/matriculas/${selectedMatricula.id}/ficha`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-[#C4121A]" />
                  <span>Ficha PDF</span>
                </Link>

                <Link
                  href={`/matriculas/${selectedMatricula.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#C4121A] text-white text-xs font-bold hover:bg-red-700 transition shadow-2xs"
                >
                  <span>Gestión Completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
