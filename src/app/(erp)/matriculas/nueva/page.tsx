import { createClient } from '@/lib/supabase/server';
import { MatriculaFormClient } from './MatriculaFormClient';
import { requirePermission } from '@/lib/auth/permissions';
import Link from 'next/link';

export const metadata = {
  title: 'Nueva Matrícula - ERP Brusben'
};

export default async function NuevaMatriculaPage({
  searchParams,
}: {
  searchParams: Promise<{ estudiante_id?: string; persona_id?: string }>;
}) {
  await requirePermission(['MATRICULAS.GESTIONAR', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedSearch = await searchParams;
  let initialEstudianteId = resolvedSearch?.estudiante_id || '';
  const personaIdParam = resolvedSearch?.persona_id || '';

  // Si se pasó persona_id y aún no tiene registro en estudiantes, crearlo/obtenerlo para que aparezca preseleccionado
  if (!initialEstudianteId && personaIdParam) {
    const { data: existingEst } = await supabase
      .from('estudiantes')
      .select('id')
      .eq('persona_id', personaIdParam)
      .maybeSingle();

    if (existingEst?.id) {
      initialEstudianteId = existingEst.id;
    } else {
      const { data: createdEst } = await supabase
        .from('estudiantes')
        .insert({
          persona_id: personaIdParam,
          codigo_estudiante: null,
          status: 'ACTIVO',
        })
        .select('id')
        .maybeSingle();

      if (createdEst?.id) {
        initialEstudianteId = createdEst.id;
      }
    }
  }

  const [{ data: estudiantes }, { data: prospectos }, { data: ediciones }, { data: perfiles }] =
    await Promise.all([
      supabase
        .from('estudiantes')
        .select(
          'id, persona_id, codigo_estudiante, personas (id, nombres, apellido_paterno, apellido_materno, numero_documento)'
        )
        .eq('status', 'ACTIVO'),
      supabase
        .from('prospectos')
        .select('id, nombres, apellidos, numero_documento, status')
        .not('status', 'eq', 'PERDIDO'),
      supabase
        .from('ediciones')
        .select(
          'id, codigo, nombre, precio_matricula, precio_pension, numero_pensiones, primer_vencimiento, frecuencia_meses, vacantes, programas (nombre)'
        )
        .eq('status', 'ACTIVO'),
      supabase.from('profiles').select('id, display_name, role_id'),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/matriculas" className="text-slate-500 hover:text-slate-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Registrar Nueva Matrícula</h2>
      </div>

      <MatriculaFormClient
        estudiantes={estudiantes || []}
        prospectos={prospectos || []}
        ediciones={ediciones || []}
        asesores={perfiles || []}
        initialEstudianteId={initialEstudianteId}
      />
    </div>
  );
}
