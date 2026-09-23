import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Activity, Download } from "lucide-react";

const logs = [
  { id: 1, action: "Inicio de sesión", user: "admin", date: "2023-10-25 10:00:05", ip: "192.168.1.10" },
  { id: 2, action: "Creación de registro", user: "jperez", date: "2023-10-25 09:45:12", ip: "192.168.1.22" },
  { id: 3, action: "Eliminación de curso", user: "admin", date: "2023-10-24 16:30:00", ip: "192.168.1.10" },
];

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Auditoría del Sistema</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Registro de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Fecha y Hora</th>
                  <th className="p-4 font-medium">Acción</th>
                  <th className="p-4 font-medium">Usuario</th>
                  <th className="p-4 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-muted-foreground">{log.date}</td>
                    <td className="p-4">{log.action}</td>
                    <td className="p-4 font-medium">{log.user}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{log.ip}</td>
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
