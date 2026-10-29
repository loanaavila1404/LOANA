import { createClient } from "@/lib/supabase/server";
import { 
  NotasManagerClient, 
  ProgramaData, 
  CicloData, 
  CursoData, 
  EdicionData, 
  EstudianteMatriculaData 
} from "@/components/features/notas/NotasManagerClient";

export const metadata = {
  title: "Notas y Registro de Calificaciones Académicas - ERP Brusben",
  description: "Control de libreta de notas, escala vigesimal peruana (0 a 20) y emisión de Boleta Oficial en PDF. Sede Central Tumbes.",
};

export default async function NotasPage() {
  const supabase = await createClient();

  // 1. Obtener programas académicos
  const { data: programasRaw } = await supabase
    .from("programas")
    .select("id, codigo, nombre, tipo_programa")
    .order("nombre");

  // 2. Obtener ciclos académicos
  const { data: ciclosRaw } = await supabase
    .from("ciclos")
    .select("id, nombre, numero_orden")
    .order("numero_orden");

  // 3. Obtener cursos / asignaturas
  const { data: cursosRaw } = await supabase
    .from("cursos")
    .select("id, codigo, nombre, creditos, horas_semanales, plan_id, ciclo_id, status")
    .order("codigo");

  // 4. Obtener ediciones / grupos activos
  const { data: edicionesRaw } = await supabase
    .from("ediciones")
    .select(`
      id,
      codigo,
      nombre,
      turno,
      modalidad,
      vacantes,
      plan_id,
      ciclo_id,
      programa_id,
      programas (codigo, nombre),
      periodos (codigo, nombre),
      ciclos (nombre, numero_orden)
    `)
    .order("codigo");

  // 5. Obtener estudiantes matriculados
  const { data: matriculasRaw } = await supabase
    .from("matriculas")
    .select(`
      id,
      codigo_matricula,
      edicion_id,
      status,
      estudiantes (
        id,
        codigo_estudiante,
        personas (
          nombres,
          apellido_paterno,
          apellido_materno,
          tipo_documento,
          numero_documento,
          email
        )
      )
    `)
    .limit(100);

  // Mapear programas
  const programas: ProgramaData[] = (programasRaw || []).map((p: any) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    tipo_programa: p.tipo_programa,
  }));

  // Mapear y deduplicar ciclos académicos por nombre y número de orden
  const ciclosMap = new Map<string, { id: string; nombre: string; numero_orden: number; matchingIds: string[] }>();

  for (const c of (ciclosRaw || [])) {
    const key = `${(c.nombre || "").trim().toUpperCase()}_${c.numero_orden ?? 0}`;
    if (!ciclosMap.has(key)) {
      ciclosMap.set(key, {
        id: c.id,
        nombre: c.nombre || "Ciclo",
        numero_orden: c.numero_orden ?? 1,
        matchingIds: [c.id],
      });
    } else {
      const entry = ciclosMap.get(key);
      if (entry && !entry.matchingIds.includes(c.id)) {
        entry.matchingIds.push(c.id);
      }
    }
  }

  const ciclos: CicloData[] = Array.from(ciclosMap.values());

  // Mapear cursos
  const cursos: CursoData[] = (cursosRaw || []).map((c: any) => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    creditos: c.creditos || 3,
    horas_semanales: c.horas_semanales || 4,
    plan_id: c.plan_id,
    ciclo_id: c.ciclo_id,
    status: c.status,
  }));

  // Mapear ediciones
  const ediciones: EdicionData[] = (edicionesRaw || []).map((ed: any) => {
    const prog = Array.isArray(ed.programas) ? ed.programas[0] : ed.programas;
    const per = Array.isArray(ed.periodos) ? ed.periodos[0] : ed.periodos;
    const cic = Array.isArray(ed.ciclos) ? ed.ciclos[0] : ed.ciclos;

    return {
      id: ed.id,
      codigo: ed.codigo,
      nombre: ed.nombre,
      programa_id: ed.programa_id,
      plan_id: ed.plan_id,
      ciclo_id: ed.ciclo_id,
      turno: ed.turno,
      modalidad: ed.modalidad,
      vacantes: ed.vacantes,
      programas: prog,
      periodos: per,
      ciclos: cic,
    };
  });

  // Mapear estudiantes matriculados
  const estudiantesMatriculados: EstudianteMatriculaData[] = (matriculasRaw || [])
    .map((m: any) => {
      const est = Array.isArray(m.estudiantes) ? m.estudiantes[0] : m.estudiantes;
      const per = Array.isArray(est?.personas) ? est.personas[0] : est?.personas;
      if (!est || !per) return null;

      const nombreCompleto = `${per.nombres || ""} ${per.apellido_paterno || ""} ${per.apellido_materno || ""}`.trim();
      return {
        matriculaId: m.id,
        estudianteId: est.id,
        codigoMatricula: m.codigo_matricula || `MAT-${est.codigo_estudiante || '2026'}`,
        codigoEstudiante: est.codigo_estudiante || "BRU-2026-000",
        nombreCompleto: nombreCompleto || "Estudiante Brusben",
        tipoDocumento: per.tipo_documento || "DNI",
        numeroDocumento: per.numero_documento || "00000000",
        edicionId: m.edicion_id,
        email: per.email || null,
      };
    })
    .filter(Boolean) as EstudianteMatriculaData[];

  return (
    <NotasManagerClient
      programas={programas}
      ciclos={ciclos}
      cursos={cursos}
      ediciones={ediciones}
      estudiantesMatriculados={estudiantesMatriculados}
    />
  );
}
