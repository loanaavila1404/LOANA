import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { AuditoriaFiltros } from "@/components/features/auditoria/AuditoriaFiltros";

export default async function AuditoriaPage(props: { searchParams: Promise<{ entity?: string, action?: string }> }) {
  const searchParams = await props.searchParams;
  const entity = searchParams?.entity || "";
  const action = searchParams?.action || "";

  const supabase = await createClient();
  let query = supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(100);

  if (entity) {
    query = query.eq("entity", entity);
  }
  if (action) {
    query = query.eq("action", action);
  }

  const { data: logs,  } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-graphite-900">Auditoría</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditoriaFiltros currentEntity={entity} currentAction={action} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp || "").toLocaleString("es-ES")}</TableCell>
                  <TableCell>{log.module || "-"}</TableCell>
                  <TableCell>{log.entity || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={log.action === "INSERT" ? "success" : log.action === "UPDATE" ? "warning" : log.action === "DELETE" ? "danger" : "default"}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.user_id || "Sistema"}</TableCell>
                  <TableCell>
                    <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={log.detail || JSON.stringify(log.data_after || log.data_before || {})}>
                      {log.detail || JSON.stringify(log.data_after || log.data_before || {})}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-graphite-500">
                    No se encontraron registros de auditoría.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
