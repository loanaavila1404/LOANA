import { createClient } from "@/lib/supabase/server";
import { 
  HorariosManagerClient, 
  EdicionHorarioData, 
  EstudianteHorarioData,
  CursoHorarioData 
} from "@/components/features/horarios/HorariosManagerClient";

export const metadata = {
  title: "Horarios Académicos con Historial Semanal y Cuadrícula Completa - ERP Brusben",
};

export default async function HorariosPage(props: {
  searchParams?: Promise<{ edicionId?: string }>;
}) {
  const supabase = await createClient();
  const searchParams = props.searchParams ? await props.searchParams : {};
  const selectedEdicionId = searchParams?.edicionId;

  // 1. Obtener todas las ediciones con sus programas, periodos, ciclos y horarios asociados
  const { data: edicionesRaw } = await supabase
    .from("ediciones")
    .select(`
      id,
      codigo,
      nombre,
      turno,
      modalidad,
      vacantes,
      fecha_inicio,
      fecha_fin,
      plan_id,
      ciclo_id,
      programas (codigo, nombre, tipo_programa),
      periodos (codigo, nombre),
      ciclos (nombre, numero_orden),
      horarios (
        id,
        edicion_id,
        curso_id,
        dia_semana,
        hora_inicio,
        hora_fin,
        docente,
        ubicacion,
        observaciones,
        status,
        cursos (id, codigo, nombre, creditos, horas_semanales)
      )
    `)
    .order("codigo");

  // 2. Obtener lista de cursos disponibles de la oferta académica
  const { data: cursosRaw } = await supabase
    .from("cursos")
    .select("id, codigo, nombre, creditos, horas_semanales, plan_id, ciclo_id, status")
    .order("codigo");

  // 3. Obtener lista de estudiantes con matrícula para selector personalizado
  const { data: matriculasRaw } = await supabase
    .from("matriculas")
    .select(`
      id,
      codigo_matricula,
      edicion_id,
      estudiantes (
        id,
        codigo_estudiante,
        personas (
          nombres,
          apellido_paterno,
          apellido_materno,
          tipo_documento,
          numero_documento
        )
      )
    `)
    .limit(50);

  // Mapear ediciones al tipo esperado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ediciones: EdicionHorarioData[] = (edicionesRaw || []).map((ed: any) => {
    const prog = Array.isArray(ed.programas) ? ed.programas[0] : ed.programas;
    const per = Array.isArray(ed.periodos) ? ed.periodos[0] : ed.periodos;
    const cic = Array.isArray(ed.ciclos) ? ed.ciclos[0] : ed.ciclos;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const horarios = (ed.horarios || []).map((h: any) => ({
      id: h.id,
      edicion_id: h.edicion_id,
      curso_id: h.curso_id,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      docente: h.docente,
      ubicacion: h.ubicacion,
      observaciones: h.observaciones,
      status: h.status,
      curso: Array.isArray(h.cursos) ? h.cursos[0] : h.cursos,
    }));

    return {
      id: ed.id,
      codigo: ed.codigo,
      nombre: ed.nombre,
      turno: ed.turno,
      modalidad: ed.modalidad,
      vacantes: ed.vacantes,
      fecha_inicio: ed.fecha_inicio,
      fecha_fin: ed.fecha_fin,
      plan_id: ed.plan_id,
      ciclo_id: ed.ciclo_id,
      programa: prog,
      periodo: per,
      ciclo: cic,
      horarios,
    };
  });

  // Mapear cursos disponibles
  const cursosDisponibles: CursoHorarioData[] = (cursosRaw || []).map((c: any) => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    creditos: c.creditos,
    horas_semanales: c.horas_semanales,
    plan_id: c.plan_id,
    ciclo_id: c.ciclo_id,
    status: c.status,
  }));

  // Mapear y deduplicar estudiantes
  const estudianteVistos = new Set<string>();
  const estudiantesDemo: EstudianteHorarioData[] = [];

  for (const m of (matriculasRaw || [])) {
    const est = Array.isArray(m.estudiantes) ? m.estudiantes[0] : m.estudiantes;
    const per = Array.isArray(est?.personas) ? est.personas[0] : est?.personas;
    if (est?.id && per && !estudianteVistos.has(est.id)) {
      estudianteVistos.add(est.id);
      estudiantesDemo.push({
        id: est.id,
        codigoEstudiante: est.codigo_estudiante || "BRU-EST",
        nombreCompleto: `${per.nombres || ""} ${per.apellido_paterno || ""} ${per.apellido_materno || ""}`.trim(),
        tipoDocumento: per.tipo_documento || "DNI",
        numeroDocumento: per.numero_documento || "",
        edicionId: m.edicion_id,
      });
    }
  }

  return (
    <HorariosManagerClient
      ediciones={ediciones}
      cursosDisponibles={cursosDisponibles}
      estudiantesDemo={estudiantesDemo}
      initialEdicionId={selectedEdicionId}
    />
  );
}
