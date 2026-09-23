import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PieChart, Download } from "lucide-react";

const reportes = [
  { id: 1, title: "Reporte Financiero Mensual", type: "Finanzas", date: "Octubre 2023" },
  { id: 2, title: "Asistencia de Estudiantes", type: "Académico", date: "Semestre 2" },
  { id: 3, title: "Tasa de Conversión CRM", type: "Comercial", date: "Q3 2023" },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Reportes</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportes.map((reporte) => (
          <Card key={reporte.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-muted-foreground" />
                {reporte.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                <p>Categoría: <span className="font-medium text-foreground">{reporte.type}</span></p>
                <p>Periodo: <span className="font-medium text-foreground">{reporte.date}</span></p>
              </div>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
