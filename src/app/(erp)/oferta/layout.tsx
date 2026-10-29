import { ReactNode } from 'react';
import { requirePermission } from '@/lib/auth/permissions';
import { BookOpen } from 'lucide-react';

export default async function OfertaLayout({ children }: { children: ReactNode }) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-[#C4121A] text-[11px] font-bold uppercase tracking-wider mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Gestión Curricular y Programación</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
          Oferta Académica Institucional
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Administración integral de programas formativos, mallas curriculares por ciclos, planes de estudio y ediciones activas.
        </p>
      </div>

      <div>{children}</div>
    </div>
  );
}
