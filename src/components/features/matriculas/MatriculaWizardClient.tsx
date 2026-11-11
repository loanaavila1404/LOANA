'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/currency';
import { confirmarMatriculaAction } from '@/app/actions/matriculas';
import {
  User,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  Check,
  Search,
  Building2,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Award,
  Sparkles,
  Percent,
  Receipt,
  FileText,
} from 'lucide-react';

export type EstudianteOption = {
  id: string;
  persona_id: string;
  codigo_estudiante: string | null;
  personas: {
    id: string;
    nombres: string | null;
    apellido_paterno: string | null;
    apellido_materno: string | null;
    numero_documento: string | null;
    telefono?: string | null;
    email?: string | null;
  } | null;
};

export type ProspectoOption = {
  id: string;
  nombres: string;
  apellidos: string;
  numero_documento: string | null;
  status: string;
  telefono?: string | null;
  email?: string | null;
};

export type EdicionOption = {
  id: string;
  codigo: string;
  nombre: string | null;
  precio_matricula: number | null;
  precio_pension: number | null;
  numero_pensiones: number | null;
  primer_vencimiento: string | null;
  frecuencia_meses: number | null;
  vacantes: number | null;
  turno?: string | null;
  modalidad?: string | null;
  programas: {
    id: string;
    nombre: string;
    codigo: string;
  } | null;
  periodos?: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
  vacantesOcupadas?: number;
};

interface Props {
  estudiantes: EstudianteOption[];
  prospectos: ProspectoOption[];
  ediciones: EdicionOption[];
  asesores: { id: string; display_name: string | null }[];
  initialEstudianteId?: string;
  vacantesMap?: Record<string, number>;
}

export function MatriculaWizardClient({
  estudiantes,
  prospectos,
  ediciones,
  asesores,
  initialEstudianteId = '',
  vacantesMap = {},
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Paso actual (1: Estudiante, 2: Programa/Aforo, 3: Plan Financiero, 4: Revisión)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // --- PASO 1: ESTUDIANTE ---
  const queryEstudianteId = searchParams.get('estudiante_id') || '';
  const queryPersonaId = searchParams.get('persona_id') || '';

  const resolveInitialStudentId = () => {
    if (initialEstudianteId && estudiantes.some(e => e.id === initialEstudianteId)) {
      return initialEstudianteId;
    }
    if (queryEstudianteId && estudiantes.some(e => e.id === queryEstudianteId)) {
      return queryEstudianteId;
    }
    if (queryPersonaId) {
      const byPersona = estudiantes.find(
        e => e.persona_id === queryPersonaId || e.personas?.id === queryPersonaId
      );
      if (byPersona) return byPersona.id;
    }
    return initialEstudianteId || queryEstudianteId || '';
  };

  const [selectedEstudianteId, setSelectedEstudianteId] = useState(resolveInitialStudentId);
  const [studentSearch, setStudentSearch] = useState('');
  const [estudianteTab, setEstudianteTab] = useState<'ESTUDIANTES' | 'PROSPECTOS'>('ESTUDIANTES');
  const [selectedProspectoId, setSelectedProspectoId] = useState<string | null>(null);

  useEffect(() => {
    const resolved = resolveInitialStudentId();
    if (resolved && resolved !== selectedEstudianteId) {
      setSelectedEstudianteId(resolved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEstudianteId, queryEstudianteId, queryPersonaId, estudiantes]);

  const selectedEstudiante = useMemo(() => {
    return estudiantes.find(e => e.id === selectedEstudianteId) || null;
  }, [estudiantes, selectedEstudianteId]);

  // Lista filtrada de estudiantes
  const filteredEstudiantes = useMemo(() => {
    if (!studentSearch.trim()) return estudiantes.slice(0, 15);
    const q = studentSearch.toLowerCase().trim();
    return estudiantes.filter(e => {
      const p = e.personas;
      const full = `${p?.nombres || ''} ${p?.apellido_paterno || ''} ${p?.apellido_materno || ''}`.toLowerCase();
      const dni = (p?.numero_documento || '').toLowerCase();
      const cod = (e.codigo_estudiante || '').toLowerCase();
      return full.includes(q) || dni.includes(q) || cod.includes(q);
    }).slice(0, 20);
  }, [estudiantes, studentSearch]);

  // --- PASO 2: PROGRAMA Y AFORO ---
  const [selectedEdicionId, setSelectedEdicionId] = useState('');
  const [turnoFilter, setTurnoFilter] = useState('TODOS');
  const [sedeSeleccionada, setSedeSeleccionada] = useState('TUM'); // Sede Central Tumbes

  const selectedEdicion = useMemo(() => {
    return ediciones.find(e => e.id === selectedEdicionId) || null;
  }, [ediciones, selectedEdicionId]);

  const filteredEdiciones = useMemo(() => {
    return ediciones.filter(ed => {
      if (turnoFilter !== 'TODOS' && ed.turno !== turnoFilter) {
        return false;
      }
      return true;
    });
  }, [ediciones, turnoFilter]);

  // --- PASO 3: PLAN DE PENSIONES Y MODALIDAD DE PAGO ---
  const [modalidadPago, setModalidadPago] = useState<'CUOTAS' | 'CONTADO' | 'BECA'>('CUOTAS');
  const [importeMatricula, setImporteMatricula] = useState<number>(150);
  const [importePension, setImportePension] = useState<number>(200);
  const [numeroPensiones, setNumeroPensiones] = useState<number>(4);
  const [descuentoTotal, setDescuentoTotal] = useState<number>(0);
  const [descuentoMotivo, setDescuentoMotivo] = useState<string>('');
  const [primerVencimiento, setPrimerVencimiento] = useState<string>('');
  const [frecuenciaMeses, setFrecuenciaMeses] = useState<number>(1);
  const [tipoBeca, setTipoBeca] = useState('SOCIOECONOMICA');

  // Cuando se selecciona una edición, sincronizar valores base sugeridos
  const handleSelectEdicion = (ed: EdicionOption) => {
    setSelectedEdicionId(ed.id);
    const mat = ed.precio_matricula !== null ? Number(ed.precio_matricula) : 150;
    const pen = ed.precio_pension !== null ? Number(ed.precio_pension) : 200;
    const num = ed.numero_pensiones !== null ? Number(ed.numero_pensiones) : 4;
    const freq = ed.frecuencia_meses !== null ? Number(ed.frecuencia_meses) : 1;
    
    // Sugerir fecha de vencimiento: a fin de mes o en 15 días
    const defaultDate = ed.primer_vencimiento || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    setImporteMatricula(mat);
    setImportePension(pen);
    setNumeroPensiones(num > 0 ? num : 4);
    setPrimerVencimiento(defaultDate);
    setFrecuenciaMeses(freq > 0 ? freq : 1);
  };

  // Modificar modalidad de pago (Contado, Cuotas, Beca)
  const handleModalidadChange = (mod: 'CUOTAS' | 'CONTADO' | 'BECA') => {
    setModalidadPago(mod);
    const baseBruto = importeMatricula + (importePension * numeroPensiones);

    if (mod === 'CONTADO') {
      // 10% de descuento automático en pago al contado
      const desc = Math.round(baseBruto * 0.1);
      setDescuentoTotal(desc);
      setDescuentoMotivo('Descuento por Pago al Contado (Ciclo Completo)');
    } else if (mod === 'BECA') {
      // 25% de subsidio o beca
      const desc = Math.round(baseBruto * 0.25);
      setDescuentoTotal(desc);
      setDescuentoMotivo(`Beca Institucional - ${tipoBeca}`);
    } else {
      setDescuentoTotal(0);
      setDescuentoMotivo('');
    }
  };

  // Cálculos reactivos de la estructura financiera
  const totalBruto = useMemo(() => {
    return Number(importeMatricula) + (Number(importePension) * Number(numeroPensiones));
  }, [importeMatricula, importePension, numeroPensiones]);

  const totalNeto = useMemo(() => {
    return Math.max(0, totalBruto - Number(descuentoTotal));
  }, [totalBruto, descuentoTotal]);

  // Cronograma proyectado tentativo
  const cronogramaProyectado = useMemo(() => {
    const list: {
      numero: number;
      concepto: string;
      fechaVencimiento: string;
      importeBruto: number;
      descuento: number;
      importeNeto: number;
    }[] = [];

    // Cuota 0: Matrícula
    const today = new Date().toISOString().split('T')[0];
    const descPorCuota = totalBruto > 0 ? Number(descuentoTotal) / (Number(numeroPensiones) + 1) : 0;

    list.push({
      numero: 0,
      concepto: 'Derecho de Matrícula',
      fechaVencimiento: today,
      importeBruto: Number(importeMatricula),
      descuento: Math.round(descPorCuota),
      importeNeto: Math.max(0, Number(importeMatricula) - Math.round(descPorCuota)),
    });

    // Cuotas de pensión
    const baseDate = primerVencimiento ? new Date(primerVencimiento + 'T00:00:00') : new Date();
    const MESES_ES = [
       'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
       'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const periodoCodigo = selectedEdicion?.periodos?.codigo || selectedEdicion?.codigo || '';

    for (let i = 1; i <= Number(numeroPensiones); i++) {
      const cuotaDate = new Date(baseDate);
      cuotaDate.setMonth(baseDate.getMonth() + (i - 1) * Number(frecuenciaMeses));
      const fechaStr = cuotaDate.toISOString().split('T')[0];
      const mesNombre = MESES_ES[cuotaDate.getMonth()];
      const conceptoStr = `Pensión ${mesNombre}${periodoCodigo ? ` ${periodoCodigo}` : ''}`;

      const cuotaNeto = Math.max(0, Number(importePension) - Math.round(descPorCuota));

      list.push({
        numero: i,
        concepto: conceptoStr,
        fechaVencimiento: fechaStr,
        importeBruto: Number(importePension),
        descuento: Math.round(descPorCuota),
        importeNeto: cuotaNeto,
      });
    }

    return list;
  }, [importeMatricula, importePension, numeroPensiones, primerVencimiento, frecuenciaMeses, descuentoTotal, totalBruto, selectedEdicion]);

  // --- CONFIRMAR MATRÍCULA ATÓMICA ---
  const handleConfirmarMatricula = () => {
    if (!selectedEstudianteId) {
      setErrorMessage('Debes seleccionar un estudiante.');
      setCurrentStep(1);
      return;
    }
    if (!selectedEdicionId) {
      setErrorMessage('Debes seleccionar un programa y edición.');
      setCurrentStep(2);
      return;
    }
    if (!primerVencimiento) {
      setErrorMessage('Debes especificar la fecha del primer vencimiento.');
      setCurrentStep(3);
      return;
    }

    setErrorMessage(null);

    const payload = {
      estudiante_id: selectedEstudianteId,
      edicion_id: selectedEdicionId,
      prospecto_id: selectedProspectoId || null,
      importe_matricula: Number(importeMatricula),
      importe_pension: Number(importePension),
      numero_pensiones: Number(numeroPensiones),
      descuento_total: Number(descuentoTotal),
      descuento_motivo: descuentoMotivo || null,
      primer_vencimiento: primerVencimiento,
      frecuencia_meses: Number(frecuenciaMeses),
    };

    startTransition(async () => {
      const res = await confirmarMatriculaAction(payload);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        router.push(`/matriculas/${res.matricula_id}`);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Mensaje de error general */}
      {errorMessage && (
        <div className="p-4 bg-red-50 text-[#C4121A] border-l-4 border-[#C4121A] rounded-r-lg font-medium text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-800 hover:text-red-950 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stepper Horizontal en 4 Pasos (Estilo Stitch) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          
          {/* Paso 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2.5 cursor-pointer group ${
              currentStep === 1
                ? 'text-[#C4121A]'
                : currentStep > 1
                ? 'text-emerald-700'
                : 'text-slate-400'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 1
                  ? 'bg-[#C4121A] text-white shadow-xs ring-4 ring-red-100'
                  : currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Paso 1</span>
              <span className="text-xs font-bold">Datos Estudiante</span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

          {/* Paso 2 */}
          <div
            onClick={() => selectedEstudianteId && setCurrentStep(2)}
            className={`flex items-center gap-2.5 ${
              selectedEstudianteId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${
              currentStep === 2
                ? 'text-[#C4121A]'
                : currentStep > 2
                ? 'text-emerald-700'
                : 'text-slate-400'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 2
                  ? 'bg-[#C4121A] text-white shadow-xs ring-4 ring-red-100'
                  : currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Paso 2</span>
              <span className="text-xs font-bold">Programa & Aforo</span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

          {/* Paso 3 */}
          <div
            onClick={() => selectedEdicionId && setCurrentStep(3)}
            className={`flex items-center gap-2.5 ${
              selectedEdicionId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${
              currentStep === 3
                ? 'text-[#C4121A]'
                : currentStep > 3
                ? 'text-emerald-700'
                : 'text-slate-400'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 3
                  ? 'bg-[#C4121A] text-white shadow-xs ring-4 ring-red-100'
                  : currentStep > 3
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Paso 3</span>
              <span className="text-xs font-bold">Pensiones y Pagos</span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${currentStep > 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

          {/* Paso 4 */}
          <div
            onClick={() => selectedEdicionId && selectedEstudianteId && setCurrentStep(4)}
            className={`flex items-center gap-2.5 ${
              selectedEdicionId && selectedEstudianteId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            } ${currentStep === 4 ? 'text-[#C4121A]' : 'text-slate-400'}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 4
                  ? 'bg-[#C4121A] text-white shadow-xs ring-4 ring-red-100'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              4
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Paso 4</span>
              <span className="text-xs font-bold">Confirmación</span>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* PASO 1: DATOS DEL ESTUDIANTE */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#C4121A]" />
                    <span>Selección de Estudiante Titular</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Busca al estudiante registrado en el padrón o selecciona desde prospectos calificados.
                  </p>
                </div>
              </div>

              {/* Alerta de estudiante preseleccionado desde Ficha 360 */}
              {selectedEstudiante && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {selectedEstudiante.personas?.nombres?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          Estudiante Seleccionado
                        </span>
                        <Badge variant="success">Expediente Verificado</Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedEstudiante.personas?.nombres} {selectedEstudiante.personas?.apellido_paterno}{' '}
                        {selectedEstudiante.personas?.apellido_materno}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                        <span>
                          <strong>DNI:</strong> {selectedEstudiante.personas?.numero_documento}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Código:</strong>{' '}
                          <span className="font-mono">{selectedEstudiante.codigo_estudiante || 'Se generará al confirmar'}</span>
                        </span>
                        {selectedEstudiante.personas?.telefono && (
                          <>
                            <span>•</span>
                            <span>{selectedEstudiante.personas?.telefono}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEstudianteId('')}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* Buscador de estudiantes */}
              {!selectedEstudiante && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredEstudiantes.length > 0) {
                            setSelectedEstudianteId(filteredEstudiantes[0].id);
                          }
                        }
                      }}
                      placeholder="Buscar por DNI, Nombres, Apellidos o Código Estudiantil (Enter para seleccionar)..."
                      className="w-full pl-9 pr-28 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4121A] font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                      {filteredEstudiantes.length} resultado(s)
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {filteredEstudiantes.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 text-center">
                        No se encontraron estudiantes con ese criterio de búsqueda.
                      </p>
                    ) : (
                      filteredEstudiantes.map(est => {
                        const p = est.personas;
                        const full = `${p?.nombres || ''} ${p?.apellido_paterno || ''} ${p?.apellido_materno || ''}`;
                        return (
                          <div
                            key={est.id}
                            onClick={() => setSelectedEstudianteId(est.id)}
                            className="p-3 hover:bg-red-50/40 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-red-100 group-hover:text-[#C4121A] text-slate-700 flex items-center justify-center font-bold text-xs">
                                {p?.nombres?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900 group-hover:text-[#C4121A]">
                                  {full}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  DNI: {p?.numero_documento || '-'} • Código: {est.codigo_estudiante || 'Sin código'}
                                </p>
                              </div>
                            </div>

                            <span className="text-xs text-slate-400 group-hover:text-[#C4121A] font-semibold flex items-center gap-1">
                              Seleccionar
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer de navegación */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              disabled={!selectedEstudianteId}
              onClick={() => setCurrentStep(2)}
              className="bg-[#C4121A] hover:bg-red-700 text-white font-semibold flex items-center gap-2"
            >
              <span>Continuar a Programa & Aforo</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PASO 2: PROGRAMA, SEDE Y TURNO (CON INDICADOR VISUAL DE AFORO) */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#C4121A]" />
                    <span>Selección de Programa, Sede y Turno</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifica el aforo en tiempo real y asigna la vacante del aula o taller correspondiente.
                  </p>
                </div>

                {/* Filtro de turnos */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 text-[11px] mr-1">Turno:</span>
                  {['TODOS', 'MANANA', 'TARDE', 'NOCHE'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurnoFilter(t)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        turnoFilter === t
                          ? 'bg-[#C4121A] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t === 'MANANA' ? 'Mañana' : t === 'TARDE' ? 'Tarde' : t === 'NOCHE' ? 'Noche' : 'Todos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Sede */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sede Operativa</span>
                    <span className="text-xs font-bold text-slate-800">Sede Central · Tumbes (Principal)</span>
                  </div>
                </div>
                <Badge variant="default">Infraestructura Verificada</Badge>
              </div>

              {/* Cuadrícula de Ediciones Activas con Indicador de Aforo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredEdiciones.map(ed => {
                  const isSelected = selectedEdicionId === ed.id;
                  const totalVacantes = ed.vacantes || 30;
                  const ocupadas = vacantesMap[ed.id] || 0;
                  const disponibles = Math.max(0, totalVacantes - ocupadas);
                  const aforoPorcentaje = Math.min(100, Math.round((ocupadas / totalVacantes) * 100));

                  return (
                    <div
                      key={ed.id}
                      onClick={() => handleSelectEdicion(ed)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-[#C4121A] ring-2 ring-red-100 bg-red-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Check de selección */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#C4121A] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className="pr-6">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 mb-1">
                          {ed.codigo}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          {ed.programas?.nombre || ed.nombre}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ed.nombre || 'Ciclo Regular'}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Turno: {ed.turno || 'Regular'}</span>
                        </div>
                        <span>Modalidad: {ed.modalidad || 'Presencial'}</span>
                      </div>

                      {/* INDICADOR VISUAL DE AFORO (STITCH) */}
                      <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">
                            Aforo: {ocupadas} / {totalVacantes} ocupadas
                          </span>
                          <span
                            className={`font-bold ${
                              disponibles <= 3
                                ? 'text-red-600'
                                : disponibles <= 8
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {disponibles} vacantes libres
                          </span>
                        </div>

                        {/* Barra de Aforo */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              aforoPorcentaje >= 90
                                ? 'bg-red-600'
                                : aforoPorcentaje >= 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${aforoPorcentaje}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span>Aula Taller Clínico 102</span>
                          <span>Ref: S/ {ed.precio_matricula || 150} mat. + S/ {ed.precio_pension || 200} pen.</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Footer de navegación */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </Button>

            <Button
              type="button"
              disabled={!selectedEdicionId}
              onClick={() => setCurrentStep(3)}
              className="bg-[#C4121A] hover:bg-red-700 text-white font-semibold flex items-center gap-2"
            >
              <span>Continuar a Pensiones y Pagos</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PASO 3: PLAN DE PENSIONES Y MODALIDAD DE PAGO */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#C4121A]" />
                  <span>Modalidad de Pago y Estructura Financiera</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Elige la modalidad para calcular las pensiones, aplicar descuentos institucionales y proyectar el cronograma.
                </p>
              </div>

              {/* 3 Opciones de Modalidad de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Opción 1: Cuotas Mensuales */}
                <div
                  onClick={() => handleModalidadChange('CUOTAS')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    modalidadPago === 'CUOTAS'
                      ? 'border-[#C4121A] ring-2 ring-red-100 bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Regular
                    </span>
                    {modalidadPago === 'CUOTAS' && <Check className="w-4 h-4 text-[#C4121A]" />}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">Cuotas Mensuales</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Fraccionamiento mensual regular con opción a descuento por pronto pago.
                  </p>
                </div>

                {/* Opción 2: Pago al Contado */}
                <div
                  onClick={() => handleModalidadChange('CONTADO')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    modalidadPago === 'CONTADO'
                      ? 'border-[#C4121A] ring-2 ring-red-100 bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      10% Descuento
                    </span>
                    {modalidadPago === 'CONTADO' && <Check className="w-4 h-4 text-[#C4121A]" />}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">Pago al Contado</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cancelación íntegra del ciclo completo con beneficio de exoneración.
                  </p>
                </div>

                {/* Opción 3: Beca Institucional */}
                <div
                  onClick={() => handleModalidadChange('BECA')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    modalidadPago === 'BECA'
                      ? 'border-[#C4121A] ring-2 ring-red-100 bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Subsidio Especial
                    </span>
                    {modalidadPago === 'BECA' && <Check className="w-4 h-4 text-[#C4121A]" />}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">Beca / Convenio</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Beca socioeconómica, rendimiento académico o convenio institucional.
                  </p>
                </div>
              </div>

              {/* Selector de Beca si está activa */}
              {modalidadPago === 'BECA' && (
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Award className="w-4 h-4 text-blue-700" />
                    <span>Configuración de Beca Institucional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Tipo de Beca / Motivo</label>
                      <select
                        value={tipoBeca}
                        onChange={e => {
                          setTipoBeca(e.target.value);
                          setDescuentoMotivo(`Beca Institucional - ${e.target.value}`);
                        }}
                        className="w-full border border-slate-300 rounded-md p-2 bg-white text-xs"
                      >
                        <option value="SOCIOECONOMICA">Beca Socioeconómica</option>
                        <option value="EXCELENCIA">Excelencia Académica</option>
                        <option value="CONVENIO_MINSA">Convenio MINSA / Salud</option>
                        <option value="FAMILIAR">Descuento Hermanos / Familiar</option>
                        <option value="DEPORTIVA">Beca Deportiva</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Monto de Descuento (S/)</label>
                      <Input
                        type="number"
                        min="0"
                        value={descuentoTotal}
                        onChange={e => setDescuentoTotal(Number(e.target.value))}
                        className="bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario de Pensiones y Pagos */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Matrícula (S/)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={importeMatricula}
                    onChange={e => setImporteMatricula(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Pensión / Mes (S/)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={importePension}
                    onChange={e => setImportePension(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">N° Pensiones</label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={numeroPensiones}
                    onChange={e => setNumeroPensiones(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">1er Vencimiento</label>
                  <Input
                    type="date"
                    required
                    value={primerVencimiento}
                    onChange={e => setPrimerVencimiento(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Frecuencia (Meses)</label>
                  <Input
                    type="number"
                    min="1"
                    max="3"
                    value={frecuenciaMeses}
                    onChange={e => setFrecuenciaMeses(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Resumen Financiero en Vivo */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Total Bruto: {formatCurrency(totalBruto)}
                    {descuentoTotal > 0 && ` • Descuento: -${formatCurrency(descuentoTotal)}`}
                  </span>
                  <div className="text-xs text-slate-300">
                    Inversión Neta Oficial a Financiar
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {formatCurrency(totalNeto)}
                  </span>
                  <span className="text-[11px] text-emerald-400 block font-semibold">
                    Fraccionado en {numeroPensiones} pensión(es)
                  </span>
                </div>
              </div>

              {/* Proyección del Cronograma Tentativo */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Cronograma Tentativo de Cuotas Proyectadas
                </span>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  {cronogramaProyectado.map(c => (
                    <div key={c.numero} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {c.numero}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-800">{c.concepto}</span>
                          <span className="text-[10px] text-slate-500 block">Vence el: {c.fechaVencimiento}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(c.importeNeto)}</span>
                        {c.descuento > 0 && (
                          <span className="text-[10px] text-emerald-600 block">Desc: -{formatCurrency(c.descuento)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Footer de navegación */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </Button>

            <Button
              type="button"
              disabled={!primerVencimiento || totalNeto <= 0}
              onClick={() => setCurrentStep(4)}
              className="bg-[#C4121A] hover:bg-red-700 text-white font-semibold flex items-center gap-2"
            >
              <span>Continuar a Revisión Final</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PASO 4: REVISIÓN FINAL Y GENERACIÓN ATÓMICA (STITCH) */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validación Preliminar Aprobada</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Revisión Final de Matrícula Institucional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifica todos los datos antes de emitir el código de matrícula y generar el expediente atómico.
                </p>
              </div>

              {/* 3 Tarjetas de Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Estudiante */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Estudiante
                  </span>
                  <p className="font-bold text-sm text-slate-900">
                    {selectedEstudiante?.personas?.nombres} {selectedEstudiante?.personas?.apellido_paterno}{' '}
                    {selectedEstudiante?.personas?.apellido_materno}
                  </p>
                  <p className="text-xs text-slate-600">
                    DNI: {selectedEstudiante?.personas?.numero_documento}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Código: {selectedEstudiante?.codigo_estudiante || 'Auto (BRU-2026-XXXXXX)'}
                  </p>
                </div>

                {/* 2. Oferta Académica */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Oferta & Vacante
                  </span>
                  <p className="font-bold text-sm text-slate-900">
                    {selectedEdicion?.programas?.nombre}
                  </p>
                  <p className="text-xs text-slate-600">
                    Edición: <span className="font-mono">{selectedEdicion?.codigo}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Turno: {selectedEdicion?.turno || 'Regular'} • Sede Central
                  </p>
                </div>

                {/* 3. Estructura Financiera */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Inversión Total
                  </span>
                  <p className="font-bold text-base text-[#C4121A]">
                    {formatCurrency(totalNeto)}
                  </p>
                  <p className="text-xs text-slate-600">
                    Matrícula: {formatCurrency(importeMatricula)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {numeroPensiones} pensiones x {formatCurrency(importePension)}
                  </p>
                </div>
              </div>

              {/* Checklist de Conformidad */}
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-900 block uppercase tracking-wider">
                  Protocolo de Certificación Institucional Brusben
                </span>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Identidad y documentación del estudiante verificadas según el padrón institucional.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Disponibilidad de aforo y vacante reservada en el turno seleccionado.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Generación atómica e idempotente del expediente y cronograma de cuotas en base de datos.</span>
                  </div>
                </div>
              </div>

              {/* Botón Principal de Confirmación */}
              <div className="pt-2">
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmarMatricula}
                  className="w-full py-6 bg-[#C4121A] hover:bg-red-700 text-white font-bold text-base shadow-md flex items-center justify-center gap-3 transition-transform active:scale-[0.99]"
                >
                  {isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generando Matrícula Oficial...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Confirmar y Generar Matrícula Oficial</span>
                    </>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Footer de navegación */}
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modificar Estructura</span>
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
