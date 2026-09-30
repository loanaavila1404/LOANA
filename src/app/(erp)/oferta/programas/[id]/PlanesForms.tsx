import { Database } from '@/types/database.types';
'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createPlanAction, updatePlanAction, createCicloAction, updateCicloAction, createCursoAction, updateCursoAction } from '@/app/actions/oferta/planes';

export function PlanFormModalClient({ programaId, plan, trigger }: { programaId: string, plan?: Database['public']['Tables']['planes_estudio']['Row'], trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('programa_id', programaId);
    
    startTransition(async () => {
      let res;
      if (plan) res = await updatePlanAction(plan.id, formData);
      else res = await createPlanAction(formData);

      if (res?.error) setError(res.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">{trigger}</div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={plan ? 'Editar Plan de Estudio' : 'Nuevo Plan de Estudio'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Código</label>
              <Input name="codigo" defaultValue={plan?.codigo} required className="uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Nombre</label>
              <Input name="nombre" defaultValue={plan?.nombre} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Versión</label>
              <Input name="version" defaultValue={plan?.version} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Total Ciclos</label>
              <Input type="number" name="total_ciclos" defaultValue={plan?.total_ciclos} min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Vigencia Desde</label>
              <Input type="date" name="fecha_vigencia_desde" defaultValue={plan?.fecha_vigencia_desde} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Vigencia Hasta</label>
              <Input type="date" name="fecha_vigencia_hasta" defaultValue={plan?.fecha_vigencia_hasta} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function CicloFormModalClient({ planId, ciclo, trigger }: { planId: string, ciclo?: Database['public']['Tables']['ciclos']['Row'], trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('plan_id', planId);
    
    startTransition(async () => {
      let res;
      if (ciclo) res = await updateCicloAction(ciclo.id, formData);
      else res = await createCicloAction(formData);

      if (res?.error) setError(res.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">{trigger}</div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={ciclo ? 'Editar Ciclo' : 'Nuevo Ciclo'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>}
          <div className="space-y-1">
            <label className="text-xs font-medium">Número de Orden</label>
            <Input type="number" name="numero_orden" defaultValue={ciclo?.numero_orden} required min="1" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Nombre (Opcional)</label>
            <Input name="nombre" defaultValue={ciclo?.nombre} placeholder="Ej: Primer Ciclo" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function CursoFormModalClient({ planId, cicloId, curso, trigger }: { planId: string, cicloId: string, curso?: Database['public']['Tables']['cursos']['Row'], trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('plan_id', planId);
    formData.append('ciclo_id', cicloId);
    
    startTransition(async () => {
      let res;
      if (curso) res = await updateCursoAction(curso.id, formData);
      else res = await createCursoAction(formData);

      if (res?.error) setError(res.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">{trigger}</div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={curso ? 'Editar Curso' : 'Nuevo Curso'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>}
          <div className="space-y-1">
            <label className="text-xs font-medium">Código</label>
            <Input name="codigo" defaultValue={curso?.codigo} className="uppercase" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Nombre</label>
            <Input name="nombre" defaultValue={curso?.nombre} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Créditos</label>
              <Input type="number" name="creditos" defaultValue={curso?.creditos} min="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Horas Semanales</label>
              <Input type="number" name="horas_semanales" defaultValue={curso?.horas_semanales} min="0" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
