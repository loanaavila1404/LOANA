import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { HorarioFormModalClient } from './HorarioFormModalClient';

export const metadata = {
  title: 'Detalle de Edición - ERP Brusben'
};

export default async function EdicionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;

  const { data: edicion } = await supabase
    .from('ediciones')
    .select(`
      *,
      programas (nombre, codigo),
      planes_estudio (nombre, codigo),
      periodos (nombre, codigo)
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (!edicion) {
    notFound();
  }

  const { data: horarios } = await supabase
    .from('horarios')
    .select(`
      *,
      cursos (nombre, codigo)
    `)
    .eq('edicion_id', edicion.id)
    .order('created_at', { ascending: false });

  // Load cursos of the plan and cycle
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, codigo')
    .eq('ciclo_id', edicion.ciclo_id || '')
    .eq('status', 'ACTIVO')
    .order('nombre');

  // Render
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/oferta/ediciones" className="text-slate-500 hover:text-slate-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{edicion.nombre || `Edición ${edicion.codigo}`}</h1>
            <Badge variant={edicion.status === 'ACTIVO' ? 'success' : 'default'}>{edicion.status}</Badge>
          </div>
          <p className="text-sm text-slate-500">{(edicion as unknown as { programas: { nombre: string } })?.programas?.nombre || '-'} • {(edicion as unknown as { periodos: { nombre: string } })?.periodos?.nombre || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Información General</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Turno</p>
                  <p className="text-slate-800">{edicion.turno || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Modalidad</p>
                  <p className="text-slate-800">{edicion.modalidad || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Inicio</p>
                  <p className="text-slate-800">{edicion.fecha_inicio ? new Date(edicion.fecha_inicio).toLocaleDateString('es-PE') : '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Fin</p>
                  <p className="text-slate-800">{edicion.fecha_fin ? new Date(edicion.fecha_fin).toLocaleDateString('es-PE') : '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Vacantes</p>
                  <p className="text-slate-800">{edicion.vacantes || '-'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Cursos y horarios</h2>
            <HorarioFormModalClient edicionId={edicion.id} cursos={cursos || []} />
          </div>

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!horarios || horarios.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No hay horarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  horarios.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.dia_semana}</TableCell>
                      <TableCell>{h.hora_inicio} - {h.hora_fin}</TableCell>
                      <TableCell>{(h as unknown as { cursos: { nombre: string } })?.cursos?.nombre || '-'}</TableCell>
                      <TableCell>{h.ubicacion || '-'}</TableCell>
                      <TableCell>{h.docente || '-'}</TableCell>
                      <TableCell className="text-right">
                        <HorarioFormModalClient edicionId={edicion.id} horario={h} cursos={cursos || []} triggerText="Editar" variant="ghost" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
