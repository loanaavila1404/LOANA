import { ReactNode } from 'react';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/permissions';

export default async function OfertaLayout({ children }: { children: ReactNode }) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-graphite-900">Oferta Académica</h1>
        <p className="text-sm text-graphite-500">
          Gestiona los programas, periodos, planes de estudio y ediciones.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href="/oferta/programas"
            className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Programas
          </Link>
          <Link
            href="/oferta/periodos"
            className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Periodos
          </Link>
          <Link
            href="/oferta/ediciones"
            className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Ediciones
          </Link>
        </nav>
      </div>

      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
