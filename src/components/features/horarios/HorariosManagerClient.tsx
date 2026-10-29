"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Printer, 
  Building2, 
  MapPin, 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  CalendarDays, 
  History, 
  Filter, 
  Layers, 
  ChevronRight, 
  Award,
  Sparkles,
  Info,
  Laptop,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { createHorarioAction, deleteHorarioAction } from "@/app/actions/oferta/horarios";

export interface HorarioSesion {
  id: string;
  edicion_id: string;
  curso_id?: string | null;
  dia_semana: string; // 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO'
  hora_inicio: string; // '08:00:00'
  hora_fin: string; // '11:00:00'
  docente?: string | null;
  ubicacion?: string | null;
  observaciones?: string | null;
  status?: string | null;
  semana_especifica?: number | null; // null = todas las semanas del ciclo
  curso?: {
    id: string;
    codigo: string;
    nombre: string;
    creditos?: number | null;
    horas_semanales?: number | null;
  } | null;
}

export interface CursoHorarioData {
  id: string;
  codigo: string;
  nombre: string;
  creditos?: number | null;
  horas_semanales?: number | null;
  plan_id?: string | null;
  ciclo_id?: string | null;
  status?: string | null;
}

export interface EdicionHorarioData {
  id: string;
  codigo: string;
  nombre: string;
  turno?: string | null;
  modalidad?: string | null;
  vacantes?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  plan_id?: string | null;
  ciclo_id?: string | null;
  programa?: {
    codigo: string;
    nombre: string;
    tipo_programa?: string | null;
  } | null;
  ciclo?: {
    nombre: string;
    numero_orden: number;
  } | null;
  periodo?: {
    codigo: string;
    nombre: string;
  } | null;
  horarios: HorarioSesion[];
}

export interface EstudianteHorarioData {
  id: string;
  codigoEstudiante: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  edicionId: string;
}

interface HorariosManagerClientProps {
  ediciones: EdicionHorarioData[];
  cursosDisponibles?: CursoHorarioData[];
  estudiantesDemo?: EstudianteHorarioData[];
  initialEdicionId?: string;
}

const DIAS_SEMANA = [
  { key: "LUNES", label: "LUNES", short: "LUN" },
  { key: "MARTES", label: "MARTES", short: "MAR" },
  { key: "MIERCOLES", label: "MIÉRCOLES", short: "MIÉ" },
  { key: "JUEVES", label: "JUEVES", short: "JUE" },
  { key: "VIERNES", label: "VIERNES", short: "VIE" },
  { key: "SABADO", label: "SÁBADO", short: "SÁB" },
] as const;

// 15 Bloques Horarios de 1 hora: desde 07:00 hasta 22:00
const BLOQUES_HORARIOS = [
  { start: 7, label: "07:00 - 08:00", inicio: "07:00", fin: "08:00" },
  { start: 8, label: "08:00 - 09:00", inicio: "08:00", fin: "09:00" },
  { start: 9, label: "09:00 - 10:00", inicio: "09:00", fin: "10:00" },
  { start: 10, label: "10:00 - 11:00", inicio: "10:00", fin: "11:00" },
  { start: 11, label: "11:00 - 12:00", inicio: "11:00", fin: "12:00" },
  { start: 12, label: "12:00 - 13:00", inicio: "12:00", fin: "13:00" },
  { start: 13, label: "13:00 - 14:00", inicio: "13:00", fin: "14:00" },
  { start: 14, label: "14:00 - 15:00", inicio: "14:00", fin: "15:00" },
  { start: 15, label: "15:00 - 16:00", inicio: "15:00", fin: "16:00" },
  { start: 16, label: "16:00 - 17:00", inicio: "16:00", fin: "17:00" },
  { start: 17, label: "17:00 - 18:00", inicio: "17:00", fin: "18:00" },
  { start: 18, label: "18:00 - 19:00", inicio: "18:00", fin: "19:00" },
  { start: 19, label: "19:00 - 20:00", inicio: "19:00", fin: "20:00" },
  { start: 20, label: "20:00 - 21:00", inicio: "20:00", fin: "21:00" },
  { start: 21, label: "21:00 - 22:00", inicio: "21:00", fin: "22:00" },
];

// Opciones del selector de semanas para trazabilidad e historial
const SEMANAS_HISTORIAL = [
  { id: "TODAS", label: "Régimen Regular Consolidado (Ciclo Completo)", rango: "Ciclo Académico 2026-II", estado: "Vigente" },
  { id: "1", label: "Semana 1: Apertura e Inducción", rango: "03 Nov – 08 Nov 2026", estado: "Completada" },
  { id: "2", label: "Semana 2: Desarrollo Curricular", rango: "10 Nov – 15 Nov 2026", estado: "Completada" },
  { id: "3", label: "Semana 3: Prácticas y Laboratorio", rango: "17 Nov – 22 Nov 2026", estado: "Completada" },
  { id: "4", label: "Semana 4: Evaluaciones Parciales", rango: "24 Nov – 29 Nov 2026", estado: "En Curso" },
  { id: "5", label: "Semana 5: Módulo de Especialización", rango: "01 Dic – 06 Dic 2026", estado: "Programada" },
  { id: "6", label: "Semana 6: Talleres Clínicos", rango: "08 Dic – 13 Dic 2026", estado: "Programada" },
  { id: "7", label: "Semana 7: Cierre y Sustentación", rango: "15 Dic – 20 Dic 2026", estado: "Programada" },
];

const UBICACIONES_PREDEFINIDAS = [
  "Aula 101 - Sede Central Tumbes",
  "Aula 102 - Sede Central Tumbes",
  "Aula 201 - Sede Central Tumbes",
  "Laboratorio Clínico - Tumbes",
  "Aula de Cómputo - Tumbes",
  "Auditorio Central - Tumbes",
  "Aula Virtual / Google Meet"
];

const DOCENTES_SUGERIDOS = [
  "Lic. María Elena Rojas",
  "Dr. Carlos Brusben",
  "Ing. Roberto Seminario",
  "Lic. Patricia Valdivia",
  "Mg. Javier Cornejo"
];

const OPCIONES_HORA_INICIO = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00"
];

const OPCIONES_HORA_FIN = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", 
  "20:00", "21:00", "22:00"
];

export function HorariosManagerClient({
  ediciones,
  cursosDisponibles = [],
  estudiantesDemo = [],
  initialEdicionId,
}: HorariosManagerClientProps) {
  const router = useRouter();

  // Estado sincronizado de ediciones
  const [edicionesState, setEdicionesState] = useState<EdicionHorarioData[]>(ediciones);
  useEffect(() => {
    setEdicionesState(ediciones);
  }, [ediciones]);

  const [selectedEdicionId, setSelectedEdicionId] = useState<string>(
    initialEdicionId || ediciones[0]?.id || ""
  );
  const [selectedSemana, setSelectedSemana] = useState<string>("TODAS");
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string>("TODOS");

  // Estados del Modal para Programar Horario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEdicionId, setModalEdicionId] = useState(initialEdicionId || ediciones[0]?.id || "");
  const [modalCursoId, setModalCursoId] = useState("");
  const [modalDia, setModalDia] = useState("LUNES");
  const [modalHoraInicio, setModalHoraInicio] = useState("08:00");
  const [modalHoraFin, setModalHoraFin] = useState("10:00");
  const [modalDocente, setModalDocente] = useState("");
  const [modalUbicacion, setModalUbicacion] = useState("Aula 101 - Sede Central Tumbes");
  const [modalObservaciones, setModalObservaciones] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Consolidado de todos los cursos disponibles (vía props o extraídos de ediciones)
  const allAvailableCursos = useMemo(() => {
    if (cursosDisponibles && cursosDisponibles.length > 0) {
      return cursosDisponibles;
    }
    const map = new Map<string, CursoHorarioData>();
    for (const ed of edicionesState) {
      for (const h of ed.horarios) {
        if (h.curso && h.curso.id) {
          map.set(h.curso.id, {
            id: h.curso.id,
            codigo: h.curso.codigo,
            nombre: h.curso.nombre,
            creditos: h.curso.creditos,
            horas_semanales: h.curso.horas_semanales
          });
        }
      }
    }
    return Array.from(map.values());
  }, [cursosDisponibles, edicionesState]);

  // Edición activa seleccionada
  const activeEdicion = useMemo(() => {
    return edicionesState.find(e => e.id === selectedEdicionId) || edicionesState[0] || null;
  }, [edicionesState, selectedEdicionId]);

  // Cursos filtrados para la edición seleccionada en el modal
  const cursosParaModalEdicion = useMemo(() => {
    const ed = edicionesState.find(e => e.id === modalEdicionId);
    if (!ed) return allAvailableCursos;
    if (ed.plan_id) {
      const match = allAvailableCursos.filter(c => c.plan_id === ed.plan_id);
      if (match.length > 0) return match;
    }
    return allAvailableCursos;
  }, [allAvailableCursos, edicionesState, modalEdicionId]);

  // Estudiante activo seleccionado
  const activeEstudiante = useMemo(() => {
    if (selectedEstudianteId === "TODOS") return null;
    return estudiantesDemo.find(est => est.id === selectedEstudianteId) || null;
  }, [estudiantesDemo, selectedEstudianteId]);

  // Semana activa del historial
  const activeSemanaObj = useMemo(() => {
    return SEMANAS_HISTORIAL.find(s => s.id === selectedSemana) || SEMANAS_HISTORIAL[0];
  }, [selectedSemana]);

  // Horarios de la edición activa
  const horariosBase = useMemo(() => {
    if (!activeEdicion) return [];
    return activeEdicion.horarios || [];
  }, [activeEdicion]);

  // Abrir modal de creación con parámetros predefinidos
  const handleOpenCreateModal = (dia?: string, horaInicio?: string) => {
    const edId = selectedEdicionId || edicionesState[0]?.id || "";
    setModalEdicionId(edId);
    if (dia) setModalDia(dia);
    if (horaInicio) {
      setModalHoraInicio(horaInicio);
      const startNum = parseInt(horaInicio.split(":")[0], 10);
      const endNum = Math.min(22, startNum + 2);
      setModalHoraFin(endNum < 10 ? `0${endNum}:00` : `${endNum}:00`);
    } else {
      setModalHoraInicio("08:00");
      setModalHoraFin("10:00");
    }

    const targetEd = edicionesState.find(e => e.id === edId);
    let firstCurso = "";
    if (targetEd?.plan_id) {
      const match = allAvailableCursos.find(c => c.plan_id === targetEd.plan_id);
      if (match) firstCurso = match.id;
    }
    if (!firstCurso && allAvailableCursos.length > 0) {
      firstCurso = allAvailableCursos[0].id;
    }
    setModalCursoId(firstCurso);

    setModalDocente("");
    setModalObservaciones("");
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  // Guardar nuevo horario en base de datos
  const handleSubmitHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!modalEdicionId) {
      setModalError("Por favor selecciona un grupo o edición académica.");
      return;
    }
    if (!modalCursoId) {
      setModalError("Por favor selecciona una asignatura o curso para programar.");
      return;
    }
    if (modalHoraFin <= modalHoraInicio) {
      setModalError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("edicion_id", modalEdicionId);
      formData.set("curso_id", modalCursoId);
      formData.set("dia_semana", modalDia);
      formData.set("hora_inicio", modalHoraInicio);
      formData.set("hora_fin", modalHoraFin);
      formData.set("ubicacion", modalUbicacion || "Aula 101 - Sede Central Tumbes");
      formData.set("docente", modalDocente || "Por asignar");
      formData.set("observaciones", modalObservaciones || "");
      formData.set("status", "ACTIVO");

      const result = await createHorarioAction(formData);

      if (result.error) {
        setModalError(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.data) {
        setModalSuccess("¡Horario programado y registrado con éxito!");
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = result.data as any;
        const cursoObj = allAvailableCursos.find(c => c.id === modalCursoId);
        
        const nuevoHorario: HorarioSesion = {
          id: raw.id,
          edicion_id: raw.edicion_id,
          curso_id: raw.curso_id,
          dia_semana: raw.dia_semana,
          hora_inicio: raw.hora_inicio,
          hora_fin: raw.hora_fin,
          docente: raw.docente,
          ubicacion: raw.ubicacion,
          observaciones: raw.observaciones,
          status: raw.status,
          curso: Array.isArray(raw.cursos) ? raw.cursos[0] : (raw.cursos || cursoObj || null)
        };

        setEdicionesState(prev => prev.map(ed => {
          if (ed.id === modalEdicionId) {
            return {
              ...ed,
              horarios: [...ed.horarios, nuevoHorario]
            };
          }
          return ed;
        }));

        if (selectedEdicionId !== modalEdicionId) {
          setSelectedEdicionId(modalEdicionId);
        }

        setTimeout(() => {
          setIsModalOpen(false);
          setIsSubmitting(false);
          setModalSuccess(null);
          router.refresh();
        }, 500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al registrar el horario.";
      setModalError(msg);
      setIsSubmitting(false);
    }
  };

  // Eliminar un bloque de horario
  const handleDeleteHorario = async (horarioId: string) => {
    if (!window.confirm("¿Confirmas la eliminación de este bloque horario de la cuadrícula?")) {
      return;
    }
    setIsDeletingId(horarioId);
    try {
      const res = await deleteHorarioAction(horarioId, selectedEdicionId);
      if (res.error) {
        alert(res.error);
      } else {
        setEdicionesState(prev => prev.map(ed => {
          if (ed.id === selectedEdicionId) {
            return {
              ...ed,
              horarios: ed.horarios.filter(h => h.id !== horarioId)
            };
          }
          return ed;
        }));
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      alert(msg);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Filtrado por historial semanal si la sesión tiene semana_especifica
  const horariosFiltrados = useMemo(() => {
    if (selectedSemana === "TODAS") return horariosBase;
    const semanaNum = parseInt(selectedSemana, 10);
    return horariosBase.filter(h => {
      // Si la sesión no tiene semana_especifica, aplica para todas las semanas
      if (h.semana_especifica === null || h.semana_especifica === undefined) return true;
      return h.semana_especifica === semanaNum;
    });
  }, [horariosBase, selectedSemana]);

  // Función para parsear hora en entero (ej. '09:00:00' -> 9)
  const parseHour = (timeStr?: string | null): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    return parseInt(parts[0], 10) || 0;
  };

  // Construcción de la matriz con mapeo de sesiones
  // Devuelve qué sesión empieza en (hora, dia) y su duración
  const matrizHoraria = useMemo(() => {
    // Mapa: `${dia}_${hora}` -> { sesion, duration, isStart }
    const cellMap: Record<string, { sesion: HorarioSesion; duration: number; isStart: boolean } | null> = {};
    const coveredMap: Record<string, boolean> = {};

    for (const h of horariosFiltrados) {
      const dia = (h.dia_semana || "").toUpperCase().trim();
      const startHour = parseHour(h.hora_inicio);
      const endHour = parseHour(h.hora_fin);

      if (startHour >= 7 && startHour < 22) {
        const duration = Math.max(1, endHour - startHour);
        const startKey = `${dia}_${startHour}`;
        cellMap[startKey] = { sesion: h, duration, isStart: true };

        // Marcar las horas cubiertas siguientes
        for (let nextHour = startHour + 1; nextHour < Math.min(22, startHour + duration); nextHour++) {
          coveredMap[`${dia}_${nextHour}`] = true;
        }
      }
    }

    return { cellMap, coveredMap };
  }, [horariosFiltrados]);

  // Métricas rápidas de la carga horaria
  const metricasHorario = useMemo(() => {
    const totalSesiones = horariosFiltrados.length;
    let totalHoras = 0;
    const cursosSet = new Set<string>();

    for (const h of horariosFiltrados) {
      const startHour = parseHour(h.hora_inicio);
      const endHour = parseHour(h.hora_fin);
      totalHoras += Math.max(1, endHour - startHour);
      if (h.curso?.nombre) cursosSet.add(h.curso.nombre);
    }

    return {
      totalSesiones,
      totalHoras,
      totalCursos: cursosSet.size,
    };
  }, [horariosFiltrados]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 text-slate-800">
      
      {/* ============================================================== */}
      {/* 1. BARRA SUPERIOR DE ACCIONES Y CONTROLES (NO IMPRIMIBLE)       */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm print:hidden no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-50 text-[#c4121a] border border-red-100">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
                  Gestión de Horarios Académicos
                </h1>
                <p className="text-xs text-slate-500">
                  Matriz semanal exhaustiva (07:00 a 22:00 hrs) con historial de semanas y membrete oficial.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenCreateModal()}
              type="button"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Programar Horario</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-[#c4121a] hover:bg-[#a00f15] active:bg-[#850b10] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Horario / Guardar PDF</span>
            </button>
          </div>
        </div>

        {/* Filtros Dinámicos: Grupo / Edición, Historial Semanal y Estudiante */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Selector de Grupo / Edición Académica */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Grupo / Edición Académica</span>
            </label>
            <select
              value={selectedEdicionId}
              onChange={(e) => setSelectedEdicionId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 font-medium"
            >
              {edicionesState.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.codigo} — {ed.nombre} ({ed.programa?.nombre || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Historial Semanal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-rose-600" />
                <span>Historial Semanal / Vigencia</span>
              </span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200">
                {activeSemanaObj.estado}
              </span>
            </label>
            <select
              value={selectedSemana}
              onChange={(e) => setSelectedSemana(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 font-semibold"
            >
              {SEMANAS_HISTORIAL.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.label} ({sem.rango})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Estudiante (Filtro Personalizado) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Vista por Estudiante (Opcional)</span>
            </label>
            <select
              value={selectedEstudianteId}
              onChange={(e) => setSelectedEstudianteId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800"
            >
              <option value="TODOS">Vista General del Grupo / Aula</option>
              {estudiantesDemo.map((est, index) => (
                <option key={`${est.id}-${index}`} value={est.id}>
                  {est.nombreCompleto} ({est.codigoEstudiante} - DNI {est.numeroDocumento})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Resumen de Carga Horaria y Trazabilidad */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span>Carga Semanal: <strong className="text-slate-900">{metricasHorario.totalHoras} hrs pedagógicas</strong></span>
            <span>•</span>
            <span>Sesiones: <strong className="text-slate-900">{metricasHorario.totalSesiones} bloques</strong></span>
            <span>•</span>
            <span>Asignaturas: <strong className="text-slate-900">{metricasHorario.totalCursos} materias</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Régimen: Lunes a Sábado de 07:00 a 22:00</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FORMATO DE IMPRESIÓN Y HOJA A4 OFICIAL DEL HORARIO           */}
      {/* ============================================================== */}
      <div className="horario-pdf-sheet bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-md print:p-0 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
        
        {/* Estilos de Impresión A4 Landscape */}
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4 landscape;
            margin: 8mm 10mm 8mm 10mm;
          }
          @media print {
            html, body {
              background: #ffffff !important;
              font-size: 10px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .horario-pdf-sheet {
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              width: 100% !important;
            }
            table {
              page-break-inside: avoid !important;
            }
          }
        ` }} />

        {/* ============================================================ */}
        {/* MEMBRETE INSTITUCIONAL OFICIAL BRUSBEN (SEDE CENTRAL TUMBES) */}
        {/* ============================================================ */}
        <header className="border-b-[3px] border-[#AD0000] pb-4 mb-4 break-inside-avoid">
          <div className="flex flex-row items-center justify-between gap-4">
            
            {/* Logotipo Oficial y Razón Social */}
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-brusben.png"
                alt="Centro de Capacitaciones Brusben"
                className="h-14 w-auto object-contain shrink-0"
              />
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AD0000]">
                  Sistema ERP Académico Institucional
                </p>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase leading-none">
                  Centro de Capacitaciones Brusben
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Formación Continua, Especialización Profesional y Certificación
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sede Central: Tumbes, Perú · RUC Institucional: 20409499849
                </p>
              </div>
            </div>

            {/* Recuadro de Control y Trazabilidad Documental */}
            <div className="min-w-[240px] border-2 border-slate-800 rounded-lg p-2.5 bg-slate-50 text-right shrink-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#AD0000]">
                HORARIO ACADÉMICO OFICIAL
              </p>
              <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-500">
                CUADRÍCULA SEMANAL DE CLASES
              </p>
              <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
                {activeEdicion?.codigo || "HOR-OFICIAL"}
              </p>
              <div className="mt-1 flex justify-end items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-50 text-[#AD0000] border border-red-200">
                  {activeSemanaObj.label.split(":")[0]}
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {activeSemanaObj.rango}
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* ============================================================ */}
        {/* BLOQUE DE DATOS ACADÉMICOS Y DEL ESTUDIANTE                   */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs break-inside-avoid">
          
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[9.5px] uppercase font-bold text-[#AD0000] block tracking-wider">
              Carrera / Programa
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5 text-xs truncate" title={activeEdicion?.programa?.nombre}>
              {activeEdicion?.programa?.nombre || "Programa Regular"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Código: {activeEdicion?.programa?.codigo || "-"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[9.5px] uppercase font-bold text-[#AD0000] block tracking-wider">
              Edición, Grupo y Ciclo
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5 text-xs truncate">
              {activeEdicion?.nombre || `Grupo ${activeEdicion?.codigo}`}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {activeEdicion?.periodo?.nombre || "2026-II"} • {activeEdicion?.ciclo ? `Ciclo ${activeEdicion.ciclo.numero_orden}` : "Ciclo I"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[9.5px] uppercase font-bold text-[#AD0000] block tracking-wider">
              Modalidad, Turno y Sede
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5 text-xs">
              {activeEdicion?.modalidad || "PRESENCIAL"} / {activeEdicion?.turno || "REGULAR"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-600" />
              Sede Central - Tumbes
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[9.5px] uppercase font-bold text-[#AD0000] block tracking-wider">
              Estudiante / Expediente
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5 text-xs truncate">
              {activeEstudiante ? activeEstudiante.nombreCompleto : "Nómina General del Grupo"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {activeEstudiante ? `${activeEstudiante.tipoDocumento}: ${activeEstudiante.numeroDocumento}` : "Aforo Oficial: " + (activeEdicion?.vacantes || 25) + " vacantes"}
            </p>
          </div>

        </div>

        {/* ============================================================ */}
        {/* CUADRÍCULA HORARIA EXHAUSTIVA (07:00 A 22:00, LUNES A SÁBADO) */}
        {/* ============================================================ */}
        <div className="border-2 border-slate-800 rounded-lg overflow-hidden mb-4 break-inside-avoid shadow-xs">
          <div className="bg-[#181A1F] text-white py-2 px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#c4121a]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Matriz Horaria Semanal Completa — Turnos Mañana, Tarde y Noche
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Vigencia: {activeSemanaObj.label} ({activeSemanaObj.rango})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[9.5px] tracking-wider border-b border-slate-400">
                  <th className="w-[110px] py-2 px-2 text-center border-r border-slate-300 bg-slate-200">
                    Hora / Bloque
                  </th>
                  {DIAS_SEMANA.map((dia) => (
                    <th key={dia.key} className="py-2 px-2 text-center border-r last:border-r-0 border-slate-300">
                      <div>{dia.label}</div>
                      <div className="text-[8.5px] font-normal text-slate-500 lowercase">días lectivos</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {BLOQUES_HORARIOS.map((bloque) => {
                  const hour = bloque.start;

                  return (
                    <tr key={bloque.label} className="hover:bg-slate-50/50">
                      {/* Columna de Bloque Horario */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 bg-slate-50 border-r border-slate-300 text-[10.5px]">
                        {bloque.label}
                      </td>

                      {/* Columnas de Lunes a Sábado */}
                      {DIAS_SEMANA.map((dia) => {
                        const cellKey = `${dia.key}_${hour}`;
                        
                        // Si esta celda está cubierta por un rowSpan superior, no renderizar <td>
                        if (matrizHoraria.coveredMap[cellKey]) {
                          return null;
                        }

                        const startInfo = matrizHoraria.cellMap[cellKey];

                        if (startInfo && startInfo.isStart) {
                          const ses = startInfo.sesion;
                          const duration = startInfo.duration;

                          return (
                            <td
                              key={dia.key}
                              rowSpan={duration}
                              className="p-1.5 border-r last:border-r-0 border-slate-300 align-top bg-red-50/70 border-l-4 border-l-[#c4121a] relative group/cell"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  {ses.curso?.codigo && (
                                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-[#c4121a] text-white">
                                      {ses.curso.codigo}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8.5px] font-bold text-[#c4121a]">
                                      {ses.hora_inicio.slice(0, 5)} - {ses.hora_fin.slice(0, 5)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteHorario(ses.id);
                                      }}
                                      disabled={isDeletingId === ses.id}
                                      className="p-0.5 text-slate-400 hover:text-red-700 hover:bg-white/90 rounded transition print:hidden cursor-pointer"
                                      title="Eliminar este bloque horario"
                                    >
                                      {isDeletingId === ses.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-red-600" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <p className="font-extrabold text-slate-900 text-[11px] leading-tight">
                                  {ses.curso?.nombre || "Asignatura"}
                                </p>

                                <div className="text-[9.5px] text-slate-700 leading-tight">
                                  <span className="font-bold text-slate-500">Docente: </span>
                                  <span className="font-medium">{ses.docente || "Por asignar"}</span>
                                </div>

                                <div className="text-[9.5px] text-slate-600 leading-tight flex items-center justify-between">
                                  <span>Aula: <strong className="text-slate-800">{ses.ubicacion || "Sede Central"}</strong></span>
                                  <span className="text-[8.5px] font-semibold uppercase px-1.5 py-0.2 rounded bg-white border border-slate-200">
                                    {activeEdicion?.modalidad || "Presencial"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Celda vacía
                        return (
                          <td
                            key={dia.key}
                            onClick={() => handleOpenCreateModal(dia.key, bloque.inicio)}
                            className="p-1.5 border-r last:border-r-0 border-slate-200 text-center text-slate-300 hover:text-[#c4121a] hover:bg-red-50/60 cursor-pointer text-[10px] select-none transition group/slot print:cursor-default"
                            title={`Programar horario el ${dia.label} a las ${bloque.label}`}
                          >
                            <span className="group-hover/slot:hidden print:inline">—</span>
                            <span className="hidden group-hover/slot:inline-flex items-center gap-0.5 text-[#c4121a] font-bold text-[9px] print:hidden">
                              <Plus className="w-2.5 h-2.5 inline" /> {bloque.inicio}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RESUMEN DE CONTROL ACADÉMICO Y TRAZABILIDAD                   */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs break-inside-avoid">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">
              Control de Carga Académica
            </span>
            <div className="flex items-center justify-between text-slate-800 font-semibold">
              <span>Horas lectivas semanales:</span>
              <span className="font-mono font-bold text-[#AD0000] text-sm">{metricasHorario.totalHoras} hrs</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 text-[11px] mt-0.5">
              <span>Cursos programados:</span>
              <span className="font-medium">{metricasHorario.totalCursos} materias</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">
              Trazabilidad e Historial Semanal
            </span>
            <div className="flex items-center justify-between text-slate-800 text-[11px]">
              <span>Periodo activo:</span>
              <span className="font-semibold text-slate-900">{activeEdicion?.periodo?.nombre || "2026-II"}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 text-[11px] mt-0.5">
              <span>Vigencia seleccionada:</span>
              <span className="font-bold text-rose-700">{activeSemanaObj.label.split(":")[0]}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">
              Sede e Infraestructura
            </span>
            <div className="text-[11px] text-slate-700">
              <span className="font-bold text-slate-900">Sede Central - Tumbes</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Aulas climatizadas, laboratorios equipados y conectividad institucional.
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FIRMAS Y SELLOS DE CONTROL ACADÉMICO                          */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-dashed border-slate-300 text-center text-xs break-inside-avoid">
          {/* Firma Coordinación Académica */}
          <div className="flex flex-col justify-end">
            <div className="h-12" />
            <div className="border-t border-slate-400 pt-1.5 max-w-[260px] mx-auto w-full">
              <p className="font-bold text-slate-900 uppercase text-xs">
                Coordinación Académica
              </p>
              <p className="text-[9.5px] text-slate-500 font-medium">
                Centro de Capacitaciones Brusben
              </p>
              <p className="text-[8.5px] text-slate-400 uppercase mt-0.5">
                Aprobación y Asignación de Horarios
              </p>
            </div>
          </div>

          {/* Sello y Visto Bueno Dirección General */}
          <div>
            <div className="border-2 border-red-800 bg-red-50/60 rounded-xl p-3 max-w-[260px] mx-auto shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-red-900 font-black text-[10px] uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#AD0000]" />
                <span>Horario Oficial Aprobado</span>
              </div>
              <p className="text-[9.5px] font-bold text-slate-800 mt-0.5 uppercase">
                Centro de Capacitaciones Brusben
              </p>
              <p className="text-[8.5px] text-slate-600 font-mono">
                REF: HOR-{activeEdicion?.codigo} · Tumbes, Perú
              </p>
              <div className="mt-1 pt-1 border-t border-red-200 text-[8.5px] text-red-900 font-semibold uppercase">
                Dirección General Institucional
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PIE DE DOCUMENTO INSTITUCIONAL                                */}
        {/* ============================================================ */}
        <footer className="mt-5 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-slate-400 break-inside-avoid">
          <div>
            <span className="font-bold text-slate-600">CENTRO DE CAPACITACIONES BRUSBEN</span> · Sistema Integrado de Control Académico y Curricular
          </div>
          <div className="font-mono text-slate-500">
            AUT: HOR-2026-TUMBES · RUC: 20409499849
          </div>
        </footer>

      </div>

      {/* ============================================================== */}
      {/* 3. MODAL DE PROGRAMACIÓN DE HORARIO ACADÉMICO (NO IMPRIMIBLE)  */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
          <div 
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-100/80 text-[#c4121a]">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Programar Bloque Horario
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asigna curso, docente, aula y rango horario para la edición activa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario del Modal */}
            <form onSubmit={handleSubmitHorario} className="p-6 space-y-4 overflow-y-auto">
              
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-[#c4121a] shrink-0 mt-0.5" />
                  <div className="leading-snug">{modalError}</div>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{modalSuccess}</div>
                </div>
              )}

              {/* Selector de Edición / Grupo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Grupo / Edición Académica</span>
                </label>
                <select
                  value={modalEdicionId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setModalEdicionId(newId);
                    const targetEd = edicionesState.find(ed => ed.id === newId);
                    if (targetEd?.plan_id) {
                      const match = allAvailableCursos.find(c => c.plan_id === targetEd.plan_id);
                      if (match) setModalCursoId(match.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 font-semibold"
                  required
                >
                  {edicionesState.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.codigo} — {ed.nombre} ({ed.programa?.nombre || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Asignatura / Curso */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#c4121a]" />
                    <span>Asignatura / Curso (Oferta Académica)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cursosParaModalEdicion.length} disponibles
                  </span>
                </label>
                <select
                  value={modalCursoId}
                  onChange={(e) => setModalCursoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-900 font-medium"
                  required
                >
                  <option value="">-- Seleccione una Asignatura --</option>
                  {cursosParaModalEdicion.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.codigo}] {c.nombre} ({c.horas_semanales ?? 0} hrs/sem · {c.creditos ?? 0} cred)
                    </option>
                  ))}
                </select>
                {cursosParaModalEdicion.length === 0 && (
                  <p className="text-[11px] text-amber-600">
                    No se encontraron asignaturas asociadas a este plan. Se mostrarán todos los cursos activos.
                  </p>
                )}
              </div>

              {/* Selector de Día de la Semana */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Día de la Semana</span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {DIAS_SEMANA.map((dia) => {
                    const isSelected = modalDia === dia.key;
                    return (
                      <button
                        key={dia.key}
                        type="button"
                        onClick={() => setModalDia(dia.key)}
                        className={`py-1.5 px-1 text-center rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isSelected
                            ? "bg-[#c4121a] text-white border-[#c4121a] shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {dia.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rango Horario: Inicio y Fin (07:00 a 22:00) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hora de Inicio</span>
                  </label>
                  <select
                    value={modalHoraInicio}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setModalHoraInicio(newStart);
                      const startNum = parseInt(newStart.split(":")[0], 10);
                      const endNum = parseInt(modalHoraFin.split(":")[0], 10);
                      if (endNum <= startNum) {
                        const newEnd = Math.min(22, startNum + 2);
                        setModalHoraFin(newEnd < 10 ? `0${newEnd}:00` : `${newEnd}:00`);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] font-mono font-bold text-slate-800"
                  >
                    {OPCIONES_HORA_INICIO.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora} hrs
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hora de Fin</span>
                  </label>
                  <select
                    value={modalHoraFin}
                    onChange={(e) => setModalHoraFin(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] font-mono font-bold text-slate-800"
                  >
                    {OPCIONES_HORA_FIN.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora} hrs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Indicador de Duración Calculada */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Duración pedagógica calculada:</span>
                <span className="font-bold text-[#c4121a]">
                  {Math.max(0, parseInt(modalHoraFin.split(":")[0], 10) - parseInt(modalHoraInicio.split(":")[0], 10))} horas lectivas
                </span>
              </div>

              {/* Docente Asignado */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Docente Responsable</span>
                </label>
                <input
                  type="text"
                  list="docentes-list"
                  value={modalDocente}
                  onChange={(e) => setModalDocente(e.target.value)}
                  placeholder="Ej. Lic. María Elena Rojas"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800"
                />
                <datalist id="docentes-list">
                  {DOCENTES_SUGERIDOS.map((doc) => (
                    <option key={doc} value={doc} />
                  ))}
                </datalist>
              </div>

              {/* Aula / Ubicación */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Aula / Ubicación (Sede Central Tumbes)</span>
                </label>
                <input
                  type="text"
                  list="aulas-list"
                  value={modalUbicacion}
                  onChange={(e) => setModalUbicacion(e.target.value)}
                  placeholder="Ej. Aula 101 - Sede Central Tumbes"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800"
                />
                <datalist id="aulas-list">
                  {UBICACIONES_PREDEFINIDAS.map((aula) => (
                    <option key={aula} value={aula} />
                  ))}
                </datalist>
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Observaciones adicionales (Opcional)
                </label>
                <input
                  type="text"
                  value={modalObservaciones}
                  onChange={(e) => setModalObservaciones(e.target.value)}
                  placeholder="Ej. Traer mandil clínico / Clase práctica en laboratorio"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800"
                />
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#c4121a] hover:bg-[#a00f15] active:bg-[#850b10] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Guardar y Programar Bloque</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
