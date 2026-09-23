import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, PlusCircle } from "lucide-react";

const cursos = [
  { id: 1, code: "MAT-101", name: "Matemáticas Básicas", capacity: 30 },
  { id: 2, code: "FIS-201", name: "Física General", capacity: 25 },
  { id: 3, code: "PROG-101", name: "Introducción a la Programación", capacity: 40 },
];

export default function OfertaAcademicaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Oferta Académica</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Curso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Cursos Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Código</th>
                  <th className="p-4 font-medium">Nombre del Curso</th>
                  <th className="p-4 font-medium">Capacidad</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((curso) => (
                  <tr key={curso.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{curso.code}</td>
                    <td className="p-4">{curso.name}</td>
                    <td className="p-4">{curso.capacity}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost">Editar</Button>
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
