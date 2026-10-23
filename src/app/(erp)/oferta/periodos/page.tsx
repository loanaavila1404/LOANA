import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PeriodoFormModalClient } from './PeriodoFormModalClient';

export const metadata = {
  title: 'Periodos Académicos - ERP Brusben'
};

export default async function PeriodosPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const sp = await searchParams;

  const query = sp?.q || '';
  const statusFilter = sp?.status || 'ACTIVO';

  let dbQuery = supabase.from('periodos').select('*');

  if (query) {
    dbQuery = dbQuery.or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`);
  }
  if (statusFilter !== 'TODOS') {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  const { data: periodos } = await dbQuery.order('fecha_inicio', { ascending: false, nullsFirst: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <Link
            href="/oferta/programas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#C4121A] mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Panel de Oferta Académica</span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900">
            Administración de Periodos Académicos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestiona los semestres, ciclos lectivos y convocatorias vigentes para asociarlos a las ediciones y grupos.
          </p>
        </div>

        <PeriodoFormModalClient />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por código o nombre..."
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
          />
          <select 
            name="status" 
            defaultValue={statusFilter}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
          <button type="submit" className="bg-slate-900 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-[#C4121A] transition">
            Filtrar
          </button>
        </form>
      </div>

      <Card className="overflow-x-auto bg-white border-slate-200 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold text-slate-700">Código</TableHead>
              <TableHead className="font-bold text-slate-700">Nombre</TableHead>
              <TableHead className="font-bold text-slate-700">Fecha Inicio</TableHead>
              <TableHead className="font-bold text-slate-700">Fecha Fin</TableHead>
              <TableHead className="font-bold text-slate-700">Estado</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!periodos || periodos.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No se encontraron periodos.
                </TableCell>
              </TableRow>
            ) : (
              periodos.map(per => (
                <TableRow key={per.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono font-bold text-slate-900">{per.codigo}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{per.nombre}</TableCell>
                  <TableCell>{per.fecha_inicio ? new Date(per.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE') : '-'}</TableCell>
                  <TableCell>{per.fecha_fin ? new Date(per.fecha_fin + 'T00:00:00').toLocaleDateString('es-PE') : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={per.status === 'ACTIVO' ? 'success' : 'default'}>{per.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <PeriodoFormModalClient periodo={per} triggerText="Editar" variant="outline" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
