'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

export function MobileNav({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t border-slate-200 z-30 px-3 py-1.5 flex items-center justify-around shadow-lg print:hidden no-print">
      {/* Tab 1: Inicio */}
      <Link className={cn("flex flex-col items-center gap-0.5", isActive('/dashboard') ? "text-[#c4121a] font-bold" : "text-slate-500 font-medium hover:text-slate-800")} href="/dashboard">
        <svg className="w-5 h-5" fill={isActive('/dashboard') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="text-[10px]">Inicio</span>
      </Link>
      
      {/* Tab 2: CRM */}
      <Link className={cn("flex flex-col items-center gap-0.5", isActive('/crm') ? "text-[#c4121a] font-bold" : "text-slate-500 font-medium hover:text-slate-800")} href="/crm">
        <div className="relative">
          <svg className="w-5 h-5" fill={isActive('/crm') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          {/* Mock notification badge */}
        </div>
        <span className="text-[10px]">CRM</span>
      </Link>

      {/* Tab 3: Matrículas */}
      <Link className={cn("flex flex-col items-center gap-0.5", isActive('/matriculas') ? "text-[#c4121a] font-bold" : "text-slate-500 font-medium hover:text-slate-800")} href="/matriculas">
        <svg className="w-5 h-5" fill={isActive('/matriculas') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="text-[10px]">Matrículas</span>
      </Link>

      {/* Tab 4: Estudiantes */}
      <Link className={cn("flex flex-col items-center gap-0.5", isActive('/personas') ? "text-[#c4121a] font-bold" : "text-slate-500 font-medium hover:text-slate-800")} href="/personas">
        <svg className="w-5 h-5" fill={isActive('/personas') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="text-[10px]">Alumnos</span>
      </Link>

      {/* Tab 5: Menu Toggle */}
      <button onClick={onOpenSidebar} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800 font-medium" type="button">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="text-[10px]">Menú</span>
      </button>
    </footer>
  )
}
