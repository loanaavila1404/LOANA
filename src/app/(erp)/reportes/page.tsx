import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, Users, BookOpen, DollarSign, BarChart } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Reportes Institucionales - ERP Brusben'
};

export default async function ReportesPage() {
  await requirePermission(['REPORTES.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();

  const [
    { data: pagosData },
    { data: cuotasData },
    { data: matriculasData },
    { data: edicionesData },
    { data: prospectosData },
    { count: totalPersonas },
    { count: totalEstudiantesActivos },
  ] = await Promise.all([
    supabase.from('pagos').select('importe, status'),
    supabase.from('cuotas').select('importe_neto, saldo, status'),
    supabase.from('matriculas').select('id, status'),
    supabase.from('ediciones').select('id, vacantes, status').eq('status', 'ACTIVO'),
    supabase.from('prospectos').select('id, status, matricula_id'),
    supabase.from('personas').select('*', { count: 'exact', head: true }),
    supabase.from('estudiantes').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVO'),
  ]);

  // 1. KPIs Financieros
  const totalRecaudado = (pagosData || [])
    .filter(p => p.status === 'REGISTRADO' || p.status === 'ACTIVO')
    .reduce((acc, p) => acc + Number(p.importe || 0), 0);

  const saldoPendiente = (cuotasData || [])
    .filter(c => c.status === 'PENDIENTE' || c.status === 'PARCIAL' || c.status === 'VENCIDA')
    .reduce((acc, c) => acc + Number(c.saldo ?? c.importe_neto ?? 0), 0);

  // 2. KPIs Académicos y Matrículas
  const totalMatriculas = (matriculasData || []).length;
  const matriculasActivas = (matriculasData || []).filter(m => m.status === 'ACTIVA').length;
  const edicionesActivas = (edicionesData || []).length;
  const vacantesTotales = (edicionesData || []).reduce((acc, ed) => acc + Number(ed.vacantes || 0), 0);

  // 3. KPIs Comercial CRM
  const totalProspectos = (prospectosData || []).length;
  const prospectosConvertidos = (prospectosData || []).filter(
    pr => pr.status === 'MATRICULADO' || pr.status === 'CONVERTIDO' || Boolean(pr.matricula_id)
  ).length;
  const tasaConversion = totalProspectos > 0 ? ((prospectosConvertidos / totalProspectos) * 100).toFixed(1) : '0.0';

  // 4. KPIs Padrón de Estudiantes / Demografía
  const personasCount = totalPersonas || 0;
  const estudiantesActivosCount = totalEstudiantesActivos || 0;

  const reports = [
    {
      id: 'financiero',
      title: 'Reporte Financiero y Cobranza',
      description: 'Resumen real de ingresos recaudados, cuotas emitidas y saldos pendientes.',
      type: 'Finanzas',
      icon: DollarSign,
      link: '/reportes/financiero',
      pdfLink: '/reportes/financiero?print=1',
      metrics: [
        { label: 'Total Recaudado', value: `S/ ${totalRecaudado.toFixed(2)}` },
        { label: 'Saldo por Cobrar', value: `S/ ${saldoPendiente.toFixed(2)}` },
      ],
    },
    {
      id: 'academico',
      title: 'Matrículas y Ocupación Académica',
      description: 'Métricas de matrículas por estado, ediciones activas y cobertura de vacantes.',
      type: 'Académico',
      icon: BookOpen,
      link: '/reportes/academico',
      pdfLink: '/reportes/academico?print=1',
      metrics: [
        { label: 'Matrículas Activas / Total', value: `${matriculasActivas} / ${totalMatriculas}` },
        { label: 'Ediciones Activas (Vacantes)', value: `${edicionesActivas} (${vacantesTotales} vac.)` },
      ],
    },
    {
      id: 'crm',
      title: 'Tasa de Conversión CRM',
      description: 'Embudo comercial de prospectos captados y efectividad de conversión a matrícula.',
      type: 'Comercial',
      icon: BarChart,
      link: '/reportes/crm',
      pdfLink: '/reportes/crm?print=1',
      metrics: [
        { label: 'Total Prospectos', value: `${totalProspectos}` },
        { label: 'Conversión a Matrícula', value: `${prospectosConvertidos} (${tasaConversion}%)` },
      ],
    },
    {
      id: 'demografia',
      title: 'Padrón y Demografía de Alumnos',
      description: 'Distribución geográfica, documental y estado del padrón de personas y estudiantes.',
      type: 'General',
      icon: Users,
      link: '/reportes/demografia',
      pdfLink: '/reportes/demografia?print=1',
      metrics: [
        { label: 'Personas Registradas', value: `${personasCount}` },
        { label: 'Estudiantes Activos', value: `${estudiantesActivosCount}` },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes Institucionales</h1>
          <p className="text-sm text-slate-500">
            Indicadores operativos en tiempo real y generación de reportes imprimibles en PDF.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                    <Icon className="h-5 w-5 text-red-600" />
                    {report.title}
                  </CardTitle>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {report.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1.5">{report.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {report.metrics.map((m, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Link href={report.link} className="flex-1 block">
                    <Button variant="outline" className="w-full">
                      Ver Reporte Detallado
                    </Button>
                  </Link>
                  <Link href={report.pdfLink} title="Vista de impresión / Guardar PDF">
                    <Button variant="outline" className="px-3 inline-flex items-center gap-1.5" title="Descargar PDF">
                      <Download className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-semibold">PDF</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
