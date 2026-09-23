import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserCheck, PlusCircle } from "lucide-react";

const personas = [
  { id: 1, name: "María López", role: "Estudiante", status: "Activo" },
  { id: 2, name: "Pedro Martínez", role: "Docente", status: "Activo" },
  { id: 3, name: "Laura Gómez", role: "Acudiente", status: "Inactivo" },
];

export default function PersonasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Estudiantes y Personas</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Persona
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Directorio de Personas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Nombre</th>
                  <th className="p-4 font-medium">Rol</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((persona) => (
                  <tr key={persona.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4">{persona.name}</td>
                    <td className="p-4">{persona.role}</td>
                    <td className="p-4">{persona.status}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost">Ver perfil</Button>
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
