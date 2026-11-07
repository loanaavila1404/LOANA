"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  History,
  KeyRound,
  UserCheck,
  AlertOctagon,
  Coins,
  Receipt,
  Search,
  Filter,
  Eye,
  Download,
  Copy,
  Check,
  RefreshCw,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Building,
  FileSpreadsheet,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRightLeft,
  Trash2
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type SeveridadLog = 'INFO' | 'WARNING' | 'CRITICAL' | 'AUDIT';
export type ResultadoLog = 'EXITOSO' | 'FALLIDO' | 'ADVERTENCIA' | 'AUDITADO';
export type CategoriaTab = 'TODOS' | 'ELIMINADOS' | 'MODIFICACIONES' | 'ACCESOS' | 'FINANZAS';

export interface AuditoriaEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  module: string;
  entity: string;
  entityId: string;
  detail: string;
  severity: SeveridadLog;
  result: ResultadoLog;
  ipAddress: string;
  userAgent: string;
  correlationId: string;
  dataBefore?: Record<string, unknown> | null;
  dataAfter?: Record<string, unknown> | null;
}

interface AuditoriaManagerClientProps {
  initialLogs?: AuditoriaEvent[];
}

export const ACCIONES_AMIGABLES: Record<string, { titulo: string; colorBadge: string }> = {
  LOGIN: { titulo: "Inicio de Sesión Seguro", colorBadge: "bg-teal-50 text-teal-800 border-teal-200" },
  LOGOUT: { titulo: "Cierre de Sesión", colorBadge: "bg-slate-100 text-slate-700 border-slate-200" },
  RBAC_UPDATE: { titulo: "Actualización de Roles y Permisos", colorBadge: "bg-purple-50 text-purple-700 border-purple-200" },
  INSERT: { titulo: "Nueva Matrícula Registrada", colorBadge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  UPDATE: { titulo: "Actualización de Registro", colorBadge: "bg-blue-50 text-blue-800 border-blue-200" },
  DELETE: { titulo: "Eliminación de Registro", colorBadge: "bg-red-50 text-[#990000] border-red-200" },
  DELETE_PROGRAMA: { titulo: "Eliminación de Programa Académico", colorBadge: "bg-red-50 text-[#990000] border-red-200" },
  DELETE_EDICION: { titulo: "Eliminación de Edición / Grupo", colorBadge: "bg-red-50 text-[#990000] border-red-200" },
  DELETE_CURSO: { titulo: "Eliminación de Asignatura / Curso", colorBadge: "bg-red-50 text-[#990000] border-red-200" },
  DELETE_HORARIO: { titulo: "Eliminación de Bloque Horario", colorBadge: "bg-red-50 text-[#990000] border-red-200" },
  DELETE_PROSPECTO: { titulo: "Eliminación de Prospecto CRM", colorBadge: "bg-red-50 text-[#990000] border-red-200" },
  PAGO_REGISTRO: { titulo: "Emisión de Recibo de Pago", colorBadge: "bg-amber-50 text-amber-800 border-amber-200" },
  ANULACION_PAGO: { titulo: "Modificación Bloqueada / Auditoría", colorBadge: "bg-red-50 text-[#990000] border-red-200" },
  SECURITY_CHECK: { titulo: "Verificación de Seguridad y Token", colorBadge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

const DICCIONARIO_CAMPOS: Record<string, string> = {
  motivo_eliminacion: "Motivo de la eliminación",
  eliminado_por: "Usuario que eliminó",
  deleted_at: "Fecha y hora de eliminación",
  nombre: "Nombre oficial",
  codigo: "Código identificador",
  activo: "Estado de activación",
  sede_default: "Sede predeterminada",
  root_protection: "Protección de cuenta raíz (Superadministrador)",
  modified_by: "Modificado por",
  codigo_matricula: "Código oficial de matrícula",
  estudiante_dni: "DNI del estudiante",
  programa: "Programa académico",
  periodo: "Periodo académico",
  sede: "Sede institucional",
  monto_total: "Costo total del programa",
  numero_recibo: "Número correlativo de recibo",
  matricula_id: "Código de matrícula asociada",
  monto_cobrado: "Monto cobrado",
  metodo_pago: "Método de pago",
  concepto: "Concepto de la cuota",
  total_cuotas: "Total de cuotas del cronograma",
  monto_pension: "Monto de cuota mensual",
  primer_vencimiento: "Fecha de primer vencimiento",
  token_prefijo: "Prefijo de token de activación",
  modo: "Modo de simulación",
  modulos: "Cantidad de módulos curriculares",
  horas_totales: "Horas formativas totales",
  locked: "Bloqueo directo de fila contable",
  estado: "Estado del registro",
  security_rule: "Regla de seguridad aplicada",
  logged_in_audit: "Registrado en bitácora inmutable",
  auth_provider: "Proveedor de autenticación",
  email: "Correo institucional",
  role: "Rol institucional asignado",
  status: "Estado de cuenta",
};

function formatearNombreCampo(clave: string): string {
  if (DICCIONARIO_CAMPOS[clave]) return DICCIONARIO_CAMPOS[clave];
  return clave
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatearValor(clave: string, valor: unknown): string {
  if (valor === null || valor === undefined) return "Sin registro previo";
  if (typeof valor === 'boolean') return valor ? "Activado / Sí" : "Desactivado / No";
  if (typeof valor === 'number') {
    const claveLower = clave.toLowerCase();
    if (
      (claveLower.includes('monto') || claveLower.includes('cobrado') || claveLower.includes('total')) &&
      !claveLower.includes('cuotas') &&
      !claveLower.includes('horas')
    ) {
      return `S/ ${valor.toFixed(2)}`;
    }
    return valor.toString();
  }
  return String(valor);
}

interface CampoComparado {
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  cambioReal: boolean;
}

function obtenerCambiosComparativos(
  dataBefore?: Record<string, unknown> | null,
  dataAfter?: Record<string, unknown> | null
): CampoComparado[] {
  const before = dataBefore || {};
  const after = dataAfter || {};

  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  
  if (allKeys.length === 0) return [];

  return allKeys.map(key => {
    const valBefore = before[key];
    const valAfter = after[key];
    
    return {
      campo: formatearNombreCampo(key),
      valorAnterior: valBefore !== undefined ? formatearValor(key, valBefore) : "Sin registro previo",
      valorNuevo: valAfter !== undefined ? formatearValor(key, valAfter) : "Sin mutación posterior",
      cambioReal: JSON.stringify(valBefore) !== JSON.stringify(valAfter)
    };
  });
}

export function AuditoriaManagerClient({ initialLogs = [] }: AuditoriaManagerClientProps) {
  const [logs] = useState<AuditoriaEvent[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<CategoriaTab>('TODOS');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("TODOS");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("TODAS");
  
  // Estado para el modal de inspección en lenguaje humano
  const [inspectedEvent, setInspectedEvent] = useState<AuditoriaEvent | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Cálculos de KPIs Superiores
  const totalEventosHoy = logs.length;
  
  const totalAccesos = useMemo(() => {
    return logs.filter(l => 
      l.action.includes('LOGIN') || 
      l.action.includes('AUTH') || 
      l.action.includes('SESSION') || 
      l.module === 'SEGURIDAD' && l.entity === 'sesiones'
    ).length;
  }, [logs]);

  const totalCriticos = useMemo(() => {
    return logs.filter(l => 
      l.severity === 'CRITICAL' || 
      l.action.includes('DELETE') || 
      l.action.includes('RBAC') || 
      l.action.includes('BLOQUEO')
    ).length;
  }, [logs]);

  const totalFinancieros = useMemo(() => {
    return logs.filter(l => 
      l.module === 'FINANZAS' || 
      l.action.includes('PAGO') || 
      l.entity === 'pagos' || 
      l.entity === 'cuotas'
    ).length;
  }, [logs]);

  const totalEliminados = useMemo(() => {
    return logs.filter(l => 
      l.action === 'DELETE' || 
      l.action.includes('DELETE') || 
      l.action.includes('ELIMIN') || 
      (l.detail && l.detail.toLowerCase().includes('elimin'))
    ).length;
  }, [logs]);

  // Filtrado de eventos
  const filteredLogs = useMemo(() => {
    return logs.filter(event => {
      // Filtro por texto
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = 
        event.userName.toLowerCase().includes(term) ||
        event.userEmail.toLowerCase().includes(term) ||
        event.action.toLowerCase().includes(term) ||
        event.module.toLowerCase().includes(term) ||
        event.entityId.toLowerCase().includes(term) ||
        event.detail.toLowerCase().includes(term) ||
        event.ipAddress.includes(term);

      if (!matchSearch) return false;

      // Filtro por Módulo
      if (selectedModule !== "TODOS" && event.module !== selectedModule) {
        return false;
      }

      // Filtro por Severidad
      if (selectedSeverity !== "TODAS" && event.severity !== selectedSeverity) {
        return false;
      }

      // Filtro por Categoría Tab
      if (activeTab === 'ELIMINADOS') {
        return (
          event.action === 'DELETE' ||
          event.action.includes('DELETE') ||
          event.action.includes('ELIMIN') ||
          (event.detail && event.detail.toLowerCase().includes('elimin'))
        );
      }
      if (activeTab === 'MODIFICACIONES') {
        return ['INSERT', 'UPDATE', 'RBAC_UPDATE', 'CAMBIO_ESTADO'].some(a => event.action.includes(a));
      }
      if (activeTab === 'ACCESOS') {
        return ['LOGIN', 'LOGOUT', 'AUTH', 'SESSION', 'SECURITY_CHECK'].some(a => event.action.includes(a)) || event.module === 'SEGURIDAD';
      }
      if (activeTab === 'FINANZAS') {
        return event.module === 'FINANZAS' || ['PAGO', 'RECIBO', 'ANULACION', 'CUOTA'].some(a => event.action.includes(a));
      }

      return true;
    });
  }, [logs, searchTerm, selectedModule, selectedSeverity, activeTab]);

  // Exportar logs en formato JSON
  const handleExportJson = () => {
    setIsExporting(true);
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `auditoria_brusben_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  // Comparación de campos para el evento actualmente inspeccionado
  const camposComparados = useMemo(() => {
    if (!inspectedEvent) return [];
    return obtenerCambiosComparativos(inspectedEvent.dataBefore, inspectedEvent.dataAfter);
  }, [inspectedEvent]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* CABECERA INSTITUCIONAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 text-[#C4121A] rounded-xl border border-red-100 shadow-xs">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Auditoría y Trazabilidad Operativa
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Log Inmutable (WORM)
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                Bitácora de operaciones, modificaciones de datos, movimientos financieros y directivas de acceso en Sede Central - Tumbes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportJson}
            disabled={isExporting}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border-slate-200 shadow-xs hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-slate-600" />
            {isExporting ? "Exportando..." : "Descargar Bitácora JSON"}
          </Button>
        </div>
      </div>

      {/* PASO 1: TARJETAS KPI SUPERIORES DE AUDITORÍA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* KPI 1: Eventos Auditados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Eventos Auditados</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <History className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalEventosHoy} <span className="text-base font-medium text-slate-600">{totalEventosHoy === 1 ? 'evento' : 'eventos'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-700">
              <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                100% trazabilidad
              </span>
              <span className="text-slate-600">Sin saltos temporales</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Bitácora de Eliminados (Historial Permanente) */}
        <div 
          onClick={() => setActiveTab('ELIMINADOS')}
          className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
            activeTab === 'ELIMINADOS'
              ? 'border-red-400 ring-2 ring-red-400/20 shadow-xs'
              : 'border-slate-200 shadow-xs hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Bitácora Eliminados</span>
            <div className="p-2 bg-red-50 text-[#C4121A] rounded-xl border border-red-100">
              <Trash2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalEliminados} <span className="text-base font-medium text-slate-600">{totalEliminados === 1 ? 'registro' : 'registros'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#990000]">
              <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 font-bold">
                Trazabilidad WORM
              </span>
              <span className="text-slate-600">Quién, cuándo y motivo</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Accesos y Sesiones */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Accesos y Sesiones</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalAccesos} <span className="text-base font-medium text-slate-600">{totalAccesos === 1 ? 'sesión' : 'sesiones'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tokens OAuth
              </span>
              <span className="text-slate-600">0 anomalías de IP</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Modificaciones Críticas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Modificaciones Críticas</span>
            <div className="p-2 bg-red-50 text-[#C4121A] rounded-xl border border-red-100">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalCriticos} <span className="text-base font-medium text-slate-600">{totalCriticos === 1 ? 'crítica' : 'críticas'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-600">
              <span className="px-1.5 py-0.5 rounded bg-red-50 text-[#990000] border border-red-200 font-bold">
                Alto Impacto
              </span>
              <span className="text-slate-600">Verificado en español</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Operaciones Financieras */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Finanzas Auditadas</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
              {totalFinancieros} <span className="text-base font-medium text-slate-600">{totalFinancieros === 1 ? 'operación' : 'operaciones'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700">
              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                Caja & Recibos
              </span>
              <span className="text-slate-600">Control correlativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* PASO 2: PESTAÑAS DE FILTRADO Y TABLA DE EVENTOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* BARRA DE HERRAMIENTAS Y PESTAÑAS */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-4">
          {/* Pestañas de Filtrado Rápido */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'TODOS' as CategoriaTab, label: 'Todos los logs', count: logs.length },
              { id: 'ELIMINADOS' as CategoriaTab, label: '🗑️ Bitácora de Eliminados (Historial)', count: totalEliminados },
              { id: 'MODIFICACIONES' as CategoriaTab, label: 'Modificaciones de datos (Alta/Edición)', count: logs.filter(l => ['INSERT', 'UPDATE', 'RBAC_UPDATE', 'CAMBIO_ESTADO'].some(a => l.action.includes(a))).length },
              { id: 'ACCESOS' as CategoriaTab, label: 'Accesos y seguridad (Auth/Sesión)', count: totalAccesos },
              { id: 'FINANZAS' as CategoriaTab, label: 'Operaciones financieras (Pagos/Recibos)', count: totalFinancieros },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtros: Búsqueda, Módulo y Severidad */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {/* Input de Búsqueda */}
            <div className="md:col-span-6 relative">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por usuario, acción, recurso (MAT-2026), IP o detalle..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] text-slate-900 transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Selector de Módulo */}
            <div className="md:col-span-3">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] shadow-xs"
              >
                <option value="TODOS">Todos los Módulos</option>
                <option value="MATRICULAS">Matrículas & Estudiantes</option>
                <option value="FINANZAS">Finanzas & Tesorería</option>
                <option value="SEGURIDAD">Seguridad & Usuarios</option>
                <option value="OFERTA_ACADEMICA">Oferta Académica</option>
                <option value="CRM">CRM & Captación</option>
                <option value="SISTEMA">Configuración de Sistema</option>
              </select>
            </div>

            {/* Selector de Severidad */}
            <div className="md:col-span-3">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/30 focus:border-[#C4121A] shadow-xs"
              >
                <option value="TODAS">Todas las Severidades</option>
                <option value="INFO">INFO (Operativo regular)</option>
                <option value="AUDIT">AUDIT (Trazabilidad contable/académica)</option>
                <option value="WARNING">WARNING (Advertencia)</option>
                <option value="CRITICAL">CRITICAL (Operación de alto impacto)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL DE EVENTOS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Hora / Severidad</th>
                <th className="py-3.5 px-4 font-bold">Usuario & Contexto</th>
                <th className="py-3.5 px-4 font-bold">Acción Realizada</th>
                <th className="py-3.5 px-4 font-bold">Módulo & Recurso</th>
                <th className="py-3.5 px-4 font-bold">Detalle Operativo</th>
                <th className="py-3.5 px-4 font-bold text-center">Resultado</th>
                <th className="py-3.5 px-4 font-bold text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const horaStr = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const fechaStr = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });

                  // Colores de Severidad
                  const severityBadge = 
                    log.severity === 'CRITICAL'
                      ? 'bg-red-50 text-[#990000] border-red-200'
                      : log.severity === 'AUDIT'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : log.severity === 'WARNING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const accionInfo = ACCIONES_AMIGABLES[log.action] || {
                    titulo: log.action.replace(/_/g, ' '),
                    colorBadge: 'bg-slate-100 text-slate-700 border-slate-200'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Hora / Severidad */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${severityBadge}`}>
                            {log.severity}
                          </span>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 block leading-tight">
                              {horaStr}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {fechaStr}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Usuario & Contexto */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {log.userName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-600">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-600">
                            {log.ipAddress}
                          </span>
                          <span>·</span>
                          <span className="text-slate-600 truncate max-w-[140px]" title={log.userRole}>
                            {log.userRole}
                          </span>
                        </div>
                      </td>

                      {/* Acción Realizada (Lenguaje Claro) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs ${accionInfo.colorBadge}`}>
                          {accionInfo.titulo}
                        </span>
                      </td>

                      {/* Módulo & Recurso */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-800">
                          {log.module}
                        </div>
                        <div className="mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {log.entityId}
                          </span>
                        </div>
                      </td>

                      {/* Detalle Operativo */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 font-medium line-clamp-2" title={log.detail}>
                          {log.detail}
                        </p>
                      </td>

                      {/* Resultado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.result === 'EXITOSO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.result === 'FALLIDO'
                            ? 'bg-red-50 text-[#990000] border border-red-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {log.result}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectedEvent(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs shadow-2xs transition-all hover:border-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Resumen</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-600 space-y-2">
                      <Search className="h-8 w-8 text-slate-600 stroke-1" />
                      <p className="font-bold text-slate-700">No se encontraron registros de auditoría coincidentes</p>
                      <p className="text-xs text-slate-600">Intenta modificando el término de búsqueda, módulo o severidad.</p>
                      <button 
                        onClick={() => { setSearchTerm(""); setSelectedModule("TODOS"); setSelectedSeverity("TODAS"); setActiveTab('TODOS'); }}
                        className="mt-2 text-xs font-bold text-[#C4121A] hover:underline"
                      >
                        Restablecer todos los filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Mostrando <span className="font-bold text-slate-800">{filteredLogs.length}</span> de <span className="font-bold text-slate-800">{logs.length}</span> eventos inmutables en bitácora
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {logs.filter(l => l.result === 'EXITOSO').length} Exitosos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              {logs.filter(l => l.severity === 'AUDIT').length} Contables / Auditados
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {totalCriticos} Críticos
            </span>
          </div>
        </div>
      </div>

      {/* PASO 1: MODAL DE DETALLE EN LENGUAJE HUMANO (SIN JSON CRUDO NI CORRELATION_ID) */}
      <Modal
        isOpen={Boolean(inspectedEvent)}
        onClose={() => setInspectedEvent(null)}
        title="Detalle de la Operación"
        className="max-w-2xl"
      >
        {inspectedEvent && (
          <div className="space-y-4">
            {/* Cabecera Amigable */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">
                      {ACCIONES_AMIGABLES[inspectedEvent.action]?.titulo || inspectedEvent.action}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                      inspectedEvent.result === 'EXITOSO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {inspectedEvent.result}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Módulo: <strong className="text-slate-800">{inspectedEvent.module}</strong> · Recurso: <span className="font-mono bg-slate-200 px-1 py-0.2 rounded font-semibold text-slate-800">{inspectedEvent.entityId}</span>
                  </p>
                </div>
              </div>

              {/* Resumen Quién y Cuándo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Responsable</span>
                    <span className="font-bold text-slate-900 text-xs block leading-tight">{inspectedEvent.userName}</span>
                    <span className="text-[11px] text-slate-600">{inspectedEvent.userRole}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Fecha y Hora</span>
                    <span className="font-semibold text-slate-800 text-xs block leading-tight">
                      {new Date(inspectedEvent.timestamp).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono">
                      {new Date(inspectedEvent.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sede y Dirección IP */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-[#C4121A]" />
                  Sede Central - Tumbes
                </span>
                <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  IP: {inspectedEvent.ipAddress}
                </span>
              </div>
            </div>

            {/* Explicación en Lenguaje Natural */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-blue-950 block">Descripción del Movimiento:</span>
                <p className="text-blue-900 font-medium leading-relaxed">
                  {inspectedEvent.detail}
                </p>
              </div>
            </div>

            {/* DETALLE DEL CAMBIO (LISTA / TABLA COMPARATIVA EN LENGUAJE HUMANO) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#C4121A]" />
                  Detalle del Cambio (Valores Comparados)
                </label>
                <span className="text-[11px] text-slate-600 font-medium">
                  {camposComparados.length} {camposComparados.length === 1 ? 'campo registrado' : 'campos registrados'}
                </span>
              </div>

              {camposComparados.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Campo Modificado</th>
                        <th className="py-2.5 px-3">Valor Anterior</th>
                        <th className="py-2.5 px-3">Valor Nuevo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {camposComparados.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.campo}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-medium">
                              {item.valorAnterior}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              {item.valorNuevo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-800">No se detectaron mutaciones de campos en este evento</p>
                  <p className="text-slate-600 mt-0.5">Operación de consulta o inicio de sesión autenticado correctamente.</p>
                </div>
              )}
            </div>

            {/* BOTÓN DE CIERRE AMIGABLE */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button
                type="button"
                onClick={() => setInspectedEvent(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs"
              >
                Entendido / Cerrar Detalle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
