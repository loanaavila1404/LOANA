import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ProspectoFormModalClient } from './prospectos/ProspectoFormModalClient';

export const metadata = {
  title: 'CRM Comercial - ERP Brusben'
};

export default async function CRMPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  await requirePermission(['CRM.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const sp = await searchParams;

  const query = sp?.q || '';
  const statusFilter = sp?.status || 'NUEVO';

  let dbQuery = supabase.from('prospectos').select(`
    *,
    programas (nombre),
    profiles!prospectos_asesor_id_fkey (nombre, apellido)
  `);

  if (query) {
    dbQuery = dbQuery.or(`nombres.ilike.%${query}%,apellidos.ilike.%${query}%,codigo.ilike.%${query}%,telefono.ilike.%${query}%`);
  }
  if (statusFilter !== 'TODOS') {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  const { data: prospectos } = await dbQuery.order('created_at', { ascending: false });

  const [{ data: programas }, { data: planes }, { data: ediciones }, { data: catalogos }] = await Promise.all([
    supabase.from('programas').select('id, nombre').eq('status', 'ACTIVO').order('nombre'),
    supabase.from('planes_estudio').select('id, nombre, programa_id').eq('status', 'ACTIVO'),
    supabase.from('ediciones').select('id, codigo').eq('status', 'ACTIVO'),
    supabase.from('catalogos_comerciales').select('*').eq('active', true),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-500">Nuevos (Mes)</p>
          <p className="text-2xl font-bold text-slate-900">-</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-500">En Seguimiento</p>
          <p className="text-2xl font-bold text-slate-900">-</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-500">Conversiones (Mes)</p>
          <p className="text-2xl font-bold text-slate-900">-</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-500">Tasa de Conversión</p>
          <p className="text-2xl font-bold text-slate-900">-</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar prospecto..."
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
          />
          <select 
            name="status" 
            defaultValue={statusFilter}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="NUEVO">Nuevos</option>
            <option value="SEGUIMIENTO">En Seguimiento</option>
            <option value="ENTREVISTA">Entrevista</option>
            <option value="MATRICULADO">Matriculados (Convertidos)</option>
            <option value="PERDIDO">Perdidos</option>
          </select>
          <button type="submit" className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-200">
            Filtrar
          </button>
        </form>

        <ProspectoFormModalClient 
          programas={programas || []}
          planes={planes || []}
          ediciones={ediciones || []}
          catalogos={catalogos || []}
        />
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Prospecto</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Interés</TableHead>
              <TableHead>Asesor</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!prospectos || prospectos.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No se encontraron prospectos.
                </TableCell>
              </TableRow>
            ) : (
              prospectos.map(p => (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">
                    <Link href={`/crm/prospectos/${p.id}`} className="text-red-600 hover:underline">
                      {p.codigo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.nombres} {p.apellidos}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{p.telefono}</div>
                    <div className="text-xs text-slate-500">{p.email || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{(p as unknown as { programas: { nombre: string } })?.programas?.nombre || 'General'}</div>
                    <div className="text-xs text-slate-500">Nivel: {p.nivel_interes || '-'}</div>
                  </TableCell>
                  <TableCell>
                    {(p as unknown as { profiles: { nombre: string, apellido: string } })?.profiles 
                      ? `${(p as unknown as { profiles: { nombre: string, apellido: string } }).profiles.nombre} ${(p as unknown as { profiles: { nombre: string, apellido: string } }).profiles.apellido}`
                      : 'Sin asignar'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      p.status === 'NUEVO' ? 'default' : 
                      p.status === 'MATRICULADO' ? 'success' : 
                      p.status === 'PERDIDO' ? 'destructive' : 'outline'
                    }>
                      {p.status}
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
