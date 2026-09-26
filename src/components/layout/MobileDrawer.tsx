'use client'
import { SessionUser } from '@/lib/types'

import React, { useEffect } from 'react'

export function MobileDrawer({ isOpen, onClose, user, appVersion = '1.0.0' }: { isOpen: boolean; onClose: () => void; user: SessionUser; appVersion?: string }) {
  
  const perms = user?.permissions || [];
  
  const canViewReportes = perms.includes('SISTEMA.ADMINISTRAR');
  const canViewAuditoria = perms.includes('AUDITORIA.VER');
  const canViewUsuarios = perms.includes('USUARIOS.VER');
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
  }

  return (
    <div className={`md:hidden fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className={`absolute top-0 bottom-0 left-0 w-[290px] bg-[#181A1F] text-slate-200 flex flex-col transition-transform duration-300 shadow-2xl z-10 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Drawer Header with Institutional Brand Container */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="bg-white rounded-md px-2.5 py-1 flex items-center h-10 shadow-sm">
            <>{/* eslint-disable-next-line @next/next/no-img-element */} <img src="/logo.jpg" alt="Logo Brusben" className="h-full w-auto object-contain" /></>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg active:bg-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
        </div>

        {/* Drawer User info snippet */}
        <div className="px-4 py-3 bg-[#111215]/60 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
            {user.photoUrl ? (
              <>{/* eslint-disable-next-line @next/next/no-img-element */} <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" /></>
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span> {user.role}
            </p>
          </div>
        </div>

        {/* Drawer Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 text-sm font-medium no-scrollbar">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#c4121a] text-white shadow-sm font-semibold" href="/dashboard">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Inicio</span>
          </a>
          
          <a className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/crm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>CRM Comercial</span>
            </div>
            <span className="bg-[#c4121a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">0</span>
          </a>
          
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/personas">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Personas y estudiantes</span>
          </a>
          
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/oferta">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Oferta académica</span>
          </a>
          
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/matriculas">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Matrículas</span>
          </a>
          
          {/* Item: Reportes */}
          {canViewReportes && (
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/reportes">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>Reportes</span>
            </a>
          )}
          
          {canViewUsuarios && (
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/usuarios">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>Usuarios y accesos</span>
            </a>
          )}
          
          {canViewAuditoria && (
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/auditoria">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span>Auditoría</span>
            </a>
          )}
          
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors" href="/perfil">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Mi perfil</span>
          </a>
        </nav>
        
        {/* Drawer Footer */}
        <div className="p-3 bg-[#111215] text-[11px] border-t border-slate-800 flex items-center justify-center text-slate-500 mt-auto">
          <span>ERP Brusben v{appVersion}</span>
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
