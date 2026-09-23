import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Settings, Lock } from "lucide-react";

export default function PerfilPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Mi Perfil</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                <p className="text-base">Administrador del Sistema</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
                <p className="text-base">admin@brusben.edu</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                <p className="text-base">Superadmin</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                <p className="text-base">Tecnología</p>
              </div>
            </div>
            <div className="pt-4 flex gap-2">
              <Button>
                <Settings className="mr-2 h-4 w-4" />
                Editar Perfil
              </Button>
              <Button variant="outline">
                <Lock className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
