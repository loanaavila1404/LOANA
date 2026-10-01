import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { EdicionFormModalClient } from './EdicionFormModalClient';

export const metadata = {
  title: 'Ediciones - ERP Brusben'
};

export default async function EdicionesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const sp = await searchParams;

  const query = sp?.q || '';
  const statusFilter = sp?.status || 'ACTIVO';

  let dbQuery = supabase.from('ediciones').select(`
    *,
    programas(nombre, codigo),
    planes_estudio(nombre, codigo)
  `);

  if (query) {
    dbQuery = dbQuery.or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`);
  }
  if (statusFilter !== 'TODOS') {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  const { data: ediciones } = await dbQuery.order('created_at', { ascending: false });

  // Load catalogs for the modal
  const [{ data: programas }, { data: planes }, { data: periodos }, { data: ciclos }] = await Promise.all([
    supabase.from('programas').select('id, nombre').eq('status', 'ACTIVO').order('nombre'),
    supabase.from('planes_estudio').select('id, nombre, programa_id').eq('status', 'ACTIVO').order('nombre'),
    supabase.from('periodos').select('id, nombre').eq('status', 'ACTIVO').order('fecha_inicio', { ascending: false }),
    supabase.from('ciclos').select('id, nombre, plan_id, numero_orden').eq('status', 'ACTIVO').order('numero_orden'),
  ]);

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

        <EdicionFormModalClient 
          programas={programas || []} 
          planes={planes || []} 
          periodos={periodos || []} 
          ciclos={ciclos || []} 
        />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Plan de Estudio</TableHead>
              <TableHead>Modalidad / Turno</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Vacantes</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!ediciones || ediciones.length === 0) ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No se encontraron ediciones.
                </TableCell>
              </TableRow>
            ) : (
              ediciones.map((edicion) => (
                <TableRow key={edicion.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">
                    <Link href={`/oferta/ediciones/${edicion.id}`} className="text-red-600 hover:underline">
                      {edicion.codigo}
                    </Link>
                  </TableCell>
                  <TableCell>{(edicion as unknown as { programas: { nombre: string } })?.programas?.nombre || '-'}</TableCell>
                  <TableCell>{(edicion as unknown as { planes_estudio: { nombre: string } })?.planes_estudio?.nombre || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{edicion.modalidad || '-'}</span>
                      <span className="text-xs text-slate-500">{edicion.turno || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <span>
                        Inicio: {edicion.fecha_inicio ? new Date(edicion.fecha_inicio).toLocaleDateString('es-PE') : '-'}
                      </span>
                      <span className="text-xs text-slate-500">
                        Fin: {edicion.fecha_fin ? new Date(edicion.fecha_fin).toLocaleDateString('es-PE') : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{edicion.vacantes !== null ? edicion.vacantes : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={edicion.status === 'ACTIVO' ? 'success' : 'default'}>
                      {edicion.status || 'Desconocido'}
                    </Badge>
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
