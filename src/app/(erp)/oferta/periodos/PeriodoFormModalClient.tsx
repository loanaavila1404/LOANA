'use client'

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { 
  createPeriodoAction, 
  updatePeriodoAction, 
  togglePeriodoStatusAction,
  deletePeriodoAction 
} from '@/app/actions/oferta/periodos';
import { ConfirmModal } from '@/components/ui/Feedback';
import { Sparkles, Trash2, Calendar } from 'lucide-react';

type Periodo = Database['public']['Tables']['periodos']['Row'];

export function PeriodoFormModalClient({ 
  periodo,
  triggerText = '+ Nuevo Periodo',
  variant = 'primary'
}: { 
  periodo?: Periodo;
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estados de generación automática de código y nombre
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState<number>(currentYear);
  const [semestre, setSemestre] = useState<'I' | 'II' | 'V'>('I');
  const [codigo, setCodigo] = useState<string>(periodo?.codigo || `${currentYear}-I`);
  const [nombre, setNombre] = useState<string>(periodo?.nombre || `Primer Semestre Académico ${currentYear}`);
  const [fechaInicio, setFechaInicio] = useState<string>(periodo?.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState<string>(periodo?.fecha_fin || '');

  // Modal de doble confirmación para borrar
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (periodo) {
        setCodigo(periodo.codigo || `${currentYear}-I`);
        setNombre(periodo.nombre || '');
        setFechaInicio(periodo.fecha_inicio || '');
        setFechaFin(periodo.fecha_fin || '');
        // Extraer año y semestre si coincide el formato
        const parts = (periodo.codigo || '').split('-');
        if (parts.length === 2 && !isNaN(Number(parts[0]))) {
          setAnio(Number(parts[0]));
          setSemestre((parts[1] as 'I' | 'II' | 'V') || 'I');
        }
      } else {
        const autoCode = `${anio}-${semestre}`;
        const autoNom = semestre === 'V'
          ? `Ciclo de Verano / Nivelación ${anio}`
          : `${semestre === 'I' ? 'Primer' : 'Segundo'} Semestre Académico ${anio}`;
        setCodigo(autoCode);
        setNombre(autoNom);
        setFechaInicio(`${anio}-${semestre === 'II' ? '08-01' : '03-01'}`);
        setFechaFin(`${anio}-${semestre === 'II' ? '12-20' : '07-20'}`);
      }
    }
  }, [isOpen, periodo]);

  // Manejar cambio en año o semestre para autogenerar código y nombre
  const handleAutoGenerate = (newYear: number, newSem: 'I' | 'II' | 'V') => {
    setAnio(newYear);
    setSemestre(newSem);
    const newCode = `${newYear}-${newSem}`;
    setCodigo(newCode);
    if (!periodo) {
      const newNom = newSem === 'V'
        ? `Ciclo de Verano / Nivelación ${newYear}`
        : `${newSem === 'I' ? 'Primer' : 'Segundo'} Semestre Académico ${newYear}`;
      setNombre(newNom);
      setFechaInicio(`${newYear}-${newSem === 'II' ? '08-01' : '03-01'}`);
      setFechaFin(`${newYear}-${newSem === 'II' ? '12-20' : '07-20'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.append('codigo', codigo.trim().toUpperCase());
    formData.append('nombre', nombre.trim());
    formData.append('fecha_inicio', fechaInicio);
    formData.append('fecha_fin', fechaFin);
    formData.append('status', periodo?.status || 'ACTIVO');
    
    startTransition(async () => {
      let result;
      if (periodo) result = await updatePeriodoAction(periodo.id, formData);
      else result = await createPeriodoAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleToggleStatus = () => {
    if (!periodo) return;
    setError(null);
    startTransition(async () => {
      const result = await togglePeriodoStatusAction(periodo.id, periodo.status || 'ACTIVO');
      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!periodo) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePeriodoAction(periodo.id, 'Eliminación manual desde panel de periodos');
      if (result.error) {
        setError(result.error);
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

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={periodo ? 'Editar Periodo Académico' : 'Nuevo Periodo Académico'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-slate-900">
          {error && <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          {/* Generador Rápido de Periodo */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C4121A]" />
                <span>Generación Automática del Periodo</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-100 text-[#C4121A] font-bold">
                {codigo}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Año Lectivo</label>
                <select
                  value={anio}
                  onChange={e => handleAutoGenerate(Number(e.target.value), semestre)}
                  className="w-full text-xs font-semibold p-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Semestre / Convocatoria</label>
                <select
                  value={semestre}
                  onChange={e => handleAutoGenerate(anio, e.target.value as 'I' | 'II' | 'V')}
                  className="w-full text-xs font-semibold p-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="I">Semestre I (Marzo - Julio)</option>
                  <option value="II">Semestre II (Agosto - Diciembre)</option>
                  <option value="V">Ciclo Verano (Enero - Febrero)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Código Oficial del Periodo *</label>
            <div className="relative">
              <Input
                name="codigo"
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                required
                placeholder="EJ: 2026-I"
                className="uppercase font-mono font-bold text-slate-900 bg-white pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">
              Generado automáticamente según el estándar institucional (ej. 2026-I, 2026-II).
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nombre Oficial del Periodo *</label>
            <Input
              name="nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              placeholder="Ej: Primer Semestre Académico 2026"
              className="text-slate-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha de Inicio</label>
              <Input
                type="date"
                name="fecha_inicio"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha de Fin</label>
              <Input
                type="date"
                name="fecha_fin"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
            {periodo ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleStatus}
                  disabled={isPending}
                  className={periodo.status === 'ACTIVO' ? 'text-amber-700 border-amber-200 hover:bg-amber-50' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'}
                >
                  {periodo.status === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Borrar</span>
                </Button>
              </div>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#C4121A] hover:bg-[#a00e15] text-white">
                {isPending ? 'Guardando...' : 'Guardar Periodo'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Doble Confirmación para Eliminar Periodo */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Periodo Académico"
        description={`¿Estás seguro de que deseas eliminar permanentemente el periodo "${periodo?.codigo} — ${periodo?.nombre}"? Esta acción borrará el periodo de la base de datos y quedará registrada en el historial de auditoría institucional.`}
        confirmText="Sí, Eliminar Definitivamente"
        cancelText="Conservar Periodo"
        variant="danger"
        isLoading={isPending}
      />
    </>
  );
}
