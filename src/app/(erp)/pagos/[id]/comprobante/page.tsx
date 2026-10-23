import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BrusbenPdfHeader, BrusbenPdfFooter } from '@/components/ui/BrusbenPdfLayout';
import { formatCurrency } from '@/lib/utils/currency';
import { ArrowLeft, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';

export const metadata = {
  title: 'Comprobante de Pago - ERP Brusben',
};

export default async function ComprobantePagoPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(['COBRANZA.VER', 'PAGOS.REGISTRAR', 'MATRICULAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await props.params;
  const pagoId = resolvedParams.id;

  if (!pagoId) notFound();

  // Consultar pago con estudiante, persona y aplicaciones
  const { data: pago, error: pagoError } = await supabase
    .from('pagos')
    .select(`
      *,
      estudiantes (
        id,
        codigo_estudiante,
        personas (
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          tipo_documento,
          numero_documento,
          telefono,
          email
        )
      ),
      pago_aplicaciones (
        id,
        cuota_id,
        importe_aplicado,
        cuotas (
          id,
          matricula_id,
          concepto,
          tipo_cuota,
          numero_cuota,
          fecha_vencimiento,
          importe_neto,
          saldo
        )
      )
    `)
    .eq('id', pagoId)
    .maybeSingle();

  if (pagoError || !pago) {
    notFound();
  }

  const est = Array.isArray(pago.estudiantes) ? pago.estudiantes[0] : pago.estudiantes;
  const persona = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas;

  // Consultar matrícula vinculada si existe a través de la primera cuota
  const firstCuota = pago.pago_aplicaciones?.[0]?.cuotas;
  let matriculaData = null;
  if (firstCuota?.matricula_id) {
    const { data: m } = await supabase
      .from('matriculas')
      .select('codigo_matricula, ediciones(codigo, nombre, programas(nombre))')
      .eq('id', firstCuota.matricula_id)
      .maybeSingle();
    matriculaData = m;
  }

  const ed = Array.isArray(matriculaData?.ediciones) ? matriculaData?.ediciones[0] : matriculaData?.ediciones;
  const prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas;

  const codigoBoleta = pago.comprobante_numero
    ? `${pago.comprobante_tipo || 'BOL'}-${pago.comprobante_numero}`
    : `REC-${pago.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:py-0 print:bg-white text-slate-800">
      {/* Barra superior de acciones (oculta al imprimir) */}
      <div className="max-w-[800px] mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/matriculas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-md shadow-2xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al ERP</span>
        </Link>

        <div className="flex items-center gap-2">
          <PrintButton label="Imprimir Boleta / PDF" />
        </div>
      </div>

      {/* Contenedor del Comprobante (Hoja A4 / Carta para impresión) */}
      <div className="max-w-[800px] mx-auto bg-white border border-slate-200 shadow-md p-8 sm:p-10 print:border-none print:shadow-none print:p-0 rounded-xl">
        {/* Encabezado Oficial */}
        <BrusbenPdfHeader
          documentType="BOLETA OFICIAL DE PAGO"
          documentTitle="Comprobante de Cancelación y Abono de Pensiones"
          code={codigoBoleta}
          statusBadge={pago.status === 'ANULADO' ? 'ANULADO' : 'PAGADO'}
          statusColor={pago.status === 'ANULADO' ? 'red' : 'green'}
          issuedAt={pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-PE') : undefined}
          sede="Sede Central · Tumbes"
        />

        {/* Datos del Alumno y de la Matrícula */}
        <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Datos del Estudiante
            </span>
            <p className="font-bold text-sm text-slate-900 mt-0.5">
              {persona?.nombres} {persona?.apellido_paterno} {persona?.apellido_materno}
            </p>
            <div className="mt-1 space-y-0.5 text-slate-600">
              <p>
                <strong>{persona?.tipo_documento || 'DNI'}:</strong> {persona?.numero_documento}
              </p>
              <p>
                <strong>Código Estudiantil:</strong> <span className="font-mono">{est?.codigo_estudiante || 'Pendiente'}</span>
              </p>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Programa Académico
            </span>
            <p className="font-bold text-sm text-slate-900 mt-0.5">
              {prog?.nombre || 'Formación Técnica / Continua'}
            </p>
            <div className="mt-1 space-y-0.5 text-slate-600">
              <p>
                <strong>Edición:</strong> {ed?.codigo || '-'} {ed?.nombre ? `(${ed.nombre})` : ''}
              </p>
              {matriculaData?.codigo_matricula && (
                <p>
                  <strong>N° Matrícula:</strong> <span className="font-mono font-bold text-[#AD0000]">{matriculaData.codigo_matricula}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Detalles de la Transacción */}
        <div className="grid grid-cols-3 gap-3 border border-slate-200 rounded-lg p-3 bg-white mb-5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Medio de Pago</span>
            <span className="font-bold text-slate-800">{pago.medio_pago || 'TRANSFERENCIA'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">N° Operación / Referencia</span>
            <span className="font-mono font-bold text-slate-800">{pago.numero_operacion || 'Caja / Directo'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Pago</span>
            <span className="font-bold text-slate-800">
              {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-PE') : '-'}
            </span>
          </div>
        </div>

        {/* Tabla de Conceptos Amortizados */}
        <div className="mb-6">
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Ítem / Concepto</th>
                <th className="py-2.5 px-3">Vencimiento Original</th>
                <th className="py-2.5 px-3 text-right">Importe Cuota</th>
                <th className="py-2.5 px-3 text-right">Monto Amortizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(!pago.pago_aplicaciones || pago.pago_aplicaciones.length === 0) ? (
                <tr>
                  <td colSpan={4} className="py-4 px-3 text-center text-slate-500 italic">
                    Pago general a cuenta de aranceles institucionales
                  </td>
                </tr>
              ) : (
                pago.pago_aplicaciones.map((app: any, idx: number) => {
                  const c = app.cuotas;
                  const label =
                    c?.concepto ||
                    (c?.tipo_cuota === 'MATRICULA' ? 'Derecho de Matrícula' : `Pensión N° 0${c?.numero_cuota || idx + 1}`);

                  return (
                    <tr key={app.id || idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {label}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {c?.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-PE') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatCurrency(Number(c?.importe_neto) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(Number(app.importe_aplicado) || 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-3 text-right uppercase text-slate-700">
                  Total Cancelado:
                </td>
                <td className="py-3 px-3 text-right text-sm font-black text-[#AD0000]">
                  {formatCurrency(Number(pago.importe) || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Nota Institucional y Firmas */}
        <div className="border-t border-slate-200 pt-4 mb-8 text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center gap-1 font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Certificación Oficial de Pago — Centro de Capacitaciones Brusben
          </p>
          <p>
            Este comprobante acredita la cancelación del importe indicado y la amortización de cuotas en el ERP Académico Institucional. Válido para trámites curriculares, constancias de no adeudo y evaluaciones periódicas.
          </p>
        </div>

        {/* Firmas y Sellos */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-dashed border-slate-300 text-center text-xs">
          <div>
            <div className="h-14" />
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-800">
                {persona?.nombres} {persona?.apellido_paterno}
              </p>
              <p className="text-[10px] text-slate-500">Firma del Estudiante / Titular</p>
            </div>
          </div>

          <div>
            <div className="h-14 flex items-center justify-center">
              <span className="font-mono text-[10px] font-bold text-emerald-700 border border-emerald-300 bg-emerald-50 px-2.5 py-1 rounded">
                ✓ PAGO REGISTRADO EN TESORERÍA
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-800">Área de Tesorería y Cobranzas</p>
              <p className="text-[10px] text-slate-500">Centro de Capacitaciones Brusben</p>
            </div>
          </div>
        </div>

        {/* Pie de página oficial */}
        <div className="mt-8">
          <BrusbenPdfFooter />
        </div>
      </div>
    </div>
  );
}
