import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { RatificacionMatriculasClient } from '@/components/features/matriculas/RatificacionMatriculasClient';
import { getEstudiantesParaRatificacion } from '@/app/actions/matriculas/ratificacion';

export const metadata = {
  title: 'Ratificación y Promoción de Ciclos Académicos - ERP Brusben',
  description: 'Panel de ratificación automática y evaluación de aptos para promoción entre ciclos (I al VI) con control de arrastres.',
};

export default async function RatificacionPage() {
  await requirePermission(['MATRICULAS.VER', 'SISTEMA.ADMINISTRAR']);
  const db = await getSafeDbClient();

  // Consultar estudiantes evaluados para ratificación
  const estudiantes = await getEstudiantesParaRatificacion();

  // Consultar programas y ediciones activas
  const [{ data: programasRaw }, { data: edicionesRaw }] = await Promise.all([
    db.from('programas').select('id, codigo, nombre').order('nombre'),
    db
      .from('ediciones')
      .select(`
        id,
        codigo,
        nombre,
        programa_id,
        ciclo_id,
        ciclos ( id, nombre, numero_orden )
      `)
      .order('codigo'),
  ]);

  const programas = (programasRaw || []).map((p: any) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
  }));

  const ediciones = (edicionesRaw || []).map((ed: any) => ({
    id: ed.id,
    codigo: ed.codigo,
    nombre: ed.nombre,
    programa_id: ed.programa_id,
    ciclo_id: ed.ciclo_id,
    ciclos: Array.isArray(ed.ciclos) ? ed.ciclos[0] : ed.ciclos,
  }));

  return (
    <RatificacionMatriculasClient
      initialEstudiantes={estudiantes}
      programas={programas}
      ediciones={ediciones}
    />
  );
}
