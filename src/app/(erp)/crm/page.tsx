import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, PlusCircle } from "lucide-react";

const leads = [
  { id: 1, name: "Juan Pérez", email: "juan@example.com", status: "Nuevo" },
  { id: 2, name: "Ana Gómez", email: "ana@example.com", status: "Contactado" },
  { id: 3, name: "Carlos Ruiz", email: "carlos@example.com", status: "Convertido" },
];

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">CRM Comercial</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Últimos Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Nombre</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4">{lead.name}</td>
                    <td className="p-4">{lead.email}</td>
                    <td className="p-4">{lead.status}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost">Ver detalles</Button>
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
