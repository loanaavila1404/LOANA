import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, PlusCircle } from "lucide-react";

const usuarios = [
  { id: 1, username: "admin", role: "Administrador", lastLogin: "2023-10-25 10:00 AM" },
  { id: 2, username: "jperez", role: "Docente", lastLogin: "2023-10-25 09:30 AM" },
  { id: 3, username: "mlopez", role: "Asistente", lastLogin: "2023-10-24 04:15 PM" },
];

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Usuarios y Accesos</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Control de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Usuario</th>
                  <th className="p-4 font-medium">Rol</th>
                  <th className="p-4 font-medium">Último Acceso</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{user.username}</td>
                    <td className="p-4">{user.role}</td>
                    <td className="p-4 text-muted-foreground">{user.lastLogin}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost">Permisos</Button>
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
