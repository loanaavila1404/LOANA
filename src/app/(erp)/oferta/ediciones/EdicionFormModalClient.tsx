'use client'

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import {
  createEdicionAction,
  updateEdicionAction,
  deleteEdicionAction,
  toggleEdicionStatusAction,
  getNextEdicionCodigoAction,
} from '@/app/actions/oferta/ediciones';
import { createPeriodoAction } from '@/app/actions/oferta/periodos';
import { ConfirmModal, AlertModal } from '@/components/ui/Feedback';

type Edicion = Database['public']['Tables']['ediciones']['Row'];
type Programa = Pick<Database['public']['Tables']['programas']['Row'], 'id' | 'nombre'>;
type Plan = Pick<Database['public']['Tables']['planes_estudio']['Row'], 'id' | 'nombre' | 'programa_id'>;
type Periodo = Pick<Database['public']['Tables']['periodos']['Row'], 'id' | 'nombre'> & { codigo?: string | null };
type Ciclo = Pick<Database['public']['Tables']['ciclos']['Row'], 'id' | 'nombre' | 'plan_id' | 'numero_orden'>;

export function EdicionFormModalClient({ 
  edicion,
  programas,
  planes,
  periodos,
  ciclos,
  triggerText = 'Nueva Edición',
  variant = 'primary'
}: { 
  edicion?: Edicion;
  programas: Programa[];
  planes: Plan[];
  periodos: Periodo[];
  ciclos: Ciclo[];
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [codigoValue, setCodigoValue] = useState(edicion?.codigo || '');
  const [selectedPrograma, setSelectedPrograma] = useState(edicion?.programa_id || '');
  const [selectedPeriodo, setSelectedPeriodo] = useState(edicion?.periodo_id || '');
  const [localPeriodos, setLocalPeriodos] = useState<Periodo[]>(periodos);

  // Estado para creación rápida de periodo al vuelo
  const [showQuickPeriodo, setShowQuickPeriodo] = useState(false);
  const [quickPeriodoCodigo, setQuickPeriodoCodigo] = useState('');
  const [quickPeriodoNombre, setQuickPeriodoNombre] = useState('');
  const [isCreatingPeriodo, startTransitionPeriodo] = useTransition();
  const [periodoMsg, setPeriodoMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalPeriodos(periodos);
  }, [periodos]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPeriodoMsg(null);
    setShowQuickPeriodo(false);
    setSelectedPrograma(edicion?.programa_id || '');
    setSelectedPeriodo(edicion?.periodo_id || '');

    if (edicion?.codigo) {
      setCodigoValue(edicion.codigo);
    } else {
      setCodigoValue('ED-...');
      getNextEdicionCodigoAction()
        .then(code => setCodigoValue(code))
        .catch(() => setCodigoValue('ED-001'));
    }
  }, [isOpen, edicion]);

  const planActivo =
    planes.find(p => p.programa_id === selectedPrograma && (p as { status?: string }).status === 'ACTIVO') ||
    planes.find(p => p.programa_id === selectedPrograma);
  
  const filteredCiclos = planActivo ? ciclos.filter(c => c.plan_id === planActivo.id) : [];

  const handleQuickCreatePeriodo = () => {
    if (!quickPeriodoCodigo.trim() || !quickPeriodoNombre.trim()) {
      setPeriodoMsg('Ingrese código y nombre del periodo.');
      return;
    }
    setPeriodoMsg(null);
    const fd = new FormData();
    fd.set('codigo', quickPeriodoCodigo.trim().toUpperCase());
    fd.set('nombre', quickPeriodoNombre.trim());
    fd.set('status', 'ACTIVO');

    startTransitionPeriodo(async () => {
      const res = await createPeriodoAction(fd);
      if (res.error) {
        setPeriodoMsg(res.error);
      } else if (res.data) {
        const nuevo = { id: res.data.id, nombre: res.data.nombre, codigo: res.data.codigo };
        setLocalPeriodos(prev => [nuevo, ...prev]);
        setSelectedPeriodo(res.data.id);
        setQuickPeriodoCodigo('');
        setQuickPeriodoNombre('');
        setShowQuickPeriodo(false);
        router.refresh();
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    if (codigoValue && codigoValue !== 'ED-...') {
      formData.set('codigo', codigoValue.trim().toUpperCase());
    } else {
      formData.set('codigo', '');
    }

    if (planActivo) {
      formData.set('plan_id', planActivo.id);
    }
    
    startTransition(async () => {
      let result;
      if (edicion) result = await updateEdicionAction(edicion.id, formData);
      else result = await createEdicionAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const handleToggleStatus = () => {
    if (!edicion) return;
    setError(null);
    startTransition(async () => {
      const result = await toggleEdicionStatusAction(edicion.id, edicion.status || 'ACTIVO');
      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleDeleteEdicion = () => {
    if (!edicion) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEdicionAction(edicion.id);
      if (result.error) {
        setDeleteFeedback({
          title: 'No se pudo eliminar la edición',
          message: result.error,
          variant: 'error',
        });
        setShowDeleteConfirm(false);
      } else {
        setShowDeleteConfirm(false);
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={edicion ? 'Editar Edición / Grupo' : 'Nueva Edición Académica'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-slate-900">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Código (Autogenerado)
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Automático
                </span>
              </div>
              <Input
                name="codigo"
                value={codigoValue}
                onChange={e => setCodigoValue(e.target.value.toUpperCase())}
                placeholder="ED-001 (Automático)"
                className="uppercase font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nombre de Grupo (Opcional)</label>
              <Input
                name="nombre"
                defaultValue={edicion?.nombre || ''}
                placeholder="Ej: Grupo A - Turno Mañana"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Programa Académico *</label>
            <select 
              name="programa_id" 
              value={selectedPrograma}
              onChange={e => setSelectedPrograma(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Seleccione un programa...</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          {selectedPrograma && (!planActivo || filteredCiclos.length === 0) && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex flex-col space-y-2">
              <span className="text-xs font-medium">
                Este programa todavía no tiene ciclos y cursos configurados en su malla curricular.
              </span>
              <Link
                href={`/oferta/programas/${selectedPrograma}`}
                className="text-center text-xs font-bold bg-white border border-amber-300 px-3 py-1.5 rounded text-amber-900 hover:bg-amber-100 transition-colors"
              >
                Configurar Malla y Ciclos del Programa →
              </Link>
            </div>
          )}

          {selectedPrograma && planActivo && filteredCiclos.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Ciclo Formativo *</label>
              <select 
                name="ciclo_id" 
                defaultValue={edicion?.ciclo_id || filteredCiclos[0]?.id || ''}
                required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione un ciclo...</option>
                {filteredCiclos.map(c => (
                  <option key={c.id} value={c.id}>
                    Ciclo {c.numero_orden} {c.nombre ? `(${c.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700">Periodo *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickPeriodo(v => !v)}
                    className="text-[11px] font-bold text-[#C4121A] hover:underline"
                  >
                    + Crear rápido
                  </button>
                  <span className="text-slate-300">|</span>
                  <Link
                    href="/oferta/periodos"
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-bold text-slate-600 hover:text-[#C4121A] hover:underline"
                  >
                    + Administrar Periodos
                  </Link>
                </div>
              </div>
              <select 
                name="periodo_id" 
                value={selectedPeriodo}
                onChange={e => setSelectedPeriodo(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {localPeriodos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.codigo ? `${p.codigo} — ${p.nombre}` : p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Vacantes Disponibles</label>
              <Input
                type="number"
                name="vacantes"
                defaultValue={edicion?.vacantes ?? ''}
                min="1"
                placeholder="Ej: 30"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Creación Rápida de Periodo al Vuelo */}
          {showQuickPeriodo && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Nuevo Periodo Académico al Vuelo
                </span>
                <Link
                  href="/oferta/periodos"
                  onClick={() => setIsOpen(false)}
                  className="text-[11px] font-semibold text-[#C4121A] hover:underline"
                >
                  Ir a Administrar Periodos →
                </Link>
              </div>
              {periodoMsg && (
                <p className="text-xs text-red-600 font-medium">{periodoMsg}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  value={quickPeriodoCodigo}
                  onChange={e => setQuickPeriodoCodigo(e.target.value.toUpperCase())}
                  placeholder="Código (Ej: 2026-II)"
                  className="text-xs bg-white text-slate-900 uppercase"
                />
                <Input
                  value={quickPeriodoNombre}
                  onChange={e => setQuickPeriodoNombre(e.target.value)}
                  placeholder="Nombre (Ej: Semestre 2026-II)"
                  className="text-xs bg-white text-slate-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreatingPeriodo}
                  onClick={handleQuickCreatePeriodo}
                  className="text-xs"
                >
                  {isCreatingPeriodo ? 'Creando...' : 'Guardar Periodo'}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha de Inicio</label>
              <Input
                type="date"
                name="fecha_inicio"
                defaultValue={edicion?.fecha_inicio || ''}
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha de Fin</label>
              <Input
                type="date"
                name="fecha_fin"
                defaultValue={edicion?.fecha_fin || ''}
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Turno</label>
              <select
                name="turno"
                defaultValue={edicion?.turno || 'MANANA'}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="MANANA">Mañana</option>
                <option value="TARDE">Tarde</option>
                <option value="NOCHE">Noche</option>
                <option value="DOMINICAL">Dominical / Fin de Semana</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Modalidad</label>
              <select
                name="modalidad"
                defaultValue={edicion?.modalidad || 'PRESENCIAL'}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="PRESENCIAL">Presencial</option>
                <option value="SEMIPRESENCIAL">Semipresencial</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
          </div>

          {/* Control de Precios Reales (Sin valores ficticios) */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Matrícula (S/)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                name="precio_matricula"
                defaultValue={edicion?.precio_matricula ?? ''}
                placeholder="Sin configurar"
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Pensión (S/)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                name="precio_pension"
                defaultValue={edicion?.precio_pension ?? ''}
                placeholder="Sin configurar"
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">N° Pensiones</label>
              <Input
                type="number"
                min="0"
                name="numero_pensiones"
                defaultValue={edicion?.numero_pensiones ?? ''}
                placeholder="Ej: 6"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
            {edicion ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleStatus}
                  disabled={isPending}
                  className={
                    edicion.status === 'ACTIVO'
                      ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                  }
                >
                  {edicion.status === 'ACTIVO' ? 'Inactivar Grupo' : 'Activar Grupo'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 font-semibold"
                >
                  Borrar Edición
                </Button>
              </div>
            ) : (
              <div />
            )}
            <div className="space-x-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || (!edicion && (selectedPrograma !== '' && (!planActivo || filteredCiclos.length === 0)))}
              >
                {isPending ? 'Guardando...' : 'Guardar Edición'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Nativo de Doble Confirmación para Eliminar Edición */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteEdicion}
        title="Eliminar Edición / Grupo Académico"
        description={`¿Estás seguro de que deseas eliminar permanentemente el grupo "${edicion?.codigo || ''}" (${edicion?.nombre || ''})? Se eliminarán de forma física y en cascada sus horarios y matrículas asociadas, registrándose un asiento inalterable en la bitácora institucional.`}
        confirmText="Sí, Eliminar Edición"
        cancelText="Conservar Grupo"
        variant="danger"
        isLoading={isPending}
      />

      {/* Modal de Alerta / Feedback */}
      {deleteFeedback && (
        <AlertModal
          isOpen={Boolean(deleteFeedback)}
          onClose={() => setDeleteFeedback(null)}
          title={deleteFeedback.title}
          description={deleteFeedback.message}
          variant={deleteFeedback.variant}
        />
      )}
    </>
  );
}
