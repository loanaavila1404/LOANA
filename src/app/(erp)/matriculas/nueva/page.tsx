import { createClient } from '@/lib/supabase/server';
import { requirePermission, isCurrentUserAdvisor } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { MatriculaWizardClient, EstudianteOption, ProspectoOption, EdicionOption } from '@/components/features/matriculas/MatriculaWizardClient';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Asistente de Nueva Matrícula - ERP Brusben',
};

export default async function NuevaMatriculaPage({
  searchParams,
}: {
  searchParams: Promise<{ estudiante_id?: string; persona_id?: string }>;
}) {
  const isAdvisor = await isCurrentUserAdvisor();
  if (isAdvisor) {
    redirect('/matriculas?error=readonly');
  }

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

  const [
    { data: estudiantesRaw },
    { data: prospectosRaw },
    { data: edicionesRaw },
    { data: perfilesRaw },
    { data: matriculasOcupadasRaw },
  ] = await Promise.all([
    supabase
      .from('estudiantes')
      .select(`
        id,
        persona_id,
        codigo_estudiante,
        personas (
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          numero_documento,
          telefono,
          email
        )
      `)
      .eq('status', 'ACTIVO'),
    supabase
      .from('prospectos')
      .select('id, nombres, apellidos, numero_documento, status, email, telefono')
      .not('status', 'eq', 'PERDIDO'),
    supabase
      .from('ediciones')
      .select(`
        id,
        codigo,
        nombre,
        precio_matricula,
        precio_pension,
        numero_pensiones,
        primer_vencimiento,
        frecuencia_meses,
        vacantes,
        turno,
        modalidad,
        programas (
          id,
          nombre,
          codigo
        )
      `)
      .eq('status', 'ACTIVO'),
    supabase.from('profiles').select('id, display_name, role_id'),
    supabase
      .from('matriculas')
      .select('edicion_id')
      .in('status', ['RESERVADA', 'ACTIVA', 'FINALIZADA']),
  ]);

  // Contabilizar vacantes ocupadas por edición
  const vacantesMap: Record<string, number> = {};
  (matriculasOcupadasRaw || []).forEach(m => {
    if (m.edicion_id) {
      vacantesMap[m.edicion_id] = (vacantesMap[m.edicion_id] || 0) + 1;
    }
  });

  const estudiantes = (estudiantesRaw || []).map(e => ({
    ...e,
    personas: Array.isArray(e.personas) ? e.personas[0] : e.personas,
  })) as unknown as EstudianteOption[];

  const prospectos = (prospectosRaw || []) as unknown as ProspectoOption[];

  const ediciones = (edicionesRaw || []).map(ed => ({
    ...ed,
    programas: Array.isArray(ed.programas) ? ed.programas[0] : ed.programas,
    vacantesOcupadas: vacantesMap[ed.id] || 0,
  })) as unknown as EdicionOption[];

  const asesores = (perfilesRaw || []) as { id: string; display_name: string | null }[];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Institucional con Botón Volver */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/matriculas"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs"
            title="Volver a Matrículas"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-[#C4121A] text-[11px] font-bold uppercase tracking-wider mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Admisión e Incorporación Académica</span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              Asistente de Nueva Matrícula
            </h1>
            <p className="text-slate-600 text-xs mt-0.5">
              Flujo guiado de 4 pasos según estándar institucional para inscripción, asignación de aforo y cronograma de pensiones.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Validación Atómica RPC</span>
        </div>
      </div>

      {/* Asistente Interactivo en 4 Pasos */}
      <MatriculaWizardClient
        estudiantes={estudiantes}
        prospectos={prospectos}
        ediciones={ediciones}
        asesores={asesores}
        initialEstudianteId={initialEstudianteId}
        vacantesMap={vacantesMap}
      />
    </div>
  );
}
