"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  FileText,
  IdCard,
  ShieldCheck,
  Building2,
  GraduationCap,
  Wallet,
  FileCheck2,
  Printer,
  ExternalLink,
  PlusCircle,
  QrCode,
  X,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PersonaFormModal } from "@/components/features/personas/PersonaFormModal";
import { ConvertirEstudianteForm } from "@/components/features/personas/ConvertirEstudianteForm";
import { TogglePersonaStatusButton } from "@/components/features/personas/TogglePersonaStatusButton";
import { DocumentoRequisitoItem } from "@/lib/utils/personaUtils";
import { eliminarPersonaEstudianteAction } from "@/app/actions/personas";
import { KardexAcademicoView } from "@/components/features/personas/KardexAcademicoView";
import { buildKardexEstudiante } from "@/lib/academic/arrastres";

interface Persona360ClientProps {
  persona: any;
  estudiante: any;
  isEstudiante: boolean;
  canEdit: boolean;
  matriculas: any[];
  matriculaPrincipal: any;
  edicionPrincipal: any;
  programaPrincipal: any;
  planPrincipal: any;
  cicloPrincipal: any;
  periodoPrincipal: any;
  cuotas: any[];
  pagos: any[];
  integridad: {
    completo: boolean;
    mensaje: string;
    faltantes: string[];
    porcentaje: number;
    conformes: number;
    totalRequisitos: number;
    requisitos: DocumentoRequisitoItem[];
  };
  initials: string;
}

export function Persona360Client({
  persona,
  estudiante,
  isEstudiante,
  canEdit,
  matriculas,
  matriculaPrincipal,
  edicionPrincipal,
  programaPrincipal,
  planPrincipal,
  cicloPrincipal,
  periodoPrincipal,
  cuotas,
  pagos,
  integridad,
  initials,
}: Persona360ClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "documentos" | "financiero" | "academico" | "kardex"
  >(isEstudiante ? "kardex" : "documentos");
  const [showCarnetModal, setShowCarnetModal] = useState(false);

  // Estado para el flujo de doble confirmación de eliminación / baja
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPendingDelete, startTransitionDelete] = useTransition();

  // Cálculos financieros reales sobre cuotas y pagos
  const cuotasActivas = cuotas.filter(
    c => (c.status || "").toUpperCase() !== "ANULADA"
  );
  const totalComprometido = cuotasActivas.reduce(
    (acc, c) => acc + Number(c.importe_neto || c.importe_original || 0),
    0
  );
  const saldoPendienteTotal = cuotasActivas.reduce((acc, c) => {
    const st = (c.status || "").toUpperCase();
    if (st === "PAGADA") return acc;
    const s =
      c.saldo !== null && c.saldo !== undefined
        ? Number(c.saldo)
        : Number(c.importe_neto || 0);
    return acc + Math.max(0, s);
  }, 0);
  const totalAmortizado = Math.max(0, totalComprometido - saldoPendienteTotal);
  const porcentajeAmortizado =
    totalComprometido > 0
      ? Math.min(100, Math.round((totalAmortizado / totalComprometido) * 100))
      : 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const cuotasPendientes = cuotasActivas.filter(c => {
    const st = (c.status || "").toUpperCase();
    return st === "PENDIENTE" || st === "PARCIAL" || st === "VENCIDA";
  });
  const cuotasVencidas = cuotasPendientes.filter(
    c => c.fecha_vencimiento && c.fecha_vencimiento < todayIso
  );

  // URL de nueva matrícula con preselección automática del estudiante
  const nuevaMatriculaUrl = `/matriculas/nueva?${new URLSearchParams({
    ...(estudiante?.id ? { estudiante_id: estudiante.id } : {}),
    persona_id: persona.id,
  }).toString()}`;



  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (deleteConfirmText.trim().toUpperCase() !== "ELIMINAR") {
      setDeleteError('Por favor escriba exactamente la palabra "ELIMINAR" para confirmar.');
      return;
    }

    startTransitionDelete(async () => {
      const res = await eliminarPersonaEstudianteAction(persona.id, deleteConfirmText);
      if (!res.success) {
        setDeleteError(res.message || "No se pudo eliminar el registro.");
      } else {
        setDeleteStep(0);
        router.push("/personas");
        router.refresh();
      }
    });
  };

  const nombreCompleto = `${persona.nombres || ""} ${persona.apellido_paterno || ""} ${
    persona.apellido_materno || ""
  }`.trim();
  const codigoEstudiantil =
    estudiante?.codigo_estudiante || (isEstudiante ? "EST-EN-PROCESO" : "SIN-CODIGO");
  const codigoMatricula = matriculaPrincipal?.codigo_matricula || "SIN MATRÍCULA";
  const nombrePrograma =
    programaPrincipal?.nombre ||
    persona.prospecto_vinculado?.programas?.nombre ||
    "Programa Académico General";
  const kardex = React.useMemo(() => {
    return buildKardexEstudiante({
      estudiante,
      programaNombre: nombrePrograma,
      matriculas,
    });
  }, [estudiante, nombrePrograma, matriculas]);
  const sedeUbicacion = persona.distrito
    ? `Sede Central · ${persona.distrito}`
    : "Sede Central Brusben";

  return (
    <div className="space-y-6">
      {/* 1. CABECERA DE PERFIL 360° */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#C4121A]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          {/* Identidad Principal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#181A1F] border-2 border-[#C4121A]/30 flex items-center justify-center text-2xl font-extrabold text-white shadow-sm shrink-0">
              {initials}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
                  {nombreCompleto}
                </h1>

                {/* Estado de persona / matrícula */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    (persona.status || "ACTIVO").toUpperCase() === "ACTIVO"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {matriculaPrincipal?.status
                    ? `Matrícula ${matriculaPrincipal.status}`
                    : persona.status || "ACTIVO"}
                </span>

                {isEstudiante && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#C4121A] border border-red-200 font-mono">
                    {codigoEstudiantil}
                  </span>
                )}
              </div>

              {/* Programa e Identificadores */}
              <p className="text-sm font-semibold text-slate-700 flex flex-wrap items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#C4121A] shrink-0" />
                <span>{nombrePrograma}</span>
                {matriculaPrincipal && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      Ficha: {codigoMatricula}
                    </span>
                  </>
                )}
              </p>

              {/* Metadatos verificados: DNI, Teléfono, Correo */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-0.5">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>{persona.tipo_documento || "DNI"}:</strong>{" "}
                  <span className="font-mono">{persona.numero_documento}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                    Verificado
                  </span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{persona.telefono || "Sin teléfono"}</span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{persona.email || "Sin correo registrado"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción Rápida 360° */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end print:hidden no-print">
            {/* 1. Enlace centralizado a Matrículas y Pagos */}
            <Link
              href={
                matriculaPrincipal
                  ? `/matriculas/${matriculaPrincipal.id}`
                  : nuevaMatriculaUrl
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold shadow-xs transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {matriculaPrincipal
                  ? "Gestionar en Matrículas y Pagos"
                  : "Nueva Matrícula"}
              </span>
            </Link>

            {/* 2. Editar datos */}
            {canEdit && (
              <PersonaFormModal
                initialData={{
                  ...persona,
                  es_estudiante: isEstudiante,
                  observaciones: estudiante?.observaciones || "",
                }}
              />
            )}

            {/* 3. Constancia PDF */}
            {matriculaPrincipal ? (
              <Link
                href={`/matriculas/${matriculaPrincipal.id}/ficha`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                <FileText className="w-3.5 h-3.5 text-[#C4121A]" />
                <span>Constancia PDF</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                <Printer className="w-3.5 h-3.5 text-[#C4121A]" />
                <span>Constancia PDF</span>
              </button>
            )}

            {/* 4. Carné digital */}
            <button
              type="button"
              onClick={() => setShowCarnetModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              <IdCard className="w-3.5 h-3.5 text-red-400" />
              <span>Carné digital</span>
            </button>

            {/* 5. Eliminar / Dar de baja estudiante (Doble confirmación) */}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteConfirmText("");
                  setDeleteStep(1);
                }}
                title="Eliminar o dar de baja estudiante"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 text-xs font-bold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE RESUMEN TÉCNICO E INSTITUCIONAL (4 TARJETAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Tarjeta 1: Sede y Ubicación Técnica */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sede y Ubicación Técnica
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-extrabold text-slate-900 truncate">{sedeUbicacion}</p>
          <div className="text-xs text-slate-600 space-y-0.5">
            <p>
              Modalidad:{" "}
              <strong className="text-slate-800">
                {edicionPrincipal?.modalidad || "PRESENCIAL"}
              </strong>{" "}
              · Turno:{" "}
              <strong className="text-slate-800">
                {edicionPrincipal?.turno || "Regular"}
              </strong>
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {persona.direccion || "Dirección en actualización"}
            </p>
          </div>
        </div>

        {/* Tarjeta 2: Ciclo y Plan Formativo */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ciclo y Plan Formativo
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-extrabold text-slate-900 truncate">
            {cicloPrincipal?.nombre ||
              matriculaPrincipal?.ciclo_ingreso ||
              "Ciclo I - Inicial"}
          </p>
          <div className="text-xs text-slate-600 space-y-0.5">
            <p className="truncate">
              Plan:{" "}
              <strong className="text-slate-800">
                {planPrincipal?.nombre || planPrincipal?.codigo || "Plan Curricular Vigente"}
              </strong>
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              Edición: {edicionPrincipal?.codigo || "Por asignar"} · Periodo:{" "}
              {periodoPrincipal?.codigo || "2026"}
            </p>
          </div>
        </div>

        {/* Tarjeta 3: Estado de Cuenta / Pagos Actual */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estado de Cuenta Actual
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-lg font-extrabold text-slate-900">
              S/ {saldoPendienteTotal.toFixed(2)}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                cuotasVencidas.length > 0
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : saldoPendienteTotal === 0 && totalComprometido > 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-sky-50 text-sky-700 border-sky-200"
              }`}
            >
              {cuotasVencidas.length > 0
                ? `${cuotasVencidas.length} vencida(s)`
                : saldoPendienteTotal === 0 && totalComprometido > 0
                  ? "Pagado 100%"
                  : "Al día"}
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-0.5">
            <p>
              Amortizado:{" "}
              <strong className="text-emerald-700">
                S/ {totalAmortizado.toFixed(2)}
              </strong>{" "}
              de S/ {totalComprometido.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500">
              {porcentajeAmortizado}% del compromiso financiero cubierto
            </p>
          </div>
        </div>

        {/* Tarjeta 4: Semáforo Documental */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Semáforo Documental
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                integridad.completo
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-extrabold text-slate-900">
              {integridad.conformes}/{integridad.totalRequisitos} Conformes
            </p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                integridad.completo
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  integridad.completo ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {integridad.porcentaje}%
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  integridad.completo ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${integridad.porcentaje}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 truncate">{integridad.mensaje}</p>
          </div>
        </div>
      </div>

      {/* 3. SECCIONES DE PESTAÑAS INTERACTIVAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:hidden">
        {/* Barra de Pestañas */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("documentos")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === "documentos"
                  ? "border-[#C4121A] text-[#C4121A] bg-white rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Matriz de Validación Documental</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {integridad.conformes}/{integridad.totalRequisitos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("financiero")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === "financiero"
                  ? "border-[#C4121A] text-[#C4121A] bg-white rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Estado Financiero y Cobranzas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {cuotasActivas.length} cuotas
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("academico")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === "academico"
                  ? "border-[#C4121A] text-[#C4121A] bg-white rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Expediente Personal y Matrículas ({matriculas.length})</span>
            </button>

            {isEstudiante && (
              <button
                type="button"
                onClick={() => setActiveTab("kardex")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                  activeTab === "kardex"
                    ? "border-[#C4121A] text-[#C4121A] bg-white rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Award className="w-4 h-4 text-[#C4121A]" />
                <span>Kardex Académico (Ciclos I - VI)</span>
                {kardex.totalArrastresActivos > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      kardex.condicion === "BLOQUEADO_TRES_ARRASTRES"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {kardex.totalArrastresActivos}{" "}
                    {kardex.totalArrastresActivos === 1 ? "arrastre" : "arrastres"}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    PPA: {kardex.promedioPonderadoAcumulado.toFixed(1)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑA 1: MATRIZ DE VALIDACIÓN DOCUMENTAL */}
        {activeTab === "documentos" && (
          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Control de Requisitos Documentales del Estudiante
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Verificación de identidad (DNI), fichas de matrícula firmadas, datos de localización y certificados de estudios.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <PersonaFormModal
                    initialData={{
                      ...persona,
                      es_estudiante: isEstudiante,
                      observaciones: estudiante?.observaciones || "",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Documento / Requisito Institucional</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3">Carácter</th>
                    <th className="py-3 px-3">Detalle de Verificación</th>
                    <th className="py-3 px-4 text-right">Estado Semáforo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {integridad.requisitos.map(req => (
                    <tr key={req.codigo} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {req.codigo}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {req.nombre}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {req.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {req.obligatorio ? "Obligatorio" : "Complementario"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{req.detalle}</td>
                      <td className="py-3.5 px-4 text-right">
                        {req.conforme ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            CONFORME
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            {req.estado}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENIDO DE PESTAÑA 2: ESTADO FINANCIERO Y COBRANZAS */}
        {activeTab === "financiero" && (
          <div className="p-6 space-y-6">
            {/* Barra de Progreso de Pagos Amortizados */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Progreso de Pagos Amortizados
                  </h3>
                  <p className="text-xs text-slate-600">
                    Avance de recaudación sobre las cuotas emitidas del estudiante
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-extrabold text-[#C4121A]">
                    {porcentajeAmortizado}% Amortizado
                  </span>
                  {matriculaPrincipal ? (
                    <Link
                      href={`/matriculas/${matriculaPrincipal.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Gestionar en Matrículas</span>
                    </Link>
                  ) : (
                    <Link
                      href={nuevaMatriculaUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Nueva Matrícula</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${porcentajeAmortizado}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block">
                    Total Comprometido
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    S/ {totalComprometido.toFixed(2)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block">
                    Total Pagado / Amortizado
                  </span>
                  <span className="text-base font-extrabold text-emerald-700">
                    S/ {totalAmortizado.toFixed(2)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block">
                    Saldo Pendiente Actual
                  </span>
                  <span className="text-base font-extrabold text-[#C4121A]">
                    S/ {saldoPendienteTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cronograma de Cuotas */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Cronograma de Cuotas y Pensiones ({cuotasActivas.length})
              </h4>

              {cuotasActivas.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                  El estudiante aún no registra cuotas generadas. Puede generar su matrícula desde el módulo de Matrículas.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4"># / Tipo</th>
                        <th className="py-3 px-4">Concepto</th>
                        <th className="py-3 px-3">Vencimiento</th>
                        <th className="py-3 px-3 text-right">Importe Neto</th>
                        <th className="py-3 px-3 text-right">Saldo Pendiente</th>
                        <th className="py-3 px-4 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cuotasActivas.map(c => {
                        const st = (c.status || "PENDIENTE").toUpperCase();
                        const saldo =
                          c.saldo !== null && c.saldo !== undefined
                            ? Number(c.saldo)
                            : st === "PAGADA"
                              ? 0
                              : Number(c.importe_neto || 0);
                        const isOverdue =
                          st !== "PAGADA" &&
                          c.fecha_vencimiento &&
                          c.fecha_vencimiento < todayIso;

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              {c.tipo_cuota === "MATRICULA"
                                ? "MATRÍCULA"
                                : `CUOTA ${c.numero_cuota || ""}`}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {c.concepto || c.tipo_cuota}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-mono">
                              {c.fecha_vencimiento || "—"}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-800">
                              S/ {Number(c.importe_neto || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              S/ {saldo.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  st === "PAGADA"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : isOverdue
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                              >
                                {st === "PAGADA" ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                {isOverdue ? "VENCIDA" : st}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Historial de Pagos Realizados */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Historial de Pagos y Abonos Registrados ({pagos.length})
              </h4>

              {pagos.length === 0 ? (
                <div className="p-6 text-center border border-slate-200 rounded-xl text-slate-500 text-xs">
                  No se registran pagos aplicados hasta la fecha.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Código Pago</th>
                        <th className="py-3 px-3">Fecha</th>
                        <th className="py-3 px-3">Medio de Pago</th>
                        <th className="py-3 px-3">Nº Operación</th>
                        <th className="py-3 px-3 text-right">Importe Abonado</th>
                        <th className="py-3 px-4 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagos.map((pg: any) => (
                        <tr key={pg.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {pg.codigo_pago || pg.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">
                            {pg.fecha_pago
                              ? new Date(pg.fecha_pago).toLocaleDateString("es-PE")
                              : "—"}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            {pg.medio_pago || "EFECTIVO"}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {pg.numero_operacion || "—"}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                            S/ {Number(pg.importe || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {pg.status || "REGISTRADO"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENIDO DE PESTAÑA 3: EXPEDIENTE PERSONAL Y MATRÍCULAS */}
        {activeTab === "academico" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Datos Personales y Ubicación */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
                  Datos Personales y Domicilio
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block">Correo Electrónico</span>
                      <span className="font-semibold text-slate-800 break-all">
                        {persona.email || "No registrado"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block">Teléfono Móvil</span>
                      <span className="font-semibold text-slate-800">
                        {persona.telefono || "No registrado"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block">Dirección y Ubigeo</span>
                      <span className="font-semibold text-slate-800 block">
                        {persona.direccion || "No registrada"}
                      </span>
                      {(persona.distrito ||
                        persona.provincia ||
                        persona.departamento) && (
                        <span className="text-slate-500 text-[11px]">
                          {[
                            persona.distrito,
                            persona.provincia,
                            persona.departamento,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block">Fecha de Nacimiento</span>
                      <span className="font-semibold text-slate-800">
                        {persona.fecha_nacimiento || "No registrada"}
                      </span>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                    {!isEstudiante && (
                      <ConvertirEstudianteForm personaId={persona.id} />
                    )}
                    <TogglePersonaStatusButton
                      personaId={persona.id}
                      currentStatus={persona.status || "ACTIVO"}
                    />
                  </div>
                )}
              </div>

              {/* Columna Derecha: Historial de Matrículas */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Matrículas Vinculadas al Estudiante ({matriculas.length})
                  </h3>
                  <Link
                    href={nuevaMatriculaUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nueva Matrícula</span>
                  </Link>
                </div>

                {matriculas.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                    Esta persona todavía no registra matrículas en el sistema.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matriculas.map((m: any) => {
                      const ed = Array.isArray(m.ediciones)
                        ? m.ediciones[0]
                        : m.ediciones;
                      const prog = Array.isArray(ed?.programas)
                        ? ed.programas[0]
                        : ed?.programas;

                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {m.codigo_matricula}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {m.status}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700">
                              {prog?.nombre || "Programa Académico"} · Edición{" "}
                              {ed?.codigo || "Regular"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Fecha de matrícula:{" "}
                              {m.fecha_matricula ||
                                (m.created_at ? m.created_at.slice(0, 10) : "—")}{" "}
                              · Modalidad: {ed?.modalidad || "PRESENCIAL"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/matriculas/${m.id}/ficha`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#C4121A]" />
                              <span>Ficha PDF</span>
                            </Link>
                            <Link
                              href={`/matriculas/${m.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                            >
                              <span>Gestionar</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* CONTENIDO DE PESTAÑA 4: KARDEX ACADÉMICO LONGITUDINAL (CICLOS I - VI) */}
        {activeTab === "kardex" && (
          <div className="p-6">
            <KardexAcademicoView
              persona={persona}
              estudiante={estudiante}
              programaNombre={nombrePrograma}
              kardex={kardex}
              initials={initials}
            />
          </div>
        )}
      </div>

      {/* MODAL 1: CARNÉ DIGITAL ESTUDIANTIL BRUSBEN (CON @MEDIA PRINT AISLADO Y CENTRADO) */}
      {showCarnetModal && (
        <>
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              body * {
                visibility: hidden !important;
              }
              #brusben-carnet-print-area,
              #brusben-carnet-print-area * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #brusben-carnet-print-area {
                position: fixed !important;
                left: 50% !important;
                top: 25mm !important;
                transform: translateX(-50%) !important;
                width: 88mm !important;
                max-width: 88mm !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 14px !important;
                background: #ffffff !important;
                z-index: 99999 !important;
              }
              .carnet-no-print {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}</style>
          <div className="fixed inset-0 z-50 bg-black/60 print:bg-transparent flex items-center justify-center p-4">
            <div
              id="brusben-carnet-print-area"
              className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 relative"
            >
              <button
                type="button"
                onClick={() => setShowCarnetModal(false)}
                className="carnet-no-print absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Cabecera Institucional del Carné */}
              <div className="bg-gradient-to-br from-[#C4121A] to-[#8B0B11] text-white p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                  Centro de Capacitaciones Brusben
                </p>
                <h3 className="text-sm font-extrabold tracking-wide mt-0.5 uppercase">
                  Carné Digital Estudiantil
                </h3>
              </div>

              {/* Cuerpo del Carné */}
              <div className="p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-[#181A1F] text-white font-extrabold text-2xl flex items-center justify-center mx-auto border-4 border-red-100 shadow-md">
                  {initials}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {nombreCompleto}
                  </h4>
                  <p className="text-xs font-mono font-bold text-[#C4121A] mt-0.5">
                    {codigoEstudiantil}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    {nombrePrograma}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px]">
                      Documento
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {persona.tipo_documento || "DNI"} {persona.numero_documento}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px]">
                      Sede / Modalidad
                    </span>
                    <span className="font-bold text-slate-800">
                      {edicionPrincipal?.modalidad || "PRESENCIAL"}
                    </span>
                  </div>
                </div>

                {/* QR / Código de Validación Institucional */}
                <div className="pt-2 flex flex-col items-center justify-center">
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 inline-flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1.5">
                    ID-VERIF: {persona.id.slice(0, 13).toUpperCase()}
                  </span>
                </div>

                <div className="carnet-no-print pt-2 flex gap-2 print:hidden">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCarnetModal(false)}
                    className="w-full text-xs"
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Imprimir Carné
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}



      {/* MODAL 3: FLUJO DE DOBLE CONFIRMACIÓN PARA ELIMINAR / DAR DE BAJA ESTUDIANTE */}
      {deleteStep > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 relative space-y-4">
            <button
              type="button"
              onClick={() => setDeleteStep(0)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 block">
                  Confirmación de Seguridad ({deleteStep} de 2)
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {deleteStep === 1
                    ? "¿Está seguro de eliminar este estudiante?"
                    : "Confirmación Extrema de Eliminación / Baja"}
                </h3>
              </div>
            </div>

            {deleteStep === 1 ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p>
                    <strong>Estudiante:</strong> {nombreCompleto}
                  </p>
                  <p>
                    <strong>Documento:</strong> {persona.tipo_documento || "DNI"}{" "}
                    {persona.numero_documento}
                  </p>
                  <p>
                    <strong>Código:</strong> {codigoEstudiantil}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Esta acción retirará al estudiante del padrón activo (si cuenta con pagos o matrículas históricas, se aplicará la baja definitiva preservando la auditoría institucional).
                </p>

                <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDeleteStep(0)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    Sí, continuar al paso final &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmDelete} className="space-y-4">
                {deleteError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                    {deleteError}
                  </div>
                )}

                <p className="text-xs text-slate-600">
                  Para ejecutar la eliminación definitiva de{" "}
                  <strong className="text-slate-900">{nombreCompleto}</strong>, escriba la palabra clave{" "}
                  <strong className="font-mono text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    ELIMINAR
                  </strong>{" "}
                  en el siguiente recuadro:
                </p>

                <Input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Escriba ELIMINAR para confirmar"
                  className="font-mono uppercase border-red-300 focus:ring-red-500"
                />

                <div className="pt-2 border-t border-slate-100 flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDeleteStep(1)}
                    disabled={isPendingDelete}
                  >
                    &larr; Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isPendingDelete ||
                      deleteConfirmText.trim().toUpperCase() !== "ELIMINAR"
                    }
                    className="bg-[#C4121A] hover:bg-[#900d13] text-white text-xs font-bold"
                  >
                    {isPendingDelete
                      ? "Procesando baja..."
                      : "Confirmar eliminación definitiva"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
