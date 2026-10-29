'use client'

import { SessionUser } from '@/lib/types'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  User,
  LogOut,
  X,
} from 'lucide-react'

export function MobileDrawer({
  isOpen,
  onClose,
  user,
  appVersion = '1.0.0',
}: {
  isOpen: boolean
  onClose: () => void
  user: SessionUser
  appVersion?: string
}) {
  const perms = user?.permissions || []
  const isSuperadmin =
    user?.roleCode === 'SUPERADMIN' ||
    user?.role?.toLowerCase().includes('superadmin') ||
    perms.includes('SISTEMA.ADMINISTRAR')

  const canViewReportes = isSuperadmin || perms.includes('SISTEMA.ADMINISTRAR')
  const canViewAuditoria = isSuperadmin || perms.includes('AUDITORIA.VER')
  const canViewUsuarios = isSuperadmin || perms.includes('USUARIOS.VER')

  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      onClose()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' && (pathname === '/dashboard' || pathname === '/')) return true
    if (path !== '/dashboard' && pathname.startsWith(path)) return true
    return false
  }

  // Prevent scrolling on body when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const userName = user?.name || 'Loana Avila Neyra'
  const userRole = user?.role || 'Superadministrador'
  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'LA'
    )
  }

  return (
    <div
      className={`md:hidden fixed inset-0 z-50 print:hidden no-print ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-[290px] bg-[#181A1F] text-slate-200 flex flex-col transition-transform duration-300 shadow-2xl z-10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Institutional Brand Container & Sede */}
        <div className="p-3.5 border-b border-white/5 bg-[#141519] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="bg-white rounded-xl px-2.5 py-1.5 shadow-xs flex items-center justify-center border border-white/10 group flex-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-brusben.png"
                alt="Centro de Capacitaciones Brusben"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg active:bg-slate-800 cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sede badge */}
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

        {/* Drawer User info snippet */}
        <div className="px-3.5 py-2.5 bg-[#111215]/80 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#c4121a] to-rose-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden border border-white/20">
            {user?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              getInitials(userName)
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span> {userRole}
            </p>
          </div>
        </div>

        {/* Drawer Navigation List with Categories */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3.5 text-xs font-medium no-scrollbar">
          {/* SECCIÓN 1: PRINCIPAL & VENTAS */}
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Principal & Ventas
            </div>
            <Link
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Inicio</span>
            </Link>

            <Link
              onClick={onClose}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/crm')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/crm"
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 shrink-0" />
                <span>CRM Comercial</span>
              </div>
              <span className="bg-[#c4121a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Prospectos
              </span>
            </Link>
          </div>

          {/* SECCIÓN 2: GESTIÓN ACADÉMICA */}
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Gestión Académica
            </div>
            <Link
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/personas')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/personas"
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Personas y estudiantes</span>
            </Link>

            <Link
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/oferta')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/oferta"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Oferta académica</span>
            </Link>

            <Link
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/matriculas')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/matriculas"
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Matrículas</span>
            </Link>

            <Link
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/horarios')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/horarios"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Horarios</span>
            </Link>
          </div>

          {/* SECCIÓN 3: EVALUACIÓN & MÉTRICAS */}
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Evaluación & Métricas
            </div>
            <Link
              onClick={onClose}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/notas')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/notas"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 shrink-0" />
                <span>Notas y actas</span>
              </div>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0-20
              </span>
            </Link>

            {canViewReportes && (
              <Link
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/reportes')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
                href="/reportes"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Reportes y analítica</span>
              </Link>
            )}
          </div>

          {/* SECCIÓN 4: CONTROL INSTITUCIONAL */}
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Control Institucional
            </div>
            {canViewUsuarios && (
              <Link
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/usuarios')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
                href="/usuarios"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Usuarios y accesos (RBAC)</span>
              </Link>
            )}

            {canViewAuditoria && (
              <Link
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive('/auditoria')
                    ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
                href="/auditoria"
              >
                <History className="w-4 h-4 shrink-0" />
                <span>Auditoría y trazabilidad</span>
              </Link>
            )}

            <Link
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                isActive('/perfil')
                  ? 'bg-[#c4121a] text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              href="/perfil"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Mi perfil</span>
            </Link>
          </div>
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 bg-[#111215] text-[11px] border-t border-slate-800 flex items-center justify-between text-slate-500 mt-auto">
          <span>ERP Brusben v{appVersion}</span>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#c4121a] active:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar sesión"
            type="button"
          >
            {isLoggingOut ? (
              <span>Saliendo...</span>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
