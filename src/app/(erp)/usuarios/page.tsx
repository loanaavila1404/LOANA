import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { ShieldCheck, PlusCircle } from "lucide-react"
import { createClient } from '@/lib/supabase/server'
import { UserEditModal } from "@/components/features/usuarios/UserEditModal"

export default async function UsuariosPage() {
  const supabase = await createClient()

  // Fetch users and their roles
  const { data: perfiles } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      display_name,
      status,
      last_access_at,
      roles (
        name
      )
    `)
    .order('display_name')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-graphite-900 font-heading flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Usuarios y Accesos
          </h1>
          <p className="text-graphite-600 mt-1">Gestión de cuentas de usuario, roles y permisos</p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directorio de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {perfiles && perfiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Último acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfiles.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="font-medium text-graphite-900">{usuario.display_name || 'Sin nombre'}</div>
                      <div className="text-sm text-graphite-500">{usuario.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="font-mono text-xs">
                        {usuario.roles?.name || 'Sin Rol'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.status === 'ACTIVO' ? 'success' : 'danger'}>
                        {usuario.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-graphite-500">
                      {usuario.last_access_at ? new Date(usuario.last_access_at).toLocaleDateString('es-PE') : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserEditModal 
                        user={{
                          id: usuario.id,
                          display_name: usuario.display_name,
                          email: usuario.email,
                          status: usuario.status,
                          roleName: usuario.roles?.name || null
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-graphite-500">
              <ShieldCheck className="h-12 w-12 mb-4 text-graphite-300" />
              <p>No se encontraron usuarios en el sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
