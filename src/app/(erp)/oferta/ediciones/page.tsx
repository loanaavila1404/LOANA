import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { EdicionFormModalClient } from './EdicionFormModalClient';
import { ArrowLeft, Clock, FileText } from 'lucide-react';

export const metadata = {
  title: 'Ediciones y Grupos Activos - ERP Brusben'
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
    periodos(nombre, codigo),
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
            Ediciones y Grupos Activos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de grupos académicos, fechas de vigencia y aforo de vacantes. La programación de clases se centraliza en el módulo oficial de Horarios.
          </p>
        </div>

        <EdicionFormModalClient 
          programas={programas || []} 
          planes={planes || []} 
          periodos={periodos || []} 
          ciclos={ciclos || []} 
        />
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
              <TableHead className="font-bold text-slate-700">Código / Grupo</TableHead>
              <TableHead className="font-bold text-slate-700">Programa</TableHead>
              <TableHead className="font-bold text-slate-700">Periodo Académico</TableHead>
              <TableHead className="font-bold text-slate-700">Modalidad / Turno</TableHead>
              <TableHead className="font-bold text-slate-700">Fechas</TableHead>
              <TableHead className="font-bold text-slate-700">Vacantes</TableHead>
              <TableHead className="font-bold text-slate-700">Estado</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!ediciones || ediciones.length === 0) ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No se encontraron ediciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              ediciones.map((edicion) => (
                <TableRow key={edicion.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">
                    <Link href={`/oferta/ediciones/${edicion.id}`} className="font-mono font-bold text-[#C4121A] hover:underline block">
                      {edicion.codigo}
                    </Link>
                    <span className="text-xs text-slate-500">{edicion.nombre || 'Grupo Regular'}</span>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {(edicion as unknown as { programas: { nombre: string } })?.programas?.nombre || '-'}
                  </TableCell>
                  <TableCell className="text-slate-700 font-medium">
                    {(edicion as any)?.periodos?.codigo || (edicion as any)?.periodos?.nombre || (edicion as any)?.planes_estudio?.nombre || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-800">{edicion.modalidad || '-'}</span>
                      <span className="text-xs text-slate-500">{edicion.turno || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span>
                        Inicio: {edicion.fecha_inicio ? new Date(edicion.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE') : '-'}
                      </span>
                      <span className="text-slate-500">
                        Fin: {edicion.fecha_fin ? new Date(edicion.fecha_fin + 'T00:00:00').toLocaleDateString('es-PE') : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800">
                    {edicion.vacantes !== null ? edicion.vacantes : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={edicion.status === 'ACTIVO' ? 'success' : 'default'}>
                      {edicion.status || 'Desconocido'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/oferta/ediciones/${edicion.id}`}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                      >
                        Detalle
                      </Link>
                      <Link
                        href={`/horarios?edicionId=${edicion.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#C4121A] text-white text-xs font-bold transition"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Horarios</span>
                      </Link>
                    </div>
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
