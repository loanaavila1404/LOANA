'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createEdicionAction, updateEdicionAction } from '@/app/actions/oferta/ediciones';

type Edicion = Database['public']['Tables']['ediciones']['Row'];
type Programa = Pick<Database['public']['Tables']['programas']['Row'], 'id' | 'nombre'>;
type Plan = Pick<Database['public']['Tables']['planes_estudio']['Row'], 'id' | 'nombre' | 'programa_id'>;
type Periodo = Pick<Database['public']['Tables']['periodos']['Row'], 'id' | 'nombre'>;
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
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedPrograma, setSelectedPrograma] = useState(edicion?.programa_id || '');
  const [selectedPlan, setSelectedPlan] = useState(edicion?.plan_id || '');

  const filteredPlanes = planes.filter(p => p.programa_id === selectedPrograma);
  const filteredCiclos = ciclos.filter(c => c.plan_id === selectedPlan);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      let result;
      if (edicion) result = await updateEdicionAction(edicion.id, formData);
      else result = await createEdicionAction(formData);

      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={edicion ? 'Editar Edición' : 'Nueva Edición'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Código</label>
              <Input name="codigo" defaultValue={edicion?.codigo} required placeholder="EJ: ED-2024" className="uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Nombre (Opcional)</label>
              <Input name="nombre" defaultValue={edicion?.nombre || ''} placeholder="Ej: Grupo A" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Programa</label>
            <select 
              name="programa_id" 
              value={selectedPrograma}
              onChange={e => { setSelectedPrograma(e.target.value); setSelectedPlan(''); }}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Seleccione...</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Plan de Estudio</label>
              <select 
                name="plan_id" 
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value)}
                required
                disabled={!selectedPrograma}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {filteredPlanes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Ciclo</label>
              <select 
                name="ciclo_id" 
                defaultValue={edicion?.ciclo_id || ''}
                required
                disabled={!selectedPlan}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {filteredCiclos.map(c => <option key={c.id} value={c.id}>Ciclo {c.numero_orden} {c.nombre ? `(${c.nombre})` : ''}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Periodo</label>
              <select 
                name="periodo_id" 
                defaultValue={edicion?.periodo_id || ''}
                required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Vacantes</label>
              <Input type="number" name="vacantes" defaultValue={edicion?.vacantes || ''} min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Fecha de Inicio</label>
              <Input type="date" name="fecha_inicio" defaultValue={edicion?.fecha_inicio || ''} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Fecha de Fin</label>
              <Input type="date" name="fecha_fin" defaultValue={edicion?.fecha_fin || ''} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Turno</label>
              <select name="turno" defaultValue={edicion?.turno || ''} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="MANANA">Mañana</option>
                <option value="TARDE">Tarde</option>
                <option value="NOCHE">Noche</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Modalidad</label>
              <select name="modalidad" defaultValue={edicion?.modalidad || ''} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="PRESENCIAL">Presencial</option>
                <option value="SEMIPRESENCIAL">Semipresencial</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
