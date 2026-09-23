import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PieChart, Download, Users, BookOpen, DollarSign, BarChart } from "lucide-react";
import Link from "next/link";

const reports = [
  { id: 1, title: "Reporte Financiero Mensual", description: "Resumen de ingresos y cuotas.", type: "Finanzas", icon: DollarSign, link: "/reportes/financiero" },
  { id: 2, title: "Asistencia de Estudiantes", description: "Métricas de asistencia por ciclo y programa.", type: "Académico", icon: BookOpen, link: "/reportes/asistencia" },
  { id: 3, title: "Tasa de Conversión CRM", description: "Prospectos convertidos a matrículas.", type: "Comercial", icon: BarChart, link: "/reportes/crm" },
  { id: 4, title: "Demografía de Alumnos", description: "Distribución por edad, ubicación, etc.", type: "General", icon: Users, link: "/reportes/demografia" },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-graphite-900">Reportes</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-graphite-900">
                  <Icon className="h-5 w-5 text-brand-500" />
                  {report.title}
                </CardTitle>
                <p className="text-sm text-graphite-600 mt-2">{report.description}</p>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-graphite-600 mb-4">
                  <p>Categoría: <span className="font-medium text-graphite-900">{report.type}</span></p>
                </div>
                <div className="flex gap-2">
                  <Link href={report.link} className="flex-1 block">
                    <Button variant="outline" className="w-full">
                      Ver Reporte
                    </Button>
                  </Link>
                  <Button variant="outline" className="px-3" title="Descargar PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
