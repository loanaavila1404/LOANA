'use client'

import React from 'react'

export function MobileNav({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t border-slate-200 z-30 px-3 py-1.5 flex items-center justify-around shadow-lg">
      {/* Tab 1: Inicio (Active) */}
      <a className="flex flex-col items-center gap-0.5 text-[#c4121a] font-bold" href="/dashboard">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
        </svg>
        <span className="text-[10px]">Inicio</span>
      </a>
      
      {/* Tab 2: CRM */}
      <a className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800" href="/crm">
        <div className="relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="absolute -top-1 -right-1 bg-[#c4121a] text-white text-[8px] font-black px-1 rounded-full">12</span>
        </div>
        <span className="text-[10px] font-medium">CRM</span>
      </a>
      
      {/* Tab 3: Matrículas */}
      <a className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800" href="/enrollments">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="text-[10px] font-medium">Matrículas</span>
      </a>
      
      {/* Tab 4: Estudiantes */}
      <a className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800" href="/students">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="text-[10px] font-medium">Alumnos</span>
      </a>
      
      {/* Tab 5: Menu Toggle */}
      <button onClick={onOpenSidebar} className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-800" type="button">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <span className="text-[10px] font-medium">Menú</span>
      </button>
    </footer>
  )
}
