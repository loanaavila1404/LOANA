'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createProspectoAction, updateProspectoAction } from '@/app/actions/crm/prospectos';
import { Plus, UserCheck } from 'lucide-react';

type Prospecto = Database['public']['Tables']['prospectos']['Row'];

export interface AsesorOption {
  id: string;
  display_name: string | null;
  email?: string | null;
  role_name?: string | null;
}

const DEFAULT_CANALES = [
  { codigo: 'WHATSAPP', nombre: 'WhatsApp Directo' },
  { codigo: 'FACEBOOK_ADS', nombre: 'Facebook / Instagram Ads' },
  { codigo: 'WEB', nombre: 'Página Web Oficial' },
  { codigo: 'TIKTOK', nombre: 'TikTok' },
  { codigo: 'LLAMADA', nombre: 'Llamada Telefónica' },
  { codigo: 'PRESENCIAL', nombre: 'Visita en Sede' },
  { codigo: 'REFERIDO', nombre: 'Referido / Recomendación' },
];

export function ProspectoFormModalClient({
  prospecto,
  programas,
  planes,
  ediciones,
  catalogos,
  asesores = [],
  currentUserId,
  isAdvisor = false,
  triggerText = '+ Nuevo prospecto',
  variant = 'primary',
}: {
  prospecto?: Prospecto;
  programas: { id: string; nombre: string; codigo?: string }[];
  planes: { id: string; nombre: string; programa_id: string | null }[];
  ediciones: { id: string; codigo: string; programa_id?: string | null }[];
  catalogos: { codigo: string; nombre: string; tipo_catalogo: string }[];
  asesores?: AsesorOption[];
  currentUserId?: string;
  isAdvisor?: boolean;
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedPrograma, setSelectedPrograma] = useState(prospecto?.programa_id || '');
  const filteredPlanes = planes.filter(p => p.programa_id === selectedPrograma);

  const canalesFromDb = catalogos.filter(c => c.tipo_catalogo === 'CANAL');
  const canales = canalesFromDb.length > 0 ? canalesFromDb : DEFAULT_CANALES;

  const defaultAsesorId =
    prospecto?.asesor_id ||
    (currentUserId && asesores.some(a => a.id === currentUserId) ? currentUserId : '') ||
    asesores[0]?.id ||
    '';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = prospecto
        ? await updateProspectoAction(prospecto.id, formData)
        : await createProspectoAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setIsOpen(true)}
        className={
          variant === 'primary'
            ? 'bg-[#C4121A] hover:bg-[#A30D14] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm inline-flex items-center gap-1.5'
            : ''
        }
      >
        {!prospecto && <Plus className="w-4 h-4" />}
        <span>{triggerText}</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={prospecto ? 'Editar Prospecto Comercial' : 'Registrar Nuevo Prospecto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-3 max-h-[75vh] overflow-y-auto px-1">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Bloque Destacado: Asignación de Asesor Comercial */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#C4121A]" />
              <span>Asesor Comercial Responsable *</span>
            </label>
            {isAdvisor ? (
              <>
                <input type="hidden" name="asesor_id" value={currentUserId || ''} />
                <div className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    {asesores.find(a => a.id === currentUserId)?.display_name ||
                      asesores.find(a => a.id === currentUserId)?.email ||
                      'Mi Usuario (Asesor Comercial)'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Asignación Directa
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Este prospecto quedará asignado bajo tu cartera personal de seguimiento y conversión.
                </p>
              </>
            ) : (
              <>
                <select
                  name="asesor_id"
                  defaultValue={defaultAsesorId}
                  required={asesores.length > 0}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] bg-white"
                >
                  {asesores.length === 0 ? (
                    <option value="">Asignar automáticamente a mi usuario</option>
                  ) : (
                    <>
                      <option value="">Seleccione un asesor responsable...</option>
                      {asesores.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.display_name || a.email || 'Asesor Activo'}
                          {a.role_name ? ` — (${a.role_name})` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-500">
                  El asesor seleccionado será responsable del seguimiento y conversión de este prospecto.
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nombres *</label>
              <Input name="nombres" defaultValue={prospecto?.nombres || ''} placeholder="Ej. Juan Carlos" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Apellidos *</label>
              <Input name="apellidos" defaultValue={prospecto?.apellidos || ''} placeholder="Ej. Pérez Gómez" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tipo de Documento</label>
              <select
                name="tipo_documento"
                defaultValue={prospecto?.tipo_documento || 'DNI'}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="DNI">DNI</option>
                <option value="CE">Carné de Extranjería (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nro. de Documento</label>
              <Input name="numero_documento" defaultValue={prospecto?.numero_documento || ''} placeholder="8 dígitos" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Teléfono / WhatsApp *</label>
              <Input name="telefono" defaultValue={prospecto?.telefono || ''} placeholder="Ej. 987654321" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
              <Input type="email" name="email" defaultValue={prospecto?.email || ''} placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Programa Académico de Interés</label>
            <select
              name="programa_id"
              value={selectedPrograma}
              onChange={e => setSelectedPrograma(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Seleccione un programa...</option>
              {programas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Plan de Estudio</label>
              <select
                name="plan_id"
                defaultValue={prospecto?.plan_id || ''}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {filteredPlanes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Edición / Grupo</label>
              <select
                name="edicion_id"
                defaultValue={prospecto?.edicion_id || ''}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Seleccione...</option>
                {ediciones.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Canal de Captación</label>
              <select
                name="canal_captacion"
                defaultValue={prospecto?.canal_captacion || 'WHATSAPP'}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {canales.map(c => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Temperatura / Interés</label>
              <select
                name="nivel_interes"
                defaultValue={prospecto?.nivel_interes || 'ALTO'}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="ALTO">Alta 🔥 (Prioritario)</option>
                <option value="MEDIO">Media ⚡ (Evaluando)</option>
                <option value="BAJO">Baja ❄️ (Informativo)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Etapa Inicial</label>
              <select
                name="status"
                defaultValue={prospecto?.status || 'NUEVO'}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="NUEVO">Nuevo</option>
                <option value="CONTACTADO">Contactado</option>
                <option value="EN SEGUIMIENTO">En Seguimiento</option>
                <option value="INTERESADO">Interesado</option>
                <option value="PREMATRICULA">Prematrícula</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Observaciones / Notas de Admisión</label>
            <textarea
              name="observaciones"
              defaultValue={prospecto?.observaciones || ''}
              placeholder="Horario de preferencia, consultas sobre becas o convalidaciones..."
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={2}
            />
          </div>

          <div className="flex justify-end pt-3 space-x-2 border-t border-slate-100 mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-[#C4121A] hover:bg-[#A30D14] text-white">
              {isPending ? 'Guardando...' : prospecto ? 'Guardar Cambios' : 'Registrar Prospecto'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
