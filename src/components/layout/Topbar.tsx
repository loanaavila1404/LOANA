'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SessionUser, SedeContextType } from '@/lib/types'
import { SedeSelector } from './SedeSelector'
import { createClient } from '@/lib/supabase/client'
import {
  globalSearch,
  getOperationalNotifications,
  GlobalSearchResultItem,
  OperationalNotificationItem,
} from '@/app/actions/global-topbar'

const CATEGORY_LABELS: Record<GlobalSearchResultItem['category'], string> = {
  ESTUDIANTE: 'Personas y Estudiantes',
  MATRICULA: 'Matrículas',
  PROGRAMA: 'Programas Académicos',
  PROSPECTO: 'Prospectos CRM',
}

export function Topbar({
  user,
  onOpenSidebar,
  sedeContext,
}: {
  user: SessionUser
  onOpenSidebar: () => void
  sedeContext?: SedeContextType
}) {
  const pathname = usePathname()
  const router = useRouter()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const notifContainerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [notifications, setNotifications] = useState<OperationalNotificationItem[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isLoadingNotif, setIsLoadingNotif] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'U'
    )
  }

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(p => p)
    if (paths.length === 0 || (paths.length === 1 && paths[0] === 'dashboard')) {
      return 'Panel de gestión'
    }
    return paths.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' / ')
  }

  // Cargar notificaciones operativas reales
  useEffect(() => {
    let active = true
    setIsLoadingNotif(true)
    getOperationalNotifications()
      .then(items => {
        if (active) setNotifications(items)
      })
      .catch(err => {
        console.error('[Topbar] Error al cargar notificaciones:', err)
      })
      .finally(() => {
        if (active) setIsLoadingNotif(false)
      })
    return () => {
      active = false
    }
  }, [pathname])

  // Atajo de teclado Ctrl+K / Cmd+K para enfocar el buscador global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setIsSearchOpen(true)
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsNotifOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Búsqueda con debounce en Supabase
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await globalSearch(trimmed)
        if (!cancelled) {
          setResults(res)
        }
      } catch (err) {
        console.error('[Topbar] Error en búsqueda global:', err)
      } finally {
        if (!cancelled) {
          setIsSearching(false)
        }
      }
    }, 220)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const groupedResults = results.reduce<Record<string, GlobalSearchResultItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between flex-shrink-0 z-20 print:hidden no-print">
        <div className="flex items-center space-x-6 flex-1 max-w-2xl">
          <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium shrink-0">
            <span className="text-slate-400">ERP Brusben</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px]">{getBreadcrumbs()}</span>
          </nav>

          {/* Buscador Global con resultados reales */}
          <div ref={searchContainerRef} className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </span>
            <input
              ref={searchInputRef}
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] placeholder-slate-400 text-slate-700 transition"
              placeholder="Buscar estudiantes, DNI, matrículas, programas... (Ctrl+K)"
              type="text"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}

            {/* Dropdown de Resultados Globales */}
            {isSearchOpen && query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto divide-y divide-slate-100">
                {isSearching ? (
                  <div className="p-4 text-xs text-slate-500 text-center">
                    Buscando en base de datos...
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-xs text-slate-500 text-center">
                    No se encontraron resultados para <strong>&ldquo;{query.trim()}&rdquo;</strong>
                  </div>
                ) : (
                  Object.entries(groupedResults).map(([category, items]) => (
                    <div key={category} className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {CATEGORY_LABELS[category as GlobalSearchResultItem['category']] || category}
                      </div>
                      <div className="space-y-0.5">
                        {items.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false)
                              router.push(item.href)
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 transition"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                              <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                            </div>
                            {item.status && (
                              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {item.status}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <SedeSelector context={sedeContext} />

          {/* Campana de Notificaciones Operativas Reales */}
          <div ref={notifContainerRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(prev => !prev)}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md relative transition-colors"
              title="Notificaciones operativas"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#dc2626] text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Alertas operativas</h3>
                    <p className="text-[10px] text-slate-500">Cobranza, prematrículas y seguimientos CRM</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#c4121a] border border-red-200">
                    {notifications.length} activa(s)
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {isLoadingNotif ? (
                    <div className="p-4 text-xs text-slate-500 text-center">Cargando alertas...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-5 text-xs text-slate-500 text-center">
                      No hay alertas operativas pendientes en este momento.
                    </div>
                  ) : (
                    notifications.map(item => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsNotifOpen(false)}
                        className="block px-4 py-3 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              item.severity === 'red'
                                ? 'bg-red-600'
                                : item.severity === 'amber'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-600'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">{item.description}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{item.meta}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <Link
                    href="/reportes/financiero"
                    onClick={() => setIsNotifOpen(false)}
                    className="font-semibold text-[#c4121a] hover:underline"
                  >
                    Ver reporte de cobranza →
                  </Link>
                  <Link
                    href="/matriculas"
                    onClick={() => setIsNotifOpen(false)}
                    className="font-medium text-slate-600 hover:text-slate-900"
                  >
                    Ir a matrículas
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center space-x-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user.name}</div>
              <div className="text-[10px] font-medium text-[#c4121a] flex items-center justify-end gap-1">
                <span>{user.role}</span>
                <svg className="w-3 h-3 text-emerald-600 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    clipRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-200 ring-2 ring-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner overflow-hidden">
              {user.photoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                </>
              ) : (
                getInitials(user.name)
              )}
            </div>

            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="p-1.5 text-slate-400 hover:text-[#c4121a] hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title="Cerrar sesión"
              type="button"
            >
              {isLoggingOut ? (
                <svg className="w-4 h-4 animate-spin text-[#c4121a]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm print:hidden no-print">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenSidebar}
              aria-label="Abrir menú de navegación"
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              </svg>
            </button>
            <div className="bg-white border border-slate-200 rounded-md px-2 py-1 flex items-center justify-center h-8 shadow-2xs">
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Logo Brusben" className="h-full w-auto object-contain" />
              </>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsNotifOpen(prev => !prev)}
              aria-label="Notificaciones del sistema"
              className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 rounded-full bg-[#c4121a] text-white text-[9px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <div className="flex items-center pl-1 border-l border-slate-200 gap-1.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shadow-xs overflow-hidden">
                  {user.photoUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                    </>
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="p-1 text-slate-400 hover:text-[#c4121a] hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                title="Cerrar sesión"
                type="button"
              >
                {isLoggingOut ? (
                  <svg className="w-4 h-4 animate-spin text-[#c4121a]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
