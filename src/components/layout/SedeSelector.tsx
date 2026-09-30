'use client'

import React, { useTransition, useEffect, useState } from 'react'
import { SedeContextType, TOKEN_SEDE_TODAS } from '@/lib/types'
import { changeSedeAction, clearSedeCookieAction } from '@/app/actions/sede'
import { useRouter } from 'next/navigation'

export function SedeSelector({ context }: { context?: SedeContextType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Sincronizar estado de la cookie desde cliente si vino inválida en servidor
  useEffect(() => {
    if (context?.cookieDebeLimpiarse) {
      if (context.cookieDebeActualizarseA) {
        const formData = new FormData()
        formData.append('sedeId', context.cookieDebeActualizarseA)
        changeSedeAction(formData).catch(console.error)
      } else {
        clearSedeCookieAction().catch(console.error)
      }
    }
  }, [context?.cookieDebeLimpiarse, context?.cookieDebeActualizarseA])

  const estado = context?.estado || 'COMPATIBILIDAD'
  const isCompat = estado === 'COMPATIBILIDAD'
  const isEnabled = context?.sedesEnabled ?? false

  const currentValue = context?.sedeEfectiva?.tipo === 'TODAS' 
    ? TOKEN_SEDE_TODAS 
    : context?.sedeEfectiva?.sedeId || ''

  const sedes = context?.sedesDisponibles || []
  const canSeeTodas = context?.permisoTodas || false

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setErrorMsg(null)
    const newVal = e.target.value
    if (!isEnabled || isCompat || estado === 'ERROR' || estado === 'SIN_ACCESO') return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('sedeId', newVal)
      const res = await changeSedeAction(formData)
      if (!res.success) {
        setErrorMsg(res.message)
      } else {
        router.refresh()
      }
    })
  }

  // Determinar la etiqueta a mostrar según el estado (útil en móviles o estados de error)
  let labelText = context?.etiquetaCompatibilidad || 'Sede Central · Tumbes'
  if (estado === 'ERROR') labelText = 'No se pudo cargar la sede'
  if (estado === 'SIN_ACCESO') labelText = 'Sin sedes asignadas'

  if (estado !== 'LISTO' && estado !== 'COMPATIBILIDAD') {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 relative">
        <span className="truncate max-w-[150px]">{labelText}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col relative group">
      <div className={`flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80 relative transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        <select 
          className="bg-transparent border-none outline-none appearance-none pr-4 cursor-pointer text-slate-600 font-medium z-10 w-full md:w-auto disabled:opacity-80 max-w-[150px] md:max-w-none truncate"
          value={isCompat ? '' : currentValue}
          onChange={handleChange}
          disabled={!isEnabled || isPending || isCompat}
          title={isCompat ? 'Modo compatibilidad. Selección deshabilitada.' : 'Seleccionar sede'}
          aria-label="Seleccionar sede de trabajo"
        >
          {isCompat ? (
            <option value="">{labelText}</option>
          ) : (
            <>
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
              {canSeeTodas && (
                <option value={TOKEN_SEDE_TODAS}>Todas las sedes</option>
              )}
            </>
          )}
        </select>
        
        {isPending ? (
          <div className="absolute right-2 w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin pointer-events-none" aria-hidden="true" />
        ) : (
          <svg className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Región para anunciar errores de forma accesible y visual */}
      <div aria-live="assertive" className="absolute top-full left-0 mt-1 w-max z-50">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-2 py-1 rounded shadow-sm">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  )
}
