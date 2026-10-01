'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createProspectoAction, updateProspectoAction } from '@/app/actions/crm/prospectos';

type Prospecto = Database['public']['Tables']['prospectos']['Row'];

export function ProspectoFormModalClient({ 
  prospecto,
  programas,
  planes,
  ediciones,
  catalogos,
  triggerText = 'Nuevo Prospecto',
  variant = 'primary'
}: { 
  prospecto?: Prospecto;
  programas: any[];
  planes: any[];
  ediciones: any[];
  catalogos: any[];
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedPrograma, setSelectedPrograma] = useState(prospecto?.programa_id || '');
  const filteredPlanes = planes.filter(p => p.programa_id === selectedPrograma);
  const canales = catalogos.filter(c => c.tipo_catalogo === 'CANAL');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      let result;
      if (prospecto) result = await updateProspectoAction(prospecto.id, formData);
      else result = await createProspectoAction(formData);

      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={prospecto ? 'Editar Prospecto' : 'Nuevo Prospecto'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 h-[70vh] overflow-y-auto px-1">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Nombres *</label>
              <Input name="nombres" defaultValue={prospecto?.nombres || ''} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Apellidos *</label>
              <Input name="apellidos" defaultValue={prospecto?.apellidos || ''} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Tipo Doc.</label>
              <select name="tipo_documento" defaultValue={prospecto?.tipo_documento || ''} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="">Seleccione...</option>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Nro. Documento</label>
              <Input name="numero_documento" defaultValue={prospecto?.numero_documento || ''} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Teléfono *</label>
              <Input name="telefono" defaultValue={prospecto?.telefono || ''} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Email</label>
              <Input type="email" name="email" defaultValue={prospecto?.email || ''} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Programa de Interés</label>
            <select 
              name="programa_id" 
              value={selectedPrograma}
              onChange={(e) => setSelectedPrograma(e.target.value)}
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
                defaultValue={prospecto?.plan_id || ''}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {filteredPlanes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Edición</label>
              <select 
                name="edicion_id" 
                defaultValue={prospecto?.edicion_id || ''}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {ediciones.map(e => <option key={e.id} value={e.id}>{e.codigo}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Canal Captación</label>
              <select 
                name="canal_captacion" 
                defaultValue={prospecto?.canal_captacion || ''}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {canales.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Nivel de Interés</label>
              <select 
                name="nivel_interes" 
                defaultValue={prospecto?.nivel_interes || ''}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                <option value="ALTO">Alto</option>
                <option value="MEDIO">Medio</option>
                <option value="BAJO">Bajo</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Observaciones</label>
            <textarea name="observaciones" defaultValue={prospecto?.observaciones || ''} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" rows={3}></textarea>
          </div>

          <div className="flex justify-end pt-4 space-x-2 border-t border-slate-100 mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
