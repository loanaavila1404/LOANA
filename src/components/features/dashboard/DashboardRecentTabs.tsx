'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ChevronRight } from 'lucide-react'

export interface DashboardMatriculaRow {
  id: string
  codigoMatricula: string
  estudianteNombre: string
  documento: string
  codigoEstudiante: string
  programaNombre: string
  edicionCodigo: string
  fecha: string
  status: string
}

export interface DashboardEstudianteRow {
  id: string
  personaId: string
  nombreCompleto: string
  documento: string
  codigoEstudiante: string
  contacto: string
  fechaAlta: string
  status: string
}

export interface DashboardCuotaPendienteRow {
  id: string
  matriculaId: string
  codigoMatricula: string
  estudianteNombre: string
  concepto: string
  fechaVencimiento: string
  importeNeto: number
  saldo: number
  status: string
}

interface DashboardRecentTabsProps {
  matriculas: DashboardMatriculaRow[]
  estudiantes: DashboardEstudianteRow[]
  cuotasPendientes: DashboardCuotaPendienteRow[]
  totalMatriculasCount: number
  totalEstudiantesCount: number
  totalCuotasPendientesCount: number
}

type TabKey = 'matriculas' | 'estudiantes' | 'cuotas'

export function DashboardRecentTabs({
  matriculas,
  estudiantes,
  cuotasPendientes,
  totalMatriculasCount,
  totalEstudiantesCount,
  totalCuotasPendientesCount,
}: DashboardRecentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('matriculas')

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() || '')
      .join('') || 'BR'

  const shownCount =
    activeTab === 'matriculas'
      ? matriculas.length
      : activeTab === 'estudiantes'
        ? estudiantes.length
        : cuotasPendientes.length

  const totalCount =
    activeTab === 'matriculas'
      ? totalMatriculasCount
      : activeTab === 'estudiantes'
        ? totalEstudiantesCount
        : totalCuotasPendientesCount

  const headerLink =
    activeTab === 'matriculas'
      ? { href: '/matriculas', label: `Ver matrículas (${totalMatriculasCount})` }
      : activeTab === 'estudiantes'
        ? { href: '/personas', label: `Ver padrón (${totalEstudiantesCount})` }
        : { href: '/reportes/financiero', label: `Ver cobranza (${totalCuotasPendientesCount})` }

  return (
    <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs sm:shadow-sm overflow-hidden flex flex-col">
      {/* Encabezado de la tabla */}
      <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between sm:gap-3">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-xs sm:text-base font-bold text-slate-800 sm:text-slate-900 tracking-tight sm:tracking-normal">
              Actividad y registros recientes
            </h2>
            <span className="bg-slate-100 text-slate-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded sm:rounded-full font-medium">
              Tiempo real
            </span>
          </div>
          <p className="text-[10.5px] sm:text-xs text-slate-400 sm:text-slate-500 mt-0.5">
            Matrículas vigentes, padrón de estudiantes y obligaciones de pago registradas en base de datos.
          </p>
        </div>
        <Link
          href={headerLink.href}
          className="text-[11px] sm:text-xs font-bold sm:font-semibold text-brand-700 hover:text-brand-800 sm:hover:underline inline-flex items-center gap-1 transition"
        >
          <span>{headerLink.label}</span>
          <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
        </Link>
      </div>

      {/* Pestañas funcionales */}
      <div className="px-3 sm:px-5 pt-2.5 sm:py-2.5 pb-1 sm:pb-2.5 sm:bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('matriculas')}
          className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] sm:text-xs transition ${
            activeTab === 'matriculas'
              ? 'font-bold bg-red-50 sm:bg-white text-brand-700 border border-red-200/70 sm:border-slate-200 shadow-xs'
              : 'font-medium bg-slate-50 sm:bg-transparent text-slate-600 hover:bg-slate-100 sm:hover:bg-white/80'
          }`}
        >
          Matrículas ({totalMatriculasCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('estudiantes')}
          className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] sm:text-xs transition ${
            activeTab === 'estudiantes'
              ? 'font-bold bg-red-50 sm:bg-white text-brand-700 border border-red-200/70 sm:border-slate-200 shadow-xs'
              : 'font-medium bg-slate-50 sm:bg-transparent text-slate-600 hover:bg-slate-100 sm:hover:bg-white/80'
          }`}
        >
          Estudiantes ({totalEstudiantesCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cuotas')}
          className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] sm:text-xs transition ${
            activeTab === 'cuotas'
              ? 'font-bold bg-red-50 sm:bg-white text-brand-700 border border-red-200/70 sm:border-slate-200 shadow-xs'
              : 'font-medium bg-slate-50 sm:bg-transparent text-slate-600 hover:bg-slate-100 sm:hover:bg-white/80'
          }`}
        >
          Pendientes de pago ({totalCuotasPendientesCount})
        </button>
      </div>

      {/* TAB 1: MATRÍCULAS */}
      {activeTab === 'matriculas' && (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4" scope="col">Estudiante / Identificación</th>
                  <th className="py-3 px-3" scope="col">Código Matrícula</th>
                  <th className="py-3 px-3" scope="col">Programa Académico</th>
                  <th className="py-3 px-3" scope="col">Fecha</th>
                  <th className="py-3 px-3" scope="col">Estado</th>
                  <th className="py-3 px-4 text-right" scope="col">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {matriculas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No hay matrículas registradas actualmente.
                    </td>
                  </tr>
                ) : (
                  matriculas.map(mat => (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{mat.estudianteNombre}</div>
                        <div className="text-[11px] text-slate-500">
                          {mat.documento} • Cód. Est: <span className="font-mono">{mat.codigoEstudiante}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{mat.codigoMatricula}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{mat.programaNombre}</div>
                        <div className="text-[11px] text-slate-500">Edición: {mat.edicionCodigo}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{mat.fecha}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            mat.status === 'ACTIVA'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : mat.status === 'ANULADA'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {mat.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/matriculas/${mat.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-brand-700 bg-red-50 hover:bg-red-100 transition"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-slate-100">
            {matriculas.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No hay matrículas registradas.</div>
            ) : (
              matriculas.map(mat => (
                <article key={mat.id} className="p-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 mt-0.5">
                        {getInitials(mat.estudianteNombre)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 leading-snug">{mat.estudianteNombre}</h3>
                        <p className="text-[10.5px] text-slate-500 font-medium">{mat.programaNombre}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-400">
                          <span>{mat.documento}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">{mat.codigoMatricula}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        {mat.status}
                      </span>
                      <Link href={`/matriculas/${mat.id}`} className="text-[10px] font-bold text-brand-700 hover:underline">
                        Ver detalle →
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB 2: ESTUDIANTES */}
      {activeTab === 'estudiantes' && (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4" scope="col">Estudiante / Documento</th>
                  <th className="py-3 px-3" scope="col">Código Institucional</th>
                  <th className="py-3 px-3" scope="col">Contacto</th>
                  <th className="py-3 px-3" scope="col">Fecha de Alta</th>
                  <th className="py-3 px-3" scope="col">Estado</th>
                  <th className="py-3 px-4 text-right" scope="col">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {estudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No hay estudiantes registrados en base de datos.
                    </td>
                  </tr>
                ) : (
                  estudiantes.map(est => (
                    <tr key={est.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{est.nombreCompleto}</div>
                        <div className="text-[11px] text-slate-500">{est.documento}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">{est.codigoEstudiante}</td>
                      <td className="py-3 px-3 text-slate-600">{est.contacto}</td>
                      <td className="py-3 px-3 text-slate-600">{est.fechaAlta}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {est.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/personas/${est.personaId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-brand-700 bg-red-50 hover:bg-red-100 transition"
                        >
                          Expediente
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-slate-100">
            {estudiantes.map(est => (
              <article key={est.id} className="p-3 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 mt-0.5">
                      {getInitials(est.nombreCompleto)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 leading-snug">{est.nombreCompleto}</h3>
                      <p className="text-[10.5px] text-slate-500 font-medium">{est.contacto}</p>
                      <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-400">
                        <span>{est.documento}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">{est.codigoEstudiante}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      {est.status}
                    </span>
                    <Link href={`/personas/${est.personaId}`} className="text-[10px] font-bold text-brand-700 hover:underline">
                      Ver perfil →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* TAB 3: PENDIENTES DE PAGO (CUOTAS) */}
      {activeTab === 'cuotas' && (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4" scope="col">Matrícula / Estudiante</th>
                  <th className="py-3 px-3" scope="col">Concepto</th>
                  <th className="py-3 px-3" scope="col">Vencimiento</th>
                  <th className="py-3 px-3 text-right" scope="col">Saldo Pendiente</th>
                  <th className="py-3 px-3" scope="col">Estado</th>
                  <th className="py-3 px-4 text-right" scope="col">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cuotasPendientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No existen cuotas pendientes de cobro.
                    </td>
                  </tr>
                ) : (
                  cuotasPendientes.map(cuota => (
                    <tr key={cuota.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{cuota.codigoMatricula}</div>
                        <div className="text-[11px] text-slate-500">{cuota.estudianteNombre}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{cuota.concepto}</td>
                      <td className="py-3 px-3 text-slate-600">{cuota.fechaVencimiento}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        S/ {cuota.saldo.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            cuota.status === 'VENCIDA'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {cuota.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/matriculas/${cuota.matriculaId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-brand-700 bg-red-50 hover:bg-red-100 transition"
                        >
                          Cobrar / Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-slate-100">
            {cuotasPendientes.map(cuota => (
              <article key={cuota.id} className="p-3 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{cuota.concepto} — S/ {cuota.saldo.toFixed(2)}</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">{cuota.estudianteNombre}</p>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-400">
                      <span className="font-mono text-slate-600">{cuota.codigoMatricula}</span>
                      <span>•</span>
                      <span>Vence: {cuota.fechaVencimiento}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                      {cuota.status}
                    </span>
                    <Link href={`/matriculas/${cuota.matriculaId}`} className="text-[10px] font-bold text-brand-700 hover:underline">
                      Registrar pago →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Pie de tabla con conteo real */}
      <div className="p-3 sm:bg-slate-50/50 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
        <span>
          Mostrando <strong>{shownCount}</strong> de <strong>{totalCount}</strong> registros en base de datos
        </span>
        <span className="flex items-center gap-1 text-emerald-700 font-medium">
          <CheckCircle className="w-3 h-3" />
          Sincronizado con PostgreSQL / Supabase
        </span>
      </div>
    </div>
  )
}
