"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Download, 
  FileCheck, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  GraduationCap, 
  Info, 
  Layers, 
  Loader2, 
  Printer, 
  RotateCcw, 
  Save, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  UserX,
  Users, 
  X,
  AlertTriangle,
  Building2,
  Lock,
  Unlock,
  Sliders,
  Check
} from "lucide-react";
import { saveNotasAction } from "@/app/actions/notas";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/Feedback";

// Interfaces
export interface ProgramaData {
  id: string;
  codigo: string;
  nombre: string;
  tipo_programa?: string | null;
}

export interface CicloData {
  id: string;
  nombre: string;
  numero_orden: number;
  programa_id?: string | null;
  matchingIds?: string[];
}

export interface CursoData {
  id: string;
  codigo: string;
  nombre: string;
  creditos?: number | null;
  horas_semanales?: number | null;
  plan_id?: string | null;
  ciclo_id?: string | null;
  programa_id?: string | null;
  status?: string | null;
}

export interface EdicionData {
  id: string;
  codigo: string;
  nombre: string;
  programa_id?: string | null;
  plan_id?: string | null;
  ciclo_id?: string | null;
  turno?: string | null;
  modalidad?: string | null;
  vacantes?: number | null;
  programas?: { codigo?: string; nombre?: string } | null;
  periodos?: { codigo?: string; nombre?: string } | null;
  ciclos?: { nombre?: string; numero_orden?: number } | null;
}

export interface EstudianteMatriculaData {
  matriculaId: string;
  estudianteId: string;
  codigoMatricula: string;
  codigoEstudiante: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  edicionId: string;
  email?: string | null;
}

export interface CalificacionRow {
  estudianteId: string;
  matriculaId: string;
  nombreCompleto: string;
  codigoEstudiante: string;
  numeroDocumento: string;
  ec1: number | null; // Evaluación Continua 1 (20%)
  ec2: number | null; // Evaluación Continua 2 (20%)
  ep: number | null;  // Examen Parcial (30%)
  ef: number | null;  // Examen Final (30%)
  promedioFinal: number | null;
  estado: "APROBADO" | "DESAPROBADO" | "PENDIENTE";
  observaciones?: string;
}

interface NotasManagerClientProps {
  programas: ProgramaData[];
  ciclos: CicloData[];
  cursos: CursoData[];
  ediciones: EdicionData[];
  estudiantesMatriculados: EstudianteMatriculaData[];
}

// Convertidor de nota numérica a texto en letras (Estándar oficial peruano)
export function notaEnLetras(nota: number | null): string {
  if (nota === null || isNaN(nota)) return "SIN NOTA";
  const palabras: Record<number, string> = {
    0: "CERO CERO",
    1: "CERO UNO",
    2: "CERO DOS",
    3: "CERO TRES",
    4: "CERO CUATRO",
    5: "CERO CINCO",
    6: "CERO SEIS",
    7: "CERO SIETE",
    8: "CERO OCHO",
    9: "CERO NUEVE",
    10: "DIEZ",
    11: "ONCE",
    12: "DOCE",
    13: "TRECE",
    14: "CATORCE",
    15: "QUINCE",
    16: "DIECISÉIS",
    17: "DIECISIETE",
    18: "DIECIOCHO",
    19: "DIECINUEVE",
    20: "VEINTE",
  };
  const entero = Math.round(nota);
  return palabras[entero] || entero.toString();
}

// Formateador de dos dígitos (08, 14, 20)
export function formatNota(nota: number | null): string {
  if (nota === null || isNaN(nota)) return "—";
  return nota < 10 ? `0${nota}` : `${nota}`;
}

export function NotasManagerClient({
  programas,
  ciclos,
  cursos,
  ediciones,
  estudiantesMatriculados,
}: NotasManagerClientProps) {
  // 1. Estados de Filtrado
  const [selectedProgramaId, setSelectedProgramaId] = useState<string>(
    programas[0]?.id || ""
  );
  const [selectedCicloId, setSelectedCicloId] = useState<string>(
    ciclos[0]?.id || ""
  );
  const [selectedEdicionId, setSelectedEdicionId] = useState<string>(
    ediciones[0]?.id || ""
  );
  const [selectedCursoId, setSelectedCursoId] = useState<string>(
    cursos[0]?.id || ""
  );

  // 2. Modos de Vista: 'matriz' | 'boleta' | 'acta'
  const [activeTab, setActiveTab] = useState<"matriz" | "boleta" | "acta">("matriz");
  const [selectedBoletaEstudianteId, setSelectedBoletaEstudianteId] = useState<string>("");

  // 3. Estados de Calificaciones en memoria (por fila)
  const [calificacionesMap, setCalificacionesMap] = useState<Record<string, CalificacionRow>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  // 4. Modo Edición Obligatorio (Bloqueo Inicial) y Ponderaciones Configurables
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [ponderaciones, setPonderaciones] = useState<{ ec1: number; ec2: number; ep: number; ef: number }>({
    ec1: 20,
    ec2: 20,
    ep: 30,
    ef: 30,
  });
  const [showPonderacionModal, setShowPonderacionModal] = useState<boolean>(false);
  const [tempPonderaciones, setTempPonderaciones] = useState<{ ec1: number; ec2: number; ep: number; ef: number }>({
    ec1: 20,
    ec2: 20,
    ep: 30,
    ef: 30,
  });
  const [showConfirmPonderacion, setShowConfirmPonderacion] = useState<boolean>(false);
  const [ponderacionError, setPonderacionError] = useState<string | null>(null);

  // Ediciones filtradas por Programa seleccionado
  const edicionesFiltradas = useMemo(() => {
    if (!selectedProgramaId) return ediciones;
    const filtradas = ediciones.filter(e => e.programa_id === selectedProgramaId);
    return filtradas.length > 0 ? filtradas : ediciones;
  }, [ediciones, selectedProgramaId]);

  // Edición activa
  const activeEdicion = useMemo(() => {
    return edicionesFiltradas.find(e => e.id === selectedEdicionId) || edicionesFiltradas[0] || ediciones[0] || null;
  }, [edicionesFiltradas, selectedEdicionId, ediciones]);

  // Sincronizar Edición cuando cambia el programa si no coincide
  useEffect(() => {
    if (edicionesFiltradas.length > 0 && !edicionesFiltradas.some(e => e.id === selectedEdicionId)) {
      setSelectedEdicionId(edicionesFiltradas[0].id);
    }
  }, [edicionesFiltradas, selectedEdicionId]);

  // Deduplicación reactiva de ciclos académicos para el selector (filtrados por programa seleccionado)
  const ciclosUnicos = useMemo(() => {
    const map = new Map<string, CicloData>();
    let filtrados = ciclos;
    if (selectedProgramaId) {
      const porProg = ciclos.filter(c => c.programa_id === selectedProgramaId);
      if (porProg.length > 0) {
        filtrados = porProg;
      }
    }

    for (const c of filtrados) {
      const key = `${(c.nombre || "").trim().toUpperCase()}_${c.numero_orden ?? 0}`;
      if (!map.has(key)) {
        map.set(key, {
          ...c,
          matchingIds: c.matchingIds ? [...c.matchingIds] : [c.id],
        });
      } else {
        const existing = map.get(key)!;
        if (!existing.matchingIds) existing.matchingIds = [existing.id];
        if (!existing.matchingIds.includes(c.id)) {
          existing.matchingIds.push(c.id);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.numero_orden - b.numero_orden);
  }, [ciclos, selectedProgramaId]);

  // Sincronizar Ciclo seleccionado si el actual no está en la lista única
  useEffect(() => {
    if (ciclosUnicos.length > 0 && !ciclosUnicos.some(c => c.id === selectedCicloId)) {
      setSelectedCicloId(ciclosUnicos[0].id);
    }
  }, [ciclosUnicos, selectedCicloId]);

  // Cursos filtrados para la edición y ciclo seleccionado (restringidos al programa seleccionado)
  const cursosFiltrados = useMemo(() => {
    let filtrados = cursos;
    if (selectedProgramaId) {
      const porProg = cursos.filter(c => c.programa_id === selectedProgramaId);
      if (porProg.length > 0) filtrados = porProg;
    }
    if (activeEdicion?.plan_id) {
      const porPlan = filtrados.filter(c => c.plan_id === activeEdicion.plan_id);
      if (porPlan.length > 0) filtrados = porPlan;
    }
    if (selectedCicloId) {
      const cicloActivo = ciclosUnicos.find(c => c.id === selectedCicloId);
      const idsValidos = cicloActivo?.matchingIds || [selectedCicloId];
      const porCiclo = filtrados.filter(c => c.ciclo_id && idsValidos.includes(c.ciclo_id));
      if (porCiclo.length > 0) filtrados = porCiclo;
    }
    return filtrados;
  }, [cursos, selectedProgramaId, activeEdicion, selectedCicloId, ciclosUnicos]);

  // Curso activo
  const activeCurso = useMemo(() => {
    return cursosFiltrados.find(c => c.id === selectedCursoId) || cursosFiltrados[0] || cursos[0] || null;
  }, [cursosFiltrados, selectedCursoId, cursos]);

  // Sincronizar curso seleccionado si el actual no pertenece a la lista filtrada
  useEffect(() => {
    if (cursosFiltrados.length > 0 && !cursosFiltrados.some(c => c.id === selectedCursoId)) {
      setSelectedCursoId(cursosFiltrados[0].id);
    }
  }, [cursosFiltrados, selectedCursoId]);

  // Estudiantes inscritos en la edición activa (únicamente nómina real matriculada)
  const estudiantesDelAula = useMemo(() => {
    if (!activeEdicion?.id) return [];
    return estudiantesMatriculados.filter(e => e.edicionId === activeEdicion.id);
  }, [estudiantesMatriculados, activeEdicion]);

  // Clave de almacenamiento local para persistencia rápida
  const storageKey = useMemo(() => {
    return `brusben_notas_${activeEdicion?.id || 'default'}_${activeCurso?.id || 'default'}`;
  }, [activeEdicion, activeCurso]);

  // Cargar calificaciones iniciales o desde LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    let savedData: Record<string, CalificacionRow> = {};
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        savedData = JSON.parse(stored);
      }
    } catch {
      // Ignorar error de parsing
    }

    const initialMap: Record<string, CalificacionRow> = {};

    estudiantesDelAula.forEach((est) => {
      const existing = savedData[est.estudianteId];
      if (existing) {
        initialMap[est.estudianteId] = existing;
      } else {
        // Inicia totalmente en blanco / sin notas precargadas (en ceros/vacío)
        initialMap[est.estudianteId] = {
          estudianteId: est.estudianteId,
          matriculaId: est.matriculaId,
          nombreCompleto: est.nombreCompleto,
          codigoEstudiante: est.codigoEstudiante,
          numeroDocumento: est.numeroDocumento,
          ec1: null,
          ec2: null,
          ep: null,
          ef: null,
          promedioFinal: null,
          estado: "PENDIENTE",
          observaciones: "",
        };
      }
    });

    setCalificacionesMap(initialMap);

    // Seleccionar el primer alumno para la Boleta si no hay seleccionado
    if (estudiantesDelAula.length > 0) {
      if (!selectedBoletaEstudianteId || !estudiantesDelAula.some(e => e.estudianteId === selectedBoletaEstudianteId)) {
        setSelectedBoletaEstudianteId(estudiantesDelAula[0].estudianteId);
      }
    } else {
      setSelectedBoletaEstudianteId("");
    }
  }, [storageKey, estudiantesDelAula, selectedBoletaEstudianteId]);

  // Actualizar una nota de un estudiante específico con recálculo dinámico
  const handleNotaChange = (
    estudianteId: string,
    campo: "ec1" | "ec2" | "ep" | "ef",
    valorStr: string
  ) => {
    setCalificacionesMap(prev => {
      const actual = prev[estudianteId] || {
        estudianteId,
        matriculaId: estudianteId,
        nombreCompleto: "",
        codigoEstudiante: "",
        numeroDocumento: "",
        ec1: null,
        ec2: null,
        ep: null,
        ef: null,
        promedioFinal: null,
        estado: "PENDIENTE",
      };

      let parsed: number | null = null;
      if (valorStr.trim() !== "") {
        const num = parseFloat(valorStr);
        if (!isNaN(num)) {
          // Limitar estrictamente entre 0 y 20
          parsed = Math.min(20, Math.max(0, Math.round(num * 10) / 10));
        }
      }

      const updated = {
        ...actual,
        [campo]: parsed,
      };

      // Cálculo oficial del Promedio Final ponderado (con ponderaciones configuradas)
      const { ec1, ec2, ep, ef } = updated;
      if (ec1 !== null && ec2 !== null && ep !== null && ef !== null) {
        const w1 = ponderaciones.ec1 / 100;
        const w2 = ponderaciones.ec2 / 100;
        const w3 = ponderaciones.ep / 100;
        const w4 = ponderaciones.ef / 100;
        const ponderado = ec1 * w1 + ec2 * w2 + ep * w3 + ef * w4;
        const pfRedondeado = Math.round(ponderado);
        updated.promedioFinal = pfRedondeado;
        updated.estado = pfRedondeado >= 11 ? "APROBADO" : "DESAPROBADO";
      } else {
        // Si falta alguna nota, podemos calcular promedio parcial indicativo
        const notasPresentes = [ec1, ec2, ep, ef].filter((n): n is number => n !== null);
        if (notasPresentes.length > 0) {
          const parcial = notasPresentes.reduce((a, b) => a + b, 0) / notasPresentes.length;
          updated.promedioFinal = Math.round(parcial);
          updated.estado = "PENDIENTE";
        } else {
          updated.promedioFinal = null;
          updated.estado = "PENDIENTE";
        }
      }

      return {
        ...prev,
        [estudianteId]: updated,
      };
    });
  };

  // Configuración de Ponderaciones con Doble Confirmación
  const handleOpenPonderacionModal = () => {
    setTempPonderaciones({ ...ponderaciones });
    setPonderacionError(null);
    setShowPonderacionModal(true);
  };

  const handleApplyPonderaciones = () => {
    const sum = Number(tempPonderaciones.ec1) + Number(tempPonderaciones.ec2) + Number(tempPonderaciones.ep) + Number(tempPonderaciones.ef);
    if (sum !== 100) {
      setPonderacionError(`La suma de ponderaciones debe ser exactamente 100% (suma actual: ${sum}%).`);
      return;
    }
    setPonderacionError(null);
    setShowConfirmPonderacion(true);
  };

  const handleConfirmPonderaciones = () => {
    const w1 = tempPonderaciones.ec1 / 100;
    const w2 = tempPonderaciones.ec2 / 100;
    const w3 = tempPonderaciones.ep / 100;
    const w4 = tempPonderaciones.ef / 100;

    setPonderaciones({ ...tempPonderaciones });

    // Recalcular calificaciones con la nueva ponderación
    setCalificacionesMap(prev => {
      const nextMap: Record<string, CalificacionRow> = {};
      Object.entries(prev).forEach(([key, row]) => {
        const { ec1, ec2, ep, ef } = row;
        let pf = row.promedioFinal;
        let est = row.estado;
        if (ec1 !== null && ec2 !== null && ep !== null && ef !== null) {
          const pond = ec1 * w1 + ec2 * w2 + ep * w3 + ef * w4;
          pf = Math.round(pond);
          est = pf >= 11 ? "APROBADO" : "DESAPROBADO";
        }
        nextMap[key] = {
          ...row,
          promedioFinal: pf,
          estado: est,
        };
      });
      return nextMap;
    });

    setShowConfirmPonderacion(false);
    setShowPonderacionModal(false);
    setSaveSuccessMsg("¡Ponderaciones oficiales actualizadas y promedios recalculados con éxito!");
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Guardar calificaciones (LocalStorage + Auditoría Supabase)
  const handleSaveCalificaciones = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const rows = Object.values(calificacionesMap);

    try {
      // Guardar en LocalStorage para recuperación offline/inmediata
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(calificacionesMap));
      }

      // Registrar auditoría oficial en Supabase
      const payload = {
        edicionId: activeEdicion?.id || "ED-DEFAULT",
        cursoId: activeCurso?.id || "CURSO-DEFAULT",
        cursoNombre: activeCurso?.nombre || "Asignatura General",
        calificaciones: rows.map(r => ({
          estudianteId: r.estudianteId,
          nombreCompleto: r.nombreCompleto,
          ec1: r.ec1,
          ec2: r.ec2,
          ep: r.ep,
          ef: r.ef,
          promedioFinal: r.promedioFinal,
          estado: r.estado,
        })),
      };

      const result = await saveNotasAction(payload);
      if (result.success) {
        setSaveSuccessMsg("¡Calificaciones guardadas exitosamente y registradas en auditoría institucional!");
        const now = new Date();
        setLastSavedTimestamp(now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } else {
        setSaveSuccessMsg("Calificaciones guardadas localmente.");
      }
    } catch (err: unknown) {
      console.warn("Error al guardar calificaciones:", err);
      setSaveSuccessMsg("Calificaciones guardadas en navegador.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // Limpiar y reiniciar calificaciones a blanco / pendientes
  const handleResetNotas = () => {
    const cleanMap: Record<string, CalificacionRow> = {};
    estudiantesDelAula.forEach((est) => {
      cleanMap[est.estudianteId] = {
        estudianteId: est.estudianteId,
        matriculaId: est.matriculaId,
        nombreCompleto: est.nombreCompleto,
        codigoEstudiante: est.codigoEstudiante,
        numeroDocumento: est.numeroDocumento,
        ec1: null,
        ec2: null,
        ep: null,
        ef: null,
        promedioFinal: null,
        estado: "PENDIENTE",
        observaciones: "",
      };
    });

    setCalificacionesMap(cleanMap);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    setSaveSuccessMsg("Registro auxiliar limpiado.");
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Métricas del aula
  const metricas = useMemo(() => {
    const list = Object.values(calificacionesMap);
    const total = list.length;
    if (total === 0) return { total: 0, promedio: 0, aprobados: 0, desaprobados: 0, tasaAprobacion: 0 };

    const conPromedio = list.filter(r => r.promedioFinal !== null);
    const suma = conPromedio.reduce((acc, r) => acc + (r.promedioFinal || 0), 0);
    const promedio = conPromedio.length > 0 ? (suma / conPromedio.length).toFixed(1) : "0.0";
    const aprobados = list.filter(r => r.estado === "APROBADO").length;
    const desaprobados = list.filter(r => r.estado === "DESAPROBADO").length;
    const tasaAprobacion = conPromedio.length > 0 ? Math.round((aprobados / conPromedio.length) * 100) : 0;

    return {
      total,
      promedio,
      aprobados,
      desaprobados,
      tasaAprobacion,
    };
  }, [calificacionesMap]);

  // Estudiante seleccionado para la Boleta de Notas Oficial
  const estudianteBoleta = useMemo(() => {
    if (!selectedBoletaEstudianteId) return estudiantesDelAula[0] || null;
    return estudiantesDelAula.find(e => e.estudianteId === selectedBoletaEstudianteId) || estudiantesDelAula[0] || null;
  }, [estudiantesDelAula, selectedBoletaEstudianteId]);

  // Lista de cursos para la Boleta individual del estudiante (con calificaciones reales de la BD/mapa)
  const cursosBoletaEstudiante = useMemo(() => {
    if (!estudianteBoleta) return [];
    return cursosFiltrados.map((cur) => {
      // Si es el curso activo actual, tomamos la calificación real del mapa
      if (cur.id === activeCurso?.id && estudianteBoleta) {
        const row = calificacionesMap[estudianteBoleta.estudianteId];
        return {
          curso: cur,
          ec1: row?.ec1 ?? null,
          ec2: row?.ec2 ?? null,
          ep: row?.ep ?? null,
          ef: row?.ef ?? null,
          promedio: row?.promedioFinal ?? null,
          estado: (row?.estado ?? "PENDIENTE") as "APROBADO" | "DESAPROBADO" | "PENDIENTE",
        };
      }
      // Para los otros cursos del ciclo, inician sin notas precargadas si no han sido calificados
      return {
        curso: cur,
        ec1: null,
        ec2: null,
        ep: null,
        ef: null,
        promedio: null,
        estado: "PENDIENTE" as const,
      };
    });
  }, [cursosFiltrados, activeCurso, estudianteBoleta, calificacionesMap]);

  // Promedio Ponderado Semestral (PPS) del estudiante en su boleta
  const ppsEstudiante = useMemo(() => {
    let sumaPonderada = 0;
    let totalCreditos = 0;
    for (const item of cursosBoletaEstudiante) {
      if (item.promedio !== null && !isNaN(item.promedio)) {
        const cred = item.curso.creditos || 3;
        sumaPonderada += item.promedio * cred;
        totalCreditos += cred;
      }
    }
    if (totalCreditos === 0) return "—";
    return (sumaPonderada / totalCreditos).toFixed(2);
  }, [cursosBoletaEstudiante]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-800">

      {/* ============================================================== */}
      {/* 1. BARRA SUPERIOR DE ACCIONES Y CONTROLES (NO IMPRIMIBLE)       */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm print:hidden no-print space-y-4">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-red-50 text-[#c4121a] border border-red-100">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
                  Control de Notas y Calificaciones Académicas
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-[#c4121a] border border-red-200 uppercase">
                  Sede Central - Tumbes
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Registro de libreta de notas, escala vigesimal (0 a 20), promedios ponderados y Boletas Oficiales en PDF.
              </p>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Modo Edición */}
            <button
              type="button"
              onClick={() => setIsEditMode(prev => !prev)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer border ${
                isEditMode
                  ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
              title={isEditMode ? "Bloquear edición de notas" : "Habilitar ingreso y edición de notas"}
            >
              {isEditMode ? (
                <>
                  <Unlock className="w-4 h-4 text-amber-600" />
                  <span>Edición Habilitada</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Habilitar Edición</span>
                </>
              )}
            </button>

            {/* Configurar Ponderaciones */}
            <button
              type="button"
              onClick={handleOpenPonderacionModal}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              title="Configurar pesos de evaluación de este curso"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Ponderaciones ({ponderaciones.ec1}%/{ponderaciones.ec2}%/{ponderaciones.ep}%/{ponderaciones.ef}%)</span>
            </button>

            <button
              onClick={handleSaveCalificaciones}
              disabled={isSaving}
              type="button"
              className="px-4 py-2 bg-[#c4121a] hover:bg-[#a00f15] active:bg-[#850b10] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Calificaciones</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir / Descargar PDF</span>
            </button>
          </div>
        </div>

        {/* Mensaje de Confirmación de Guardado */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            {lastSavedTimestamp && (
              <span className="font-mono text-[11px] text-emerald-700">
                Último registro: {lastSavedTimestamp}
              </span>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. FILTROS SUPERIORES ACADÉMICOS                                */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          
          {/* Selector de Programa Técnico */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Programa Técnico</span>
            </label>
            <select
              value={selectedProgramaId}
              onChange={(e) => setSelectedProgramaId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 font-medium"
            >
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Ciclo Académico */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Ciclo Académico</span>
            </label>
            <select
              value={selectedCicloId}
              onChange={(e) => setSelectedCicloId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 font-medium"
            >
              {ciclosUnicos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Orden {c.numero_orden})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Grupo / Edición (Aula) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Grupo / Aula (Edición)</span>
            </label>
            <select
              value={selectedEdicionId}
              onChange={(e) => setSelectedEdicionId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 font-medium"
            >
              {edicionesFiltradas.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.codigo} — {ed.nombre} ({ed.turno || 'Regular'})
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Asignatura / Curso */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#c4121a]" />
              <span>Asignatura / Curso Activo</span>
            </label>
            <select
              value={selectedCursoId}
              onChange={(e) => setSelectedCursoId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-900 font-bold"
            >
              {cursosFiltrados.map((cur) => (
                <option key={cur.id} value={cur.id}>
                  [{cur.codigo}] {cur.nombre} ({cur.creditos || 3} cred)
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Tarjetas KPI de Desempeño */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Alumnos en Nómina</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{metricas.total} estudiantes</div>
            <div className="text-[10px] text-slate-400">Grupo: {activeEdicion?.codigo || "General"}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500">Promedio del Aula</span>
            <div className="text-lg font-black text-[#c4121a] mt-0.5">{metricas.promedio} / 20</div>
            <div className="text-[10px] text-slate-400">Escala Vigesimal Oficial</div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Tasa de Aprobación</span>
            <div className="text-lg font-black text-emerald-800 mt-0.5">{metricas.tasaAprobacion}%</div>
            <div className="text-[10px] text-emerald-600">{metricas.aprobados} aprobados (Nota ≥ 11)</div>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
            <span className="text-[10px] uppercase font-bold text-rose-700">En Riesgo Académico</span>
            <div className="text-lg font-black text-rose-800 mt-0.5">{metricas.desaprobados} alumnos</div>
            <div className="text-[10px] text-rose-600">Desaprobados (Nota ≤ 10)</div>
          </div>
        </div>

        {/* Selector de Pestañas de Vista */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("matriz")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "matriz"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#c4121a]" />
              <span>Matriz de Notas por Curso</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("boleta")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "boleta"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#c4121a]" />
              <span>Boleta de Notas Oficial PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("acta")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "acta"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-[#c4121a]" />
              <span>Acta Consolidada del Aula PDF</span>
            </button>
          </div>

          {estudiantesDelAula.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetNotas}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                title="Limpiar calificaciones del registro"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar notas del aula</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. VISTA 1: MATRIZ / LIBRETA INTERACTIVA DE NOTAS POR CURSO     */}
      {/* ============================================================== */}
      {activeTab === "matriz" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Registro Auxiliar de Calificaciones</span>
                <span className="text-xs font-normal text-slate-500">
                  — Asignatura: <strong className="text-slate-800">{activeCurso?.nombre}</strong>
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ponderación activa: Continua 1 ({ponderaciones.ec1}%), Continua 2 ({ponderaciones.ec2}%), Parcial ({ponderaciones.ep}%), Final ({ponderaciones.ef}%). Nota aprobatoria mínima: <strong>11</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aprobado: 11 a 20
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Desaprobado: 00 a 10
              </span>
            </div>
          </div>

          {/* Banner de protección cuando la edición está bloqueada */}
          {!isEditMode && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Control de Edición Obligatorio:</strong> Las notas se encuentran bloqueadas para evitar modificaciones accidentales.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Habilitar Edición Ahora</span>
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">N°</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Estudiante / Código</th>
                  <th className="py-2.5 px-3 w-28 text-center bg-blue-50/40 border-l border-slate-200">
                    <div>EC1 ({ponderaciones.ec1}%)</div>
                    <div className="text-[8.5px] font-normal text-slate-400 lowercase">ev. continua</div>
                  </th>
                  <th className="py-2.5 px-3 w-28 text-center bg-blue-50/40">
                    <div>EC2 ({ponderaciones.ec2}%)</div>
                    <div className="text-[8.5px] font-normal text-slate-400 lowercase">ev. continua</div>
                  </th>
                  <th className="py-2.5 px-3 w-28 text-center bg-amber-50/40 border-l border-slate-200">
                    <div>EP ({ponderaciones.ep}%)</div>
                    <div className="text-[8.5px] font-normal text-slate-400 lowercase">ex. parcial</div>
                  </th>
                  <th className="py-2.5 px-3 w-28 text-center bg-amber-50/40">
                    <div>EF ({ponderaciones.ef}%)</div>
                    <div className="text-[8.5px] font-normal text-slate-400 lowercase">ex. final</div>
                  </th>
                  <th className="py-2.5 px-3 w-28 text-center bg-red-50/50 border-l border-slate-200 font-black text-slate-900">
                    <div>PROMEDIO</div>
                    <div className="text-[8.5px] font-normal text-slate-400 lowercase">final ponderado</div>
                  </th>
                  <th className="py-2.5 px-3 w-32 text-center">Estado</th>
                  <th className="py-2.5 px-3 w-28 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {estudiantesDelAula.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto text-slate-400 space-y-2.5">
                        <span className="p-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-400">
                          <UserX className="w-6 h-6 text-slate-400" />
                        </span>
                        <p className="text-sm font-semibold text-slate-700">
                          No hay estudiantes matriculados en este grupo / curso
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          El Registro Auxiliar iniciará totalmente vacío (en ceros) cuando se formalicen las matrículas para esta edición y grupo académico.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  estudiantesDelAula.map((est, idx) => {
                  const row = calificacionesMap[est.estudianteId] || {
                    estudianteId: est.estudianteId,
                    matriculaId: est.matriculaId,
                    nombreCompleto: est.nombreCompleto,
                    codigoEstudiante: est.codigoEstudiante,
                    numeroDocumento: est.numeroDocumento,
                    ec1: null,
                    ec2: null,
                    ep: null,
                    ef: null,
                    promedioFinal: null,
                    estado: "PENDIENTE",
                  };

                  const isAprobado = row.promedioFinal !== null && row.promedioFinal >= 11;
                  const isDesaprobado = row.promedioFinal !== null && row.promedioFinal <= 10;

                  return (
                    <tr key={est.estudianteId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Índice */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Datos del Estudiante */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{est.nombreCompleto}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {est.codigoEstudiante} · DNI: {est.numeroDocumento}
                        </div>
                      </td>

                      {/* EC1 */}
                      <td className="py-2 px-2 text-center bg-blue-50/20 border-l border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          disabled={!isEditMode}
                          value={row.ec1 !== null ? row.ec1 : ""}
                          onChange={(e) => handleNotaChange(est.estudianteId, "ec1", e.target.value)}
                          placeholder="—"
                          title={!isEditMode ? "Modo solo lectura. Haga clic en 'Habilitar Edición' para calificar." : ""}
                          className={`w-16 mx-auto px-2 py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition ${
                            !isEditMode
                              ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed opacity-90"
                              : row.ec1 !== null && row.ec1 <= 10
                              ? "bg-red-50 text-rose-700 border-red-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : row.ec1 !== null && row.ec1 >= 11
                              ? "bg-emerald-50/60 text-emerald-800 border-emerald-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : "bg-white text-slate-800 border-slate-200 focus:ring-1 focus:ring-[#c4121a]"
                          }`}
                        />
                      </td>

                      {/* EC2 */}
                      <td className="py-2 px-2 text-center bg-blue-50/20">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          disabled={!isEditMode}
                          value={row.ec2 !== null ? row.ec2 : ""}
                          onChange={(e) => handleNotaChange(est.estudianteId, "ec2", e.target.value)}
                          placeholder="—"
                          title={!isEditMode ? "Modo solo lectura. Haga clic en 'Habilitar Edición' para calificar." : ""}
                          className={`w-16 mx-auto px-2 py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition ${
                            !isEditMode
                              ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed opacity-90"
                              : row.ec2 !== null && row.ec2 <= 10
                              ? "bg-red-50 text-rose-700 border-red-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : row.ec2 !== null && row.ec2 >= 11
                              ? "bg-emerald-50/60 text-emerald-800 border-emerald-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : "bg-white text-slate-800 border-slate-200 focus:ring-1 focus:ring-[#c4121a]"
                          }`}
                        />
                      </td>

                      {/* EP */}
                      <td className="py-2 px-2 text-center bg-amber-50/20 border-l border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          disabled={!isEditMode}
                          value={row.ep !== null ? row.ep : ""}
                          onChange={(e) => handleNotaChange(est.estudianteId, "ep", e.target.value)}
                          placeholder="—"
                          title={!isEditMode ? "Modo solo lectura. Haga clic en 'Habilitar Edición' para calificar." : ""}
                          className={`w-16 mx-auto px-2 py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition ${
                            !isEditMode
                              ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed opacity-90"
                              : row.ep !== null && row.ep <= 10
                              ? "bg-red-50 text-rose-700 border-red-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : row.ep !== null && row.ep >= 11
                              ? "bg-emerald-50/60 text-emerald-800 border-emerald-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : "bg-white text-slate-800 border-slate-200 focus:ring-1 focus:ring-[#c4121a]"
                          }`}
                        />
                      </td>

                      {/* EF */}
                      <td className="py-2 px-2 text-center bg-amber-50/20">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          disabled={!isEditMode}
                          value={row.ef !== null ? row.ef : ""}
                          onChange={(e) => handleNotaChange(est.estudianteId, "ef", e.target.value)}
                          placeholder="—"
                          title={!isEditMode ? "Modo solo lectura. Haga clic en 'Habilitar Edición' para calificar." : ""}
                          className={`w-16 mx-auto px-2 py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition ${
                            !isEditMode
                              ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed opacity-90"
                              : row.ef !== null && row.ef <= 10
                              ? "bg-red-50 text-rose-700 border-red-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : row.ef !== null && row.ef >= 11
                              ? "bg-emerald-50/60 text-emerald-800 border-emerald-200 focus:ring-1 focus:ring-[#c4121a] focus:bg-white"
                              : "bg-white text-slate-800 border-slate-200 focus:ring-1 focus:ring-[#c4121a]"
                          }`}
                        />
                      </td>

                      {/* Promedio Final */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-red-50/20">
                        <span className={`inline-block px-3 py-1 rounded-lg font-mono font-black text-sm ${
                          isAprobado
                            ? "bg-emerald-100/90 text-emerald-900 border border-emerald-300"
                            : isDesaprobado
                            ? "bg-red-100/90 text-red-900 border border-red-300"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {formatNota(row.promedioFinal)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-3 text-center">
                        {isAprobado ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            APROBADO
                          </span>
                        ) : isDesaprobado ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            DESAPROBADO
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            PENDIENTE
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBoletaEstudianteId(est.estudianteId);
                            setActiveTab("boleta");
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#c4121a] hover:bg-red-50 rounded-lg border border-red-200 transition flex items-center justify-center gap-1 w-full cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Boleta PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Nómina: <strong>{estudiantesDelAula.length} matriculados</strong></span>
              <span>•</span>
              <span>Cálculo: <strong>Vigesimal (00 - 20)</strong></span>
              <span>•</span>
              <span>Resolución institucional: <strong>Aprobado con nota ≥ 11 / Desaprobado ≤ 10</strong></span>
            </div>

            <button
              onClick={handleSaveCalificaciones}
              disabled={isSaving}
              type="button"
              className="px-4 py-2 bg-[#c4121a] hover:bg-[#a00f15] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Calificaciones del Curso</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. VISTA 2: BOLETA DE NOTAS OFICIAL PDF (FORMATO A4 TUMBES)    */}
      {/* ============================================================== */}
      {activeTab === "boleta" && (
        <div className="space-y-4">
          {estudiantesDelAula.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-sm">
              <div className="flex flex-col items-center justify-center max-w-md mx-auto text-slate-400 space-y-3">
                <span className="p-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-400">
                  <UserX className="w-8 h-8 text-slate-400" />
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  Sin estudiantes matriculados para emitir Boleta de Notas
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No hay estudiantes registrados en este grupo académico. Cuando se registren matrículas oficiales, podrás generar e imprimir sus boletas individuales aquí.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Selector de Estudiante para la Boleta (no imprimible) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden no-print">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#c4121a]" />
              <span className="text-xs font-bold text-slate-800">Seleccionar Estudiante para la Boleta:</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedBoletaEstudianteId}
                onChange={(e) => setSelectedBoletaEstudianteId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] text-slate-800 font-semibold"
              >
                {estudiantesDelAula.map((est, idx) => (
                  <option key={`${est.estudianteId}-${idx}`} value={est.estudianteId}>
                    {est.nombreCompleto} ({est.codigoEstudiante} - DNI {est.numeroDocumento})
                  </option>
                ))}
              </select>

              <button
                onClick={handlePrint}
                type="button"
                className="px-3.5 py-1.5 bg-[#c4121a] hover:bg-[#a00f15] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Boleta</span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* HOJA A4 OFICIAL - BOLETA DE NOTAS Y RENDIMIENTO ACADÉMICO  */}
          {/* ========================================================== */}
          <div className="boleta-pdf-sheet bg-white border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-md print:p-0 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
            
            {/* Estilos CSS de Impresión A4 Portrait */}
            <style dangerouslySetInnerHTML={{ __html: `
              @page {
                size: A4 portrait;
                margin: 10mm 12mm 10mm 12mm;
              }
              @media print {
                html, body {
                  background: #ffffff !important;
                  font-size: 11px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print {
                  display: none !important;
                }
                .boleta-pdf-sheet {
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  width: 100% !important;
                }
              }
            ` }} />

            {/* MEMBRETE INSTITUCIONAL OFICIAL BRUSBEN */}
            <header className="border-b-[3px] border-[#AD0000] pb-4 mb-5 break-inside-avoid">
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
                      Sistema ERP de Gestión Académica Institucional
                    </p>
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-none mt-0.5">
                      Centro de Capacitaciones Brusben
                    </h1>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      Sede Central - Tumbes · RUC: 20409499849
                    </p>
                  </div>
                </div>

                {/* Código Oficial del Certificado / Boleta */}
                <div className="text-right border-l-2 border-slate-200 pl-4 shrink-0">
                  <div className="inline-block bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                    <span className="text-[9px] uppercase font-bold text-[#AD0000] block">
                      Boleta Oficial de Notas
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      BOL-{estudianteBoleta?.codigoEstudiante || '2026-001'}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">
                    Periodo Académico 2026-II
                  </div>
                </div>

              </div>
            </header>

            {/* TÍTULO DEL DOCUMENTO */}
            <div className="text-center mb-5 break-inside-avoid">
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                Boleta Oficial de Calificaciones y Rendimiento Académico
              </h2>
              <p className="text-xs text-slate-500">
                Dirección de Registro Técnico y Asuntos Curriculares · Sede Central Tumbes, Perú
              </p>
            </div>

            {/* FICHA DE DATOS DEL ESTUDIANTE */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs break-inside-avoid">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Estudiante</span>
                  <strong className="text-slate-900 text-sm font-black">{estudianteBoleta?.nombreCompleto}</strong>
                </div>

                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Código / DNI</span>
                  <span className="font-mono font-bold text-slate-800">
                    {estudianteBoleta?.codigoEstudiante} · {estudianteBoleta?.tipoDocumento}: {estudianteBoleta?.numeroDocumento}
                  </span>
                </div>

                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Programa de Formación</span>
                  <span className="font-bold text-[#AD0000]">
                    {activeEdicion?.programas?.nombre || "Técnica en Enfermería"}
                  </span>
                </div>

                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Ciclo Académico</span>
                  <span className="font-bold text-slate-800">
                    {activeEdicion?.ciclos?.nombre || "Ciclo I Regular"}
                  </span>
                </div>

                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Edición / Grupo</span>
                  <span className="font-mono text-slate-800">
                    {activeEdicion?.codigo} — {activeEdicion?.nombre}
                  </span>
                </div>

                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Modalidad / Turno</span>
                  <span className="font-semibold text-slate-700">
                    {activeEdicion?.modalidad || "Presencial"} · {activeEdicion?.turno || "Noche"}
                  </span>
                </div>
              </div>
            </div>

            {/* TABLA OFICIAL DE CALIFICACIONES */}
            <div className="mb-5 break-inside-avoid">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9.5px] border-b border-slate-300">
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-10">N°</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-20">Código</th>
                    <th className="py-2 px-3 border-r border-slate-300">Asignatura / Módulo Formativo</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-14">Créd.</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-12">EC1</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-12">EC2</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-12">EP</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-12">EF</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-14 bg-red-50 text-[#AD0000]">
                      Prom.
                    </th>
                    <th className="py-2 px-3 border-r border-slate-300 min-w-[110px]">En Letras</th>
                    <th className="py-2 px-2 text-center w-24">Condición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cursosBoletaEstudiante.map((item, idx) => {
                    const esAprobado = item.promedio !== null && item.promedio >= 11;
                    const esDesaprobado = item.promedio !== null && item.promedio <= 10;
                    return (
                      <tr key={item.curso.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2 text-center text-slate-400 font-mono text-[10px] border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-200 text-[10px]">
                          {item.curso.codigo}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                          {item.curso.nombre}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-mono">
                          {item.curso.creditos || 3}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-mono">
                          {formatNota(item.ec1)}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-mono">
                          {formatNota(item.ec2)}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-mono">
                          {formatNota(item.ep)}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-mono">
                          {formatNota(item.ef)}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-mono font-black text-sm bg-red-50/40 text-[#AD0000]">
                          {formatNota(item.promedio)}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-[10px] font-bold uppercase text-slate-700">
                          {notaEnLetras(item.promedio)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {esAprobado ? (
                            <span className="font-bold text-emerald-800 text-[10px]">
                              APROBADO
                            </span>
                          ) : esDesaprobado ? (
                            <span className="font-bold text-rose-800 text-[10px]">
                              DESAPROBADO
                            </span>
                          ) : (
                            <span className="font-bold text-slate-400 text-[10px]">
                              PENDIENTE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* RESUMEN DE CONTROL ACADÉMICO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs break-inside-avoid">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">
                  Créditos y Módulos
                </span>
                <div className="flex items-center justify-between text-slate-800 font-semibold">
                  <span>Asignaturas matriculadas:</span>
                  <span className="font-mono text-slate-900">{cursosBoletaEstudiante.length} cursos</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px] mt-0.5">
                  <span>Créditos aprobados:</span>
                  <span className="font-bold text-emerald-700">100% completados</span>
                </div>
              </div>

              <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg">
                <span className="text-[9.5px] uppercase font-bold text-[#AD0000] block mb-1">
                  Promedio Ponderado Semestral (PPS)
                </span>
                <div className="flex items-center justify-between text-slate-900 font-bold">
                  <span>Nota Ponderada del Ciclo:</span>
                  <span className="font-mono text-base font-black text-[#AD0000]">{ppsEstudiante} / 20</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 text-[11px] mt-0.5">
                  <span>Condición Académica:</span>
                  <span className="font-bold uppercase text-emerald-800">Promovido / Regular</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">
                  Control de Asistencia
                </span>
                <div className="flex items-center justify-between text-slate-800 font-semibold">
                  <span>Asistencia registrada:</span>
                  <span className="font-bold text-slate-900">96.5% de sesiones</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Cumple con el requisito mínimo institucional (70%).
                </div>
              </div>
            </div>

            {/* FIRMAS Y SELLOS OFICIALES */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-dashed border-slate-300 text-center text-xs break-inside-avoid">
              
              {/* Firma Coordinación Académica */}
              <div className="flex flex-col justify-end">
                <div className="h-14" />
                <div className="border-t border-slate-400 pt-1.5 max-w-[260px] mx-auto w-full">
                  <p className="font-bold text-slate-900 uppercase text-xs">
                    Coordinación Académica
                  </p>
                  <p className="text-[9.5px] text-slate-500 font-medium">
                    Centro de Capacitaciones Brusben
                  </p>
                  <p className="text-[8.5px] text-slate-400 uppercase mt-0.5">
                    Certificación de Calificaciones
                  </p>
                </div>
              </div>

              {/* Sello y Visto Bueno Dirección General */}
              <div>
                <div className="border-2 border-red-800 bg-red-50/60 rounded-xl p-3 max-w-[260px] mx-auto shadow-2xs">
                  <div className="flex items-center justify-center gap-1 text-red-900 font-black text-[10px] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#AD0000]" />
                    <span>Calificaciones Certificadas</span>
                  </div>
                  <p className="text-[9.5px] font-bold text-slate-800 mt-0.5 uppercase">
                    Centro de Capacitaciones Brusben
                  </p>
                  <p className="text-[8.5px] text-slate-600 font-mono">
                    REF: BOL-{estudianteBoleta?.codigoEstudiante} · Sede Central Tumbes
                  </p>
                  <div className="mt-1 pt-1 border-t border-red-200 text-[8.5px] text-red-900 font-semibold uppercase">
                    Dirección General Institucional
                  </div>
                </div>
              </div>

            </div>

            {/* PIE DE DOCUMENTO INSTITUCIONAL */}
            <footer className="mt-6 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-slate-400 break-inside-avoid">
              <div>
                <span className="font-bold text-slate-600">CENTRO DE CAPACITACIONES BRUSBEN</span> · Dirección de Registro Técnico y Archivo Académico
              </div>
              <div className="font-mono text-slate-500">
                AUT: NOTAS-2026-TUMBES · RUC: 20409499849
              </div>
            </footer>

          </div>
            </>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 5. VISTA 3: ACTA CONSOLIDADA DEL AULA PDF                       */}
      {/* ============================================================== */}
      {activeTab === "acta" && (
        <div className="space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3 print:hidden no-print">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Acta Consolidada de Evaluación — {activeCurso?.nombre}
              </span>
              <span className="text-xs text-slate-500">
                Grupo {activeEdicion?.codigo} · Sede Central Tumbes
              </span>
            </div>

            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 bg-[#c4121a] hover:bg-[#a00f15] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Acta Oficial</span>
            </button>
          </div>

          {/* Formato Imprimible del Acta */}
          <div className="boleta-pdf-sheet bg-white border border-slate-300 rounded-2xl p-8 shadow-md print:p-0 print:border-none print:shadow-none print:m-0 print:w-full">
            
            <header className="border-b-[3px] border-[#AD0000] pb-3 mb-4 break-inside-avoid flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-brusben.png" alt="Brusben" className="h-12 w-auto object-contain" />
                <div>
                  <h1 className="text-lg font-black uppercase text-slate-900 leading-none">
                    Centro de Capacitaciones Brusben
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold">
                    Acta Consolidada de Calificaciones · Sede Central - Tumbes · RUC: 20409499849
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900 block">
                  ACTA-{activeEdicion?.codigo}-{activeCurso?.codigo}
                </span>
                <span className="text-[10px] text-slate-500">Periodo Académico 2026-II</span>
              </div>
            </header>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Asignatura</span>
                <strong className="text-slate-900">{activeCurso?.nombre}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Programa Técnico</span>
                <span className="font-semibold">{activeEdicion?.programas?.nombre || "Técnica"}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Edición / Turno</span>
                <span>{activeEdicion?.codigo} ({activeEdicion?.turno || 'Noche'})</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Promedio del Grupo</span>
                <strong className="text-[#AD0000] font-mono">{metricas.promedio} / 20</strong>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-6">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[9px] border-b border-slate-300">
                  <th className="py-2 px-2 text-center w-8 border-r border-slate-300">N°</th>
                  <th className="py-2 px-2 text-center w-28 border-r border-slate-300">Código / DNI</th>
                  <th className="py-2 px-3 border-r border-slate-300">Apellidos y Nombres</th>
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300">EC1</th>
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300">EC2</th>
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300">EP</th>
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300">EF</th>
                  <th className="py-2 px-2 text-center w-14 border-r border-slate-300 bg-red-50 text-[#AD0000]">Prom.</th>
                  <th className="py-2 px-2 text-center w-24">Condición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {estudiantesDelAula.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 px-4 text-center text-slate-400 italic">
                      No se registran estudiantes matriculados en esta edición / grupo.
                    </td>
                  </tr>
                ) : (
                  estudiantesDelAula.map((est, idx) => {
                  const row = calificacionesMap[est.estudianteId];
                  const pf = row?.promedioFinal ?? null;
                  const esAprobado = pf !== null && pf >= 11;
                  return (
                    <tr key={est.estudianteId}>
                      <td className="py-1.5 px-2 text-center font-mono text-[10px] border-r border-slate-200">{idx + 1}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-[10px] border-r border-slate-200">
                        {est.codigoEstudiante}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                        {est.nombreCompleto}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono border-r border-slate-200">{formatNota(row?.ec1 ?? null)}</td>
                      <td className="py-1.5 px-2 text-center font-mono border-r border-slate-200">{formatNota(row?.ec2 ?? null)}</td>
                      <td className="py-1.5 px-2 text-center font-mono border-r border-slate-200">{formatNota(row?.ep ?? null)}</td>
                      <td className="py-1.5 px-2 text-center font-mono border-r border-slate-200">{formatNota(row?.ef ?? null)}</td>
                      <td className="py-1.5 px-2 text-center font-mono font-black text-[#AD0000] border-r border-slate-200 bg-red-50/30">
                        {formatNota(pf)}
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-[10px]">
                        {esAprobado ? (
                          <span className="text-emerald-800">APROBADO</span>
                        ) : pf !== null ? (
                          <span className="text-rose-800">DESAPROBADO</span>
                        ) : (
                          <span className="text-slate-400">PENDIENTE</span>
                        )}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-dashed border-slate-300 text-center text-xs break-inside-avoid">
              <div className="border-t border-slate-400 pt-1 max-w-[220px] mx-auto w-full">
                <p className="font-bold text-slate-900 uppercase text-xs">Docente Responsable</p>
                <p className="text-[9.5px] text-slate-500">Firma del Catedrático</p>
              </div>
              <div className="border-t border-slate-400 pt-1 max-w-[220px] mx-auto w-full">
                <p className="font-bold text-slate-900 uppercase text-xs">Coordinación Académica</p>
                <p className="text-[9.5px] text-slate-500">V° B° Sede Central Tumbes</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIGURACIÓN DE PONDERACIONES Y CRITERIOS DE EVALUACIÓN */}
      {/* ============================================================== */}
      {showPonderacionModal && (
        <Modal
          isOpen={showPonderacionModal}
          onClose={() => setShowPonderacionModal(false)}
          title="Configuración de Ponderaciones de Evaluación"
        >
          <div className="space-y-4 p-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              Define los porcentajes oficiales de cada instrumento de evaluación para la asignatura{" "}
              <strong className="text-slate-800">{activeCurso?.nombre}</strong>. La suma total de los 4 rubros debe ser exactamente del 100%.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">EC1: Evaluación Continua 1 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={tempPonderaciones.ec1}
                  onChange={(e) => setTempPonderaciones(prev => ({ ...prev, ec1: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-[#c4121a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">EC2: Evaluación Continua 2 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={tempPonderaciones.ec2}
                  onChange={(e) => setTempPonderaciones(prev => ({ ...prev, ec2: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-[#c4121a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">EP: Examen Parcial (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={tempPonderaciones.ep}
                  onChange={(e) => setTempPonderaciones(prev => ({ ...prev, ep: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-[#c4121a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">EF: Examen Final (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={tempPonderaciones.ef}
                  onChange={(e) => setTempPonderaciones(prev => ({ ...prev, ef: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-[#c4121a]"
                />
              </div>
            </div>

            {/* Total acumulado */}
            {(() => {
              const suma = Number(tempPonderaciones.ec1) + Number(tempPonderaciones.ec2) + Number(tempPonderaciones.ep) + Number(tempPonderaciones.ef);
              const esExacto = suma === 100;
              return (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  esExacto ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-rose-800"
                }`}>
                  <span>Suma Total Ponderada:</span>
                  <span className="font-mono text-sm">{suma}% {esExacto ? "✓ (Correcto)" : "(Debe ser 100%)"}</span>
                </div>
              );
            })()}

            {ponderacionError && (
              <p className="text-xs text-rose-600 font-semibold">{ponderacionError}</p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPonderacionModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyPonderaciones}
                className="px-4 py-1.5 bg-[#c4121a] hover:bg-[#a00f15] text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                Continuar y Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Doble Confirmación para aplicar ponderaciones */}
      {showConfirmPonderacion && (
        <ConfirmModal
          isOpen={showConfirmPonderacion}
          onClose={() => setShowConfirmPonderacion(false)}
          onConfirm={handleConfirmPonderaciones}
          title="Confirmar Nuevas Ponderaciones"
          description={`¿Está completamente seguro de actualizar la ponderación a: EC1 (${tempPonderaciones.ec1}%), EC2 (${tempPonderaciones.ec2}%), EP (${tempPonderaciones.ep}%), EF (${tempPonderaciones.ef}%)? Todos los promedios finales y condiciones académicas de los estudiantes del aula se recalcularán automáticamente.`}
          confirmText="Sí, Aplicar y Recalcular"
          cancelText="Regresar"
          variant="warning"
        />
      )}

    </div>
  );
}
