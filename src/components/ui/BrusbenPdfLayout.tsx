import React from 'react'

export interface BrusbenPdfHeaderProps {
  documentType: string
  documentTitle: string
  code: string
  statusBadge?: string | null
  statusColor?: 'green' | 'amber' | 'red' | 'slate'
  issuedAt?: string
  sede?: string
}

const BADGE_STYLES: Record<NonNullable<BrusbenPdfHeaderProps['statusColor']>, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-300',
}

export function BrusbenPdfHeader({
  documentType,
  documentTitle,
  code,
  statusBadge,
  statusColor = 'slate',
  issuedAt,
  sede = 'Sede Central / Nacional',
}: BrusbenPdfHeaderProps) {
  const formattedDate =
    issuedAt ||
    new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <header className="border-b-[3px] border-[#AD0000] pb-4 mb-5 break-inside-avoid">
      <div className="flex flex-col sm:flex-row print:flex-row items-start sm:items-center print:items-center justify-between gap-4">
        {/* Columna Izquierda: Logotipo Oficial y Membrete Institucional */}
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-brusben.png"
            alt="Centro de Capacitaciones Brusben"
            className="h-14 w-auto object-contain shrink-0"
          />
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#AD0000]">
              ERP Académico Institucional
            </p>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase leading-tight">
              Centro de Capacitaciones Brusben
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Formación Continua, Especialización Profesional y Certificación
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {sede} — Tumbes, Perú
            </p>
          </div>
        </div>

        {/* Columna Derecha: Recuadro Formal de Control Documental */}
        <div className="w-full sm:w-auto print:w-auto min-w-[230px] border-2 border-slate-800 rounded-lg p-3 bg-slate-50/70 text-left sm:text-right print:text-right shrink-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#AD0000]">
            {documentType}
          </p>
          <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
            {code}
          </p>
          <div className="mt-1.5 flex sm:justify-end print:justify-end items-center gap-2 flex-wrap">
            {statusBadge && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${BADGE_STYLES[statusColor]}`}
              >
                {statusBadge}
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-medium">
              Emisión: {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Franja de Título del Documento */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
          {documentTitle}
        </h2>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Documento Oficial Verificable
        </span>
      </div>
    </header>
  )
}

export interface BrusbenPdfFooterProps {
  leftSignatureLabel?: string
  rightSignatureLabel?: string
  verificationCode?: string
  showSignatures?: boolean
  singleSignature?: boolean
}

export function BrusbenPdfFooter({
  leftSignatureLabel = 'Firma del Estudiante / Titular',
  rightSignatureLabel = 'Sello y Firma Autorizada — Dirección Académica / Administración Brusben',
  verificationCode,
  showSignatures = true,
  singleSignature = false,
}: BrusbenPdfFooterProps) {
  return (
    <footer className="mt-8 pt-4 border-t border-slate-200 break-inside-avoid">
      {showSignatures && (
        singleSignature ? (
          <div className="flex justify-center pt-8 pb-4 px-4">
            <div className="text-center">
              <div className="border-t border-slate-400 pt-2 mx-auto min-w-[280px]">
                <p className="text-xs font-bold text-slate-800">
                  {rightSignatureLabel}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Centro de Capacitaciones Brusben
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-10 pt-10 pb-5 px-4">
            <div className="text-center">
              <div className="border-t border-slate-400 pt-2 mx-auto max-w-[240px]">
                <p className="text-xs font-bold text-slate-800">
                  {leftSignatureLabel}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Conformidad de datos y condiciones académicas
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-2 mx-auto max-w-[260px]">
                <p className="text-xs font-bold text-slate-800">
                  {rightSignatureLabel}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Centro de Capacitaciones Brusben
                </p>
              </div>
            </div>
          </div>
        )
      )}

      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row print:flex-row items-start sm:items-center print:items-center justify-between gap-2 text-[10px] text-slate-500">
        <div>
          <span className="font-bold text-slate-700">
            CENTRO DE CAPACITACIONES BRUSBEN
          </span>{' '}
          • Documento generado oficialmente por el Sistema ERP Académico Brusben.
        </div>
        <div className="font-mono text-slate-600">
          {verificationCode ? `REF: ${verificationCode}` : 'ERP-BRUSBEN-OFICIAL'}
        </div>
      </div>
    </footer>
  )
}
