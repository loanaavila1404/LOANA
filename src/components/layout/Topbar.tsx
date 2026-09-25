'use client'

import { usePathname } from 'next/navigation'

export function Topbar({ user, onOpenSidebar }: { user: any; onOpenSidebar: () => void }) {
  const pathname = usePathname()
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
  }

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(p => p)
    if (paths.length === 0 || (paths.length === 1 && paths[0] === 'dashboard')) return 'Panel de gestión'
    
    // Capitalize first letter and format
    return paths.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' / ')
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center space-x-6 flex-1 max-w-2xl">
          <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span className="text-slate-400">ERP Brusben</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px]">{getBreadcrumbs()}</span>
          </nav>
          
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </span>
            <input className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] placeholder-slate-400 text-slate-700 transition" placeholder="Buscar estudiantes, DNI, programas... (Ctrl+K)" type="text"/>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80 relative">
            <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <select className="bg-transparent border-none outline-none appearance-none pr-4 cursor-pointer text-slate-600 font-medium z-10 w-auto">
              <option value="tumbes">Sede Central · Tumbes</option>
              {['SUPERADMIN', 'DIRECCION'].includes(user.role?.toUpperCase() || '') && (
                <option value="todas">Todas las sedes</option>
              )}
            </select>
            <svg className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md relative transition-colors" title="Notificaciones" type="button">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2626] rounded-full ring-2 ring-white"></span>
          </button>
          
          <div className="h-6 w-px bg-slate-200"></div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user.name}</div>
              <div className="text-[10px] font-medium text-[#c4121a] flex items-center justify-end gap-1">
                <span>{user.role}</span>
                <svg className="w-3 h-3 text-emerald-600 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path>
                </svg>
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-200 ring-2 ring-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner overflow-hidden">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
            </div>
            
            <form action="/auth/signout" method="post">
              <button className="p-1.5 text-slate-400 hover:text-[#c4121a] hover:bg-rose-50 rounded-md transition-colors" title="Cerrar sesión" type="submit">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onOpenSidebar}
              aria-label="Abrir menú de navegación" 
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none" 
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
              </svg>
            </button>
            <div className="bg-white border border-slate-200 rounded-md px-2 py-1 flex items-center justify-center h-8 shadow-2xs">
              <img src="/logo.jpg" alt="Logo Brusben" className="h-full w-auto object-contain" />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button aria-label="Notificaciones del sistema" className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors" type="button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c4121a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c4121a]"></span>
              </span>
            </button>
            <div className="flex items-center pl-1 border-l border-slate-200">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shadow-xs overflow-hidden">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
