'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser, SedeContextType } from '@/lib/types';
import {
  LayoutDashboard,
  Target,
  Users,
  BookOpen,
  ClipboardList,
  Calendar,
  Award,
  BarChart3,
  ShieldCheck,
  History,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

export function Sidebar({
  appVersion = '1.0.0',
  user,
  sedeContext,
}: {
  appVersion?: string;
  user?: SessionUser;
  sedeContext?: SedeContextType;
}) {
  const pathname = usePathname();

  const perms = user?.permissions || [];
  const roleCode = (user?.roleCode || '').toUpperCase().trim();
  const roleName = (user?.role || '').toUpperCase().trim();
  const isSuperadmin =
    roleCode === 'SUPERADMIN' ||
    roleCode === 'SUPER_ADMINISTRADOR' ||
    roleCode === 'SUPER_ADMIN' ||
    roleCode.includes('SUPER') ||
    roleName.includes('SUPER') ||
    perms.includes('SISTEMA.ADMINISTRAR');

  const isAsesorComercial =
    !isSuperadmin &&
    (roleCode === 'ASESOR_COMERCIAL' ||
      roleCode === 'ASESOR' ||
      roleName.includes('ASESOR'));

  // Permisos de navegación: Super Administrador ve TODO sin excepción
  const canViewCrm = isSuperadmin || isAsesorComercial || perms.includes('CRM.VER') || perms.includes('CRM.GESTIONAR');
  const canViewMatriculas = isSuperadmin || isAsesorComercial || perms.includes('MATRICULAS.VER') || perms.includes('MATRICULAS.GESTIONAR');

  // Módulos institucionales y académicos
  const canViewPersonas = isSuperadmin || (!isAsesorComercial && perms.includes('ESTUDIANTES.VER'));
  const canViewOferta = isSuperadmin || (!isAsesorComercial && (perms.includes('PROGRAMAS.VER') || perms.includes('PROGRAMAS.EDITAR')));
  const canViewHorarios = isSuperadmin || (!isAsesorComercial && perms.includes('ACADEMICO.VER'));
  const canViewNotas = isSuperadmin || (!isAsesorComercial && (perms.includes('NOTAS.REGISTRAR') || perms.includes('ACADEMICO.VER')));
  const canViewReportes = isSuperadmin || (!isAsesorComercial && (perms.includes('REPORTES.VER') || perms.includes('SISTEMA.ADMINISTRAR')));
  const canViewUsuarios = isSuperadmin || (!isAsesorComercial && perms.includes('USUARIOS.VER'));
  const canViewAuditoria = isSuperadmin || (!isAsesorComercial && perms.includes('AUDITORIA.VER'));

  const showGestionAcademica = canViewPersonas || canViewOferta || canViewHorarios || canViewMatriculas;
  const showEvaluacion = canViewNotas || canViewReportes;
  const showControlInstitucional = canViewUsuarios || canViewAuditoria;

  const isActive = (path: string) => {
    if (path === '/dashboard' && (pathname === '/dashboard' || pathname === '/')) return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  const userName = user?.name || 'Loana Avila Neyra';
  const userRole = user?.role || 'Superadministrador';
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'LA';

  return (
    <aside className="w-64 h-full bg-[#181A1F] text-slate-300 flex flex-col flex-shrink-0 z-30 select-none transition-all duration-200 print:hidden no-print border-r border-white/5">
      {/* ============================================================== */}
      {/* PASO 1: CABECERA DEL SIDEBAR (LOGO PROMINENTE Y SEDE)           */}
      {/* ============================================================== */}
      <div className="p-3.5 border-b border-white/5 bg-[#141519] space-y-2.5">
        {/* Contenedor del Logo: Mayor espacio y fondo blanco nítido */}
        <Link
          href="/dashboard"
          className="bg-white rounded-xl px-3 py-2 shadow-xs flex items-center justify-center border border-white/10 group transition-all hover:shadow-md block"
          title="Centro de Capacitaciones Brusben"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-brusben.png"
            alt="Centro de Capacitaciones Brusben"
            className="h-10 w-auto max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
          />
        </Link>

        {/* Badge Indicador / Selector de Sede Central - Tumbes */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200 text-[11px] truncate">
              Sede Central • Tumbes
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
            Activa
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PASO 2: CATEGORIZACIÓN DE ENLACES OPERATIVOS                   */}
      {/* ============================================================== */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto text-xs space-y-3.5 custom-scrollbar">
        {/* SECCIÓN 1: PRINCIPAL & VENTAS */}
        <div className="space-y-0.5">
          <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Principal & Ventas
          </div>

          {/* Inicio */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
              isActive('/dashboard')
                ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${isActive('/dashboard') ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Inicio</span>
          </Link>

          {/* CRM Comercial */}
          {canViewCrm && (
            <Link
              href="/crm"
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-all group ${
                isActive('/crm')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Target className={`w-4 h-4 shrink-0 ${isActive('/crm') ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="truncate">CRM Comercial</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                isActive('/crm')
                  ? 'bg-white/20 text-white'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}>
                Prospectos
              </span>
            </Link>
          )}
        </div>

        {/* SECCIÓN 2: GESTIÓN ACADÉMICA */}
        {showGestionAcademica && (
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Gestión Académica
            </div>

            {/* Personas y estudiantes */}
            {canViewPersonas && (
              <Link
                href="/personas"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/personas')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 ${isActive('/personas') ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Personas y estudiantes</span>
              </Link>
            )}

            {/* Oferta académica */}
            {canViewOferta && (
              <Link
                href="/oferta/programas"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/oferta')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <BookOpen className={`w-4 h-4 shrink-0 ${isActive('/oferta') ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Oferta académica</span>
              </Link>
            )}

            {/* Horarios */}
            {canViewHorarios && (
              <Link
                href="/horarios"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/horarios')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${isActive('/horarios') ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Horarios</span>
              </Link>
            )}

            {/* Matrículas */}
            {canViewMatriculas && (
              <div className="space-y-0.5">
                <Link
                  href="/matriculas"
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                    pathname === '/matriculas' || pathname.startsWith('/matriculas/nueva')
                      ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <ClipboardList className={`w-4 h-4 shrink-0 ${pathname === '/matriculas' ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">Matrículas</span>
                </Link>

                {!isAsesorComercial && (
                  <Link
                    href="/matriculas/ratificacion"
                    className={`flex items-center gap-2.5 pl-6 pr-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      pathname.startsWith('/matriculas/ratificacion')
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${pathname.startsWith('/matriculas/ratificacion') ? 'text-[#c4121a]' : 'text-slate-400'}`} />
                    <span className="truncate">Ratificación de Ciclos</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 3: EVALUACIÓN & MÉTRICAS */}
        {showEvaluacion && (
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Evaluación & Métricas
            </div>

            {/* Notas y actas */}
            {canViewNotas && (
              <Link
                href="/notas"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/notas')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Award className={`w-4 h-4 shrink-0 ${isActive('/notas') ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Notas y actas</span>
              </Link>
            )}

            {/* Reportes y analítica */}
            {canViewReportes && (
              <Link
                href="/reportes"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/reportes')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <BarChart3 className={`w-4 h-4 shrink-0 ${isActive('/reportes') ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Reportes y analítica</span>
              </Link>
            )}
          </div>
        )}

        {/* SECCIÓN 4: CONTROL INSTITUCIONAL */}
        {showControlInstitucional && (
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Control Institucional
            </div>

            {/* Usuarios y accesos (RBAC) */}
            {canViewUsuarios && (
              <Link
                href="/usuarios"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/usuarios')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${isActive('/usuarios') ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Usuarios y accesos (RBAC)</span>
              </Link>
            )}

            {/* Auditoría y trazabilidad */}
            {canViewAuditoria && (
              <Link
                href="/auditoria"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/auditoria')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <History className={`w-4 h-4 shrink-0 ${isActive('/auditoria') ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">Auditoría y trazabilidad</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* ============================================================== */}
      {/* PASO 3: PIE OPERATIVO (MI PERFIL Y VERSIÓN)                    */}
      {/* ============================================================== */}
      <div className="p-3 border-t border-white/5 bg-[#141519] space-y-2 mt-auto">
        <Link
          href="/perfil"
          className={`flex items-center gap-2.5 p-2 rounded-xl transition-all group ${
            isActive('/perfil')
              ? 'bg-white/10 text-white border border-white/15'
              : 'hover:bg-white/[0.06] text-slate-300 hover:text-white border border-transparent'
          }`}
          title="Ver mi perfil"
        >
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#c4121a] to-rose-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs border border-white/20 overflow-hidden">
            {user?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span>{userInitials}</span>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#181A1F]"></span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
              {userName}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="truncate">{userRole}</span>
            </div>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
        </Link>

        {/* Versión del Sistema */}
        <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-slate-500 border-t border-white/[0.04]">
          <span className="font-semibold text-slate-400">ERP Brusben</span>
          <span className="font-mono text-slate-400">v{appVersion}</span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </aside>
  );
}
