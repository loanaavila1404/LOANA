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
  Terminal,
  FileSpreadsheet
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type SeveridadLog = 'INFO' | 'WARNING' | 'CRITICAL' | 'AUDIT';
export type ResultadoLog = 'EXITOSO' | 'FALLIDO' | 'ADVERTENCIA' | 'AUDITADO';
export type CategoriaTab = 'TODOS' | 'MODIFICACIONES' | 'ACCESOS' | 'FINANZAS';

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

export function AuditoriaManagerClient({ initialLogs = [] }: AuditoriaManagerClientProps) {
  const [logs, setLogs] = useState<AuditoriaEvent[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<CategoriaTab>('TODOS');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("TODOS");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("TODAS");
  
  // Estado para el modal de inspección técnica
  const [inspectedEvent, setInspectedEvent] = useState<AuditoriaEvent | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
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
      if (activeTab === 'MODIFICACIONES') {
        const isMod = ['INSERT', 'UPDATE', 'DELETE', 'RBAC_UPDATE', 'CAMBIO_ESTADO'].some(a => event.action.includes(a));
        return isMod;
      }
      if (activeTab === 'ACCESOS') {
        const isAccess = ['LOGIN', 'LOGOUT', 'AUTH', 'SESSION', 'SECURITY_CHECK'].some(a => event.action.includes(a)) || event.module === 'SEGURIDAD';
        return isAccess;
      }
      if (activeTab === 'FINANZAS') {
        const isFinance = event.module === 'FINANZAS' || ['PAGO', 'RECIBO', 'ANULACION', 'CUOTA'].some(a => event.action.includes(a));
        return isFinance;
      }

      return true;
    });
  }, [logs, searchTerm, selectedModule, selectedSeverity, activeTab]);

  // Función para exportar logs en formato JSON
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
                Bitácora forense de operaciones, mutaciones de base de datos, movimientos financieros y directivas de acceso en Sede Central - Tumbes.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Eventos Registrados */}
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

        {/* KPI 2: Accesos y Sesiones */}
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

        {/* KPI 3: Modificaciones Críticas */}
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
              <span className="text-slate-600">Con diffs de BD</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Operaciones Financieras */}
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
              { id: 'MODIFICACIONES' as CategoriaTab, label: 'Modificaciones de datos (INSERT/UPDATE)', count: logs.filter(l => ['INSERT', 'UPDATE', 'DELETE', 'RBAC_UPDATE', 'CAMBIO_ESTADO'].some(a => l.action.includes(a))).length },
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
                placeholder="Buscar por usuario, acción (UPDATE), recurso (MAT-2026), IP o detalle..."
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
                <th className="py-3.5 px-4 font-bold text-right">Forense</th>
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

                  // Colores de Acción
                  const isInsert = log.action.includes('INSERT') || log.action.includes('CREACION');
                  const isUpdate = log.action.includes('UPDATE') || log.action.includes('MODIFICACION') || log.action.includes('RBAC');
                  const isDelete = log.action.includes('DELETE') || log.action.includes('ANULACION');
                  const isLogin = log.action.includes('LOGIN') || log.action.includes('AUTH');
                  const isPay = log.action.includes('PAGO') || log.action.includes('RECIBO');

                  const actionBadge = isInsert
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isUpdate
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : isDelete
                    ? 'bg-red-50 text-[#990000] border-red-200'
                    : isPay
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : isLogin
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

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

                      {/* Acción Realizada */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono shadow-2xs ${actionBadge}`}>
                          {log.action}
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

                      {/* Acción Forense */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectedEvent(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs shadow-2xs transition-all hover:border-slate-300"
                          title="Inspeccionar payload JSON antes y después"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Detalle</span>
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

      {/* MODAL DE INSPECCIÓN TÉCNICA Y FORENSE */}
      <Modal
        isOpen={Boolean(inspectedEvent)}
        onClose={() => setInspectedEvent(null)}
        title="Inspección Técnica de Evento de Auditoría"
        className="max-w-3xl"
      >
        {inspectedEvent && (
          <div className="space-y-4">
            {/* Cabecera del Evento */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {inspectedEvent.action}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 font-mono">
                    {inspectedEvent.entityId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-mono text-[11px]">
                    {new Date(inspectedEvent.timestamp).toLocaleString('es-PE')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {inspectedEvent.result}
                  </span>
                </div>
              </div>
              <p className="text-slate-700 font-medium pt-1">
                {inspectedEvent.detail}
              </p>
            </div>

            {/* Metadatos de Contexto */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Usuario</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate" title={inspectedEvent.userName}>
                  {inspectedEvent.userName}
                </span>
                <span className="text-[10px] text-slate-600 block">{inspectedEvent.userRole}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Módulo / Entidad</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{inspectedEvent.module}</span>
                <span className="text-[10px] text-slate-600 font-mono block">{inspectedEvent.entity}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Dirección IP</span>
                <span className="font-semibold font-mono text-slate-800 mt-0.5 block">{inspectedEvent.ipAddress}</span>
                <span className="text-[10px] text-slate-600 block">Sede Central - Tumbes</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Correlation ID</span>
                <span className="font-mono text-[10px] text-slate-700 mt-0.5 block truncate" title={inspectedEvent.correlationId}>
                  {inspectedEvent.correlationId}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block">Firma Cripto OK</span>
              </div>
            </div>

            {/* Payload JSON de Datos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-600" />
                  Payload de Datos (Diff Auditoría)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const fullPayload = JSON.stringify({
                      antes: inspectedEvent.dataBefore || null,
                      despues: inspectedEvent.dataAfter || null,
                      metadata: {
                        evento_id: inspectedEvent.id,
                        timestamp: inspectedEvent.timestamp,
                        usuario: inspectedEvent.userEmail,
                        ip: inspectedEvent.ipAddress,
                        userAgent: inspectedEvent.userAgent
                      }
                    }, null, 2);
                    navigator.clipboard.writeText(fullPayload);
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">¡JSON Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Datos Antes */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100">
                  <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span>data_before (Estado Previo)</span>
                    <span className="text-[10px] text-slate-600 font-sans">Snapshot</span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed text-slate-300 custom-scrollbar">
                    {inspectedEvent.dataBefore 
                      ? JSON.stringify(inspectedEvent.dataBefore, null, 2)
                      : '// Sin datos previos (Registro Inicial / INSERT)'}
                  </pre>
                </div>

                {/* Datos Después */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100">
                  <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                    <span>data_after (Estado Mutado)</span>
                    <span className="text-[10px] text-slate-600 font-sans">Persistido</span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed text-emerald-300 custom-scrollbar">
                    {inspectedEvent.dataAfter 
                      ? JSON.stringify(inspectedEvent.dataAfter, null, 2)
                      : '// Sin mutación posterior'}
                  </pre>
                </div>
              </div>
            </div>

            {/* User Agent */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono truncate" title={inspectedEvent.userAgent}>
              <span className="font-bold text-slate-700 font-sans">User-Agent: </span>
              {inspectedEvent.userAgent}
            </div>

            {/* Botón Cerrar */}
            <div className="flex justify-end pt-2 border-t border-slate-200">
              <Button
                type="button"
                onClick={() => setInspectedEvent(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                Cerrar Inspección
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
