import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Matrículas y Pagos - ERP Brusben'
};

export default async function MatriculasPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  await requirePermission(['MATRICULAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const sp = await searchParams;

  const query = sp?.q || '';
  const statusFilter = sp?.status || 'ACTIVA';

  let dbQuery = supabase.from('matriculas').select(`
    *,
    estudiantes (codigo_estudiante, personas (nombres, apellido_paterno, apellido_materno, numero_documento)),
    ediciones (codigo, nombre, programas (nombre))
  `);

  if (query) {
    // Para buscar por nombre de estudiante necesitamos unir o usar ilike en el código
    dbQuery = dbQuery.or(`codigo_matricula.ilike.%${query}%`);
    // Ideally we would search by student name via an inner join but supabase postgrest doesn't support or across tables easily without rpc
  }
  if (statusFilter !== 'TODAS') {
    dbQuery = dbQuery.eq('status', statusFilter);
  }

  const { data: matriculas } = await dbQuery.order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por código..."
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
          />
          <select 
            name="status" 
            defaultValue={statusFilter}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="TODAS">Todos los Estados</option>
            <option value="PREMATRICULA">Prematrícula</option>
            <option value="RESERVADA">Reservada</option>
            <option value="ACTIVA">Activa</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="RETIRADA">Retirada</option>
            <option value="ANULADA">Anulada</option>
            <option value="VENCIDA">Vencida</option>
          </select>
          <button type="submit" className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-200">
            Filtrar
          </button>
        </form>

        <Link href="/matriculas/nueva">
          <Button>+ Nueva Matrícula</Button>
        </Link>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>DNI / Código</TableHead>
              <TableHead>Programa / Edición</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!matriculas || matriculas.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No se encontraron matrículas.
                </TableCell>
              </TableRow>
            ) : (
              matriculas.map(m => {
                const est = m.estudiantes as unknown as { codigo_estudiante: string, personas: { nombres: string, apellido_paterno: string, apellido_materno: string, numero_documento: string } };
                const persona = est?.personas;
                const ed = m.ediciones as unknown as { codigo: string, nombre: string, programas: { nombre: string } };
                
                return (
                  <TableRow key={m.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">
                      <Link href={`/matriculas/${m.id}`} className="text-red-600 hover:underline">
                        {m.codigo_matricula}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{persona?.nombres} {persona?.apellido_paterno} {persona?.apellido_materno}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{persona?.numero_documento}</div>
                      <div className="text-xs text-slate-500">{est?.codigo_estudiante || 'Sin código'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{ed?.programas?.nombre || 'Programa'}</div>
                      <div className="text-xs text-slate-500">{ed?.codigo}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        m.status === 'ACTIVA' ? 'success' : 
                        m.status === 'PREMATRICULA' ? 'default' : 
                        m.status === 'RESERVADA' ? 'warning' :
                        (m.status === 'ANULADA' || m.status === 'RETIRADA' || m.status === 'VENCIDA') ? 'danger' : 'default'
                      }>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/matriculas/${m.id}`} className="text-xs text-slate-600 hover:text-red-600 font-medium">
                        Ver Detalles
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
