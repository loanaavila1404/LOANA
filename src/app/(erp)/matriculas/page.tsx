import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreditCard, PlusCircle } from "lucide-react";

const matriculas = [
  { id: 1, student: "Juan Pérez", course: "MAT-101", amount: "$500.00", status: "Pagado" },
  { id: 2, student: "Ana Gómez", course: "FIS-201", amount: "$500.00", status: "Pendiente" },
  { id: 3, student: "Carlos Ruiz", course: "PROG-101", amount: "$600.00", status: "Pagado" },
];

export default function MatriculasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Matrículas y Pagos</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Matrícula
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registro de Matrículas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Estudiante</th>
                  <th className="p-4 font-medium">Curso</th>
                  <th className="p-4 font-medium">Monto</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matriculas.map((mat) => (
                  <tr key={mat.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4">{mat.student}</td>
                    <td className="p-4">{mat.course}</td>
                    <td className="p-4">{mat.amount}</td>
                    <td className="p-4">{mat.status}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost">Gestionar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
