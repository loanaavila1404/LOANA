'use client'

import React from 'react'

export function Sidebar() {
  return (
    <aside className="w-64 h-full bg-[#181A1F] text-slate-300 flex flex-col flex-shrink-0 z-30 select-none transition-all duration-200">
      {/* Brand & Logo Container */}
      <div className="h-16 px-4 bg-black/25 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="h-9 w-9 rounded-lg bg-[#c4121a] flex items-center justify-center flex-shrink-0 text-white shadow-sm ring-1 ring-white/10">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"></path>
            </svg>
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-bold tracking-wider text-white text-sm truncate uppercase">
              BRUSBEN <span className="text-xs font-normal text-slate-400">E.I.R.L.</span>
            </span>
            <span className="text-[9px] text-slate-400 font-medium tracking-tight truncate uppercase">
              Capacitarse es superarse
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation Items List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto text-xs font-medium custom-scrollbar">
        {/* Item: Inicio (Active) */}
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[#c4121a] text-white shadow-sm font-semibold group transition-colors" href="/dashboard">
          <svg className="w-4 h-4 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="truncate">Inicio</span>
        </a>
        
        {/* Item: CRM Comercial */}
        <a className="flex items-center justify-between px-3 py-2.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white group transition-colors" href="/crm">
          <div className="flex items-center gap-3 truncate">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="truncate">CRM Comercial</span>
          </div>
          <span className="text-[10px] font-semibold bg-[#c4121a]/80 text-white px-1.5 py-0.5 rounded-full">12</span>
        </a>
        
        {/* Item: Personas y estudiantes */}
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white group transition-colors" href="/students">
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="truncate">Personas y estudiantes</span>
        </a>
        
        {/* Item: Oferta académica */}
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white group transition-colors" href="/programs">
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="truncate">Oferta académica</span>
        </a>
        
        {/* Item: Matrículas */}
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white group transition-colors" href="/enrollments">
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="truncate">Matrículas</span>
        </a>
        
        {/* Item: Usuarios y accesos */}
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white group transition-colors" href="/users">
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="truncate">Usuarios y accesos</span>
        </a>
        
        {/* Item: Auditoría */}
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white group transition-colors" href="/audit">
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="truncate">Auditoría</span>
        </a>
        
        {/* Item: Mi perfil */}
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-white/5 hover:text-white group transition-colors" href="/profile">
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="truncate">Mi perfil</span>
        </a>
      </nav>
      
      {/* Sidebar Footer: System Status */}
      <div className="p-3 border-t border-white/5 bg-black/20 text-xs mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium text-[11px]">ERP Brusben v2.4.0</span>
          <span className="flex items-center text-[10px] text-emerald-400 gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Operativo
          </span>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
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
  )
}
