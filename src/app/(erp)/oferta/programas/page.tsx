import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ProgramaFormModalClient } from './ProgramaFormModalClient';

export const metadata = {
  title: 'Programas - ERP Brusben'
};

export default async function ProgramasPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const sp = await searchParams;

  const query = sp?.q || '';
  const statusFilter = sp?.status || 'ACTIVO';

  let dbQuery = supabase
    .from('programas')
    .select('*', { count: 'exact' });

  if (query) {
    dbQuery = dbQuery.or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`);
  }
  if (statusFilter !== 'TODOS') {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  const { data: programas, count } = await dbQuery.order('created_at', { ascending: false });

  // KPIs
  const { count: countActivos } = await supabase.from('programas').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVO');
  const { count: countInactivos } = await supabase.from('programas').select('*', { count: 'exact', head: true }).eq('status', 'INACTIVO');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Programas</p>
            <p className="text-2xl font-bold text-slate-800">{(countActivos || 0) + (countInactivos || 0)}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-green-500">
          <div>
            <p className="text-sm text-slate-500 font-medium">Activos</p>
            <p className="text-2xl font-bold text-slate-800">{countActivos || 0}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-slate-300">
          <div>
            <p className="text-sm text-slate-500 font-medium">Inactivos</p>
            <p className="text-2xl font-bold text-slate-800">{countInactivos || 0}</p>
          </div>
        </Card>
      </div>

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
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
          <button type="submit" className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-200">
            Filtrar
          </button>
        </form>

        <ProgramaFormModalClient />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!programas || programas.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No se encontraron programas.
                </TableCell>
              </TableRow>
            ) : (
              programas.map(prog => (
                <TableRow key={prog.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">{prog.codigo}</TableCell>
                  <TableCell>
                    <Link href={`/oferta/programas/${prog.id}`} className="text-red-600 hover:underline font-medium">
                      {prog.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {prog.tipo_programa ? prog.tipo_programa.replace(/_/g, ' ') : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {prog.duracion_cantidad && prog.duracion_unidad 
                      ? `${prog.duracion_cantidad} ${prog.duracion_unidad}` 
                      : (prog.total_ciclos ? `${prog.total_ciclos} ciclos` : '-')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={prog.status === 'ACTIVO' ? 'success' : 'default'}>
                      {prog.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ProgramaFormModalClient programa={prog} triggerText="Editar" variant="outline" />
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
