"use client";

import { useState } from "react";
import { ProspectoFormModal } from "./ProspectoFormModal";

export function CRMHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C4121A] bg-red-50 px-2 py-0.5 rounded border border-red-100">
            Gestión de Admisiones & Prospectos
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">CRM Comercial</h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Gestiona el ciclo de captación, asignación a asesores y conversión de prospectos para las carreras y cursos técnicos.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            <span>Exportar CSV/Excel</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm">
            <span>⚡ Reasignar en lote</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#C4121A] hover:bg-[#A30D14] rounded-lg shadow-sm transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            <span>+ Nuevo prospecto</span>
          </button>
        </div>
      </div>

      <ProspectoFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
