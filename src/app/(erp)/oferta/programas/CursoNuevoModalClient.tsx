'use client'

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createCursoAction, getNextCursoCodigoAction } from '@/app/actions/oferta/planes';

type PlanOpt = { id: string; codigo: string | null; nombre: string | null; programa_id: string | null };
type CicloOpt = { id: string; nombre: string | null; plan_id: string | null; numero_orden: number | null };
type ProgOpt = { id: string; nombre: string | null };

export function CursoNuevoModalClient({
  planes,
  ciclos,
  programas,
  triggerText = '+ Nuevo Curso',
}: {
  planes: PlanOpt[];
  ciclos: CicloOpt[];
  programas: ProgOpt[];
  triggerText?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [planId, setPlanId] = useState('');
  const [cicloId, setCicloId] = useState('');
  const [creditos, setCreditos] = useState('');
  const [horas, setHoras] = useState('');

  const ciclosDelPlan = ciclos
    .filter(c => c.plan_id === planId)
    .sort((a, b) => (a.numero_orden || 0) - (b.numero_orden || 0));

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCodigo('CRS-...');
    getNextCursoCodigoAction()
      .then(code => setCodigo(code))
      .catch(() => setCodigo(''));
    setNombre('');
    setCreditos('');
    setHoras('');
    const first = planes[0]?.id || '';
    setPlanId(first);
  }, [isOpen, planes]);

  // Al cambiar de plan, preseleccionar el primer ciclo disponible
  useEffect(() => {
    const list = ciclos
      .filter(c => c.plan_id === planId)
      .sort((a, b) => (a.numero_orden || 0) - (b.numero_orden || 0));
    setCicloId(list[0]?.id || '');
  }, [planId, ciclos]);

  const nombrePrograma = (programaId: string | null) =>
    programas.find(p => p.id === programaId)?.nombre || 'Programa';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!planId) return setError('Seleccione un plan de estudio.');
    if (!cicloId) return setError('El plan seleccionado no tiene ciclos. Cree un ciclo primero.');

    const fd = new FormData();
    fd.set('plan_id', planId);
    fd.set('ciclo_id', cicloId);
    const codigoLimpio = codigo.trim().toUpperCase();
    fd.set('codigo', codigoLimpio === 'CRS-...' ? '' : codigoLimpio);
    fd.set('nombre', nombre);
    fd.set('creditos', creditos);
    fd.set('horas_semanales', horas);
    fd.set('status', 'ACTIVO');

    startTransition(async () => {
      const res = await createCursoAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>{triggerText}</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nuevo Curso / Módulo">
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {planes.length === 0 && (
            <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
              No hay planes de estudio. Cree primero un programa para generar su plan y ciclo.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Código (Autogenerado)</label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded">
                  Automático
                </span>
              </div>
              <Input
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                placeholder="CRS-001 (Automático)"
                className="uppercase font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nombre / Asignatura *</label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                placeholder="Ej: Anatomía y Fisiología"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Plan de Estudio *</label>
            <select
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Seleccione un plan...</option>
              {planes.map(p => (
                <option key={p.id} value={p.id}>
                  {nombrePrograma(p.programa_id)} — {p.nombre || p.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Ciclo *</label>
            <select
              value={cicloId}
              onChange={e => setCicloId(e.target.value)}
              required
              disabled={!planId || ciclosDelPlan.length === 0}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
            >
              {ciclosDelPlan.length === 0 ? (
                <option value="">Sin ciclos en este plan</option>
              ) : (
                ciclosDelPlan.map(c => (
                  <option key={c.id} value={c.id}>
                    Ciclo {c.numero_orden} {c.nombre ? `— ${c.nombre}` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Créditos Académicos</label>
              <Input
                type="number"
                min="0"
                value={creditos}
                onChange={e => setCreditos(e.target.value)}
                placeholder="Ej: 4"
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Horas Semanales</label>
              <Input
                type="number"
                min="0"
                value={horas}
                onChange={e => setHoras(e.target.value)}
                placeholder="Ej: 4"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || planes.length === 0}>
              {isPending ? 'Guardando...' : 'Guardar Curso'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
