import { createClient } from '@/lib/supabase/server';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NewEdicionButton } from '@/components/features/oferta/NewEdicionButton';
import { Database } from '@/types/database.types';

export const metadata = {
  title: 'Oferta Académica - ERP Brusben',
  description: 'Gestión de la oferta académica',
};

type Edicion = Database['public']['Tables']['ediciones']['Row'];
type Programa = Database['public']['Tables']['programas']['Row'];
type PlanEstudio = Database['public']['Tables']['planes_estudio']['Row'];

type EdicionWithRelations = Edicion & {
  programas: Pick<Programa, 'nombre' | 'codigo'> | null;
  planes_estudio: Pick<PlanEstudio, 'nombre' | 'codigo'> | null;
};

export default async function OfertaPage() {
  const supabase = await createClient();

  // Fetch ediciones joined with programas and planes_estudio
  const { data, error } = await supabase
    .from('ediciones')
    .select(`
      *,
      programas(nombre, codigo),
      planes_estudio(nombre, codigo)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching data:', error);
  }

  const ediciones = (data as unknown as EdicionWithRelations[]) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-graphite-900">Oferta Académica</h1>
          <p className="text-sm text-graphite-500">
            Gestiona los programas, planes de estudio y ediciones.
          </p>
        </div>
        <NewEdicionButton />
      </div>

      <Card className="overflow-hidden">
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
            {ediciones.map((edicion) => (
              <TableRow key={edicion.id}>
                <TableCell className="font-medium">{edicion.codigo}</TableCell>
                <TableCell>
                  {edicion.programas?.nombre || '-'}
                </TableCell>
                <TableCell>
                  {edicion.planes_estudio?.nombre || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{edicion.modalidad || '-'}</span>
                    <span className="text-xs text-graphite-500">{edicion.turno || '-'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    <span>
                      Inicio: {edicion.fecha_inicio ? new Date(edicion.fecha_inicio).toLocaleDateString('es-PE') : '-'}
                    </span>
                    <span className="text-xs text-graphite-500">
                      Fin: {edicion.fecha_fin ? new Date(edicion.fecha_fin).toLocaleDateString('es-PE') : '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{edicion.vacantes !== null ? edicion.vacantes : '-'}</TableCell>
                <TableCell>
                  <Badge variant={edicion.status === 'activo' ? 'success' : 'default'}>
                    {edicion.status || 'Desconocido'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {ediciones.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-graphite-500">
                  No hay ediciones registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
