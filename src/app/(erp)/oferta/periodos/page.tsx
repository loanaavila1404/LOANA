import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { PeriodoFormModalClient } from './PeriodoFormModalClient';

export const metadata = {
  title: 'Periodos - ERP Brusben'
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por código o nombre..."
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
          />
          <select 
            name="status" 
            defaultValue={statusFilter}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
          <button type="submit" className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-200">
            Filtrar
          </button>
        </form>

        <PeriodoFormModalClient />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
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
                  <TableCell className="font-medium text-slate-900">{per.codigo}</TableCell>
                  <TableCell>{per.nombre}</TableCell>
                  <TableCell>{per.fecha_inicio ? new Date(per.fecha_inicio).toLocaleDateString('es-PE') : '-'}</TableCell>
                  <TableCell>{per.fecha_fin ? new Date(per.fecha_fin).toLocaleDateString('es-PE') : '-'}</TableCell>
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
