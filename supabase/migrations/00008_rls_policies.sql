-- migrate:up

-- Helper function para obtener el role_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_role_id()
RETURNS uuid AS $$
    SELECT role_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function para verificar permiso
CREATE OR REPLACE FUNCTION has_permission(permission_code text)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = get_user_role_id() AND p.code = permission_code
    ) OR EXISTS (
        -- Si es superadmin asume true, adaptalo según necesidad
        SELECT 1 FROM roles r WHERE r.id = get_user_role_id() AND r.code = 'SUPERADMIN'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS en todas las tablas
ALTER TABLE institutional_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes_estudio ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ediciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogos_comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pago_aplicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Perfiles
CREATE POLICY "Profiles - Read own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Profiles - Read all" ON profiles FOR SELECT USING (has_permission('USUARIOS.VER'));
CREATE POLICY "Profiles - Manage" ON profiles FOR ALL USING (has_permission('USUARIOS.GESTIONAR'));

-- Personas & Estudiantes
CREATE POLICY "Personas - Read" ON personas FOR SELECT USING (has_permission('ESTUDIANTES.VER'));
CREATE POLICY "Personas - Edit" ON personas FOR ALL USING (has_permission('ESTUDIANTES.EDITAR'));
CREATE POLICY "Estudiantes - Read" ON estudiantes FOR SELECT USING (has_permission('ESTUDIANTES.VER'));
CREATE POLICY "Estudiantes - Edit" ON estudiantes FOR ALL USING (has_permission('ESTUDIANTES.EDITAR'));

-- Oferta Académica
CREATE POLICY "Programas - Read" ON programas FOR SELECT USING (has_permission('PROGRAMAS.VER'));
CREATE POLICY "Programas - Edit" ON programas FOR ALL USING (has_permission('PROGRAMAS.EDITAR'));
CREATE POLICY "Planes - Read" ON planes_estudio FOR SELECT USING (has_permission('PROGRAMAS.VER'));
CREATE POLICY "Planes - Edit" ON planes_estudio FOR ALL USING (has_permission('PROGRAMAS.EDITAR'));
CREATE POLICY "Periodos - Read" ON periodos FOR SELECT USING (has_permission('PROGRAMAS.VER'));
CREATE POLICY "Periodos - Edit" ON periodos FOR ALL USING (has_permission('PROGRAMAS.EDITAR'));
CREATE POLICY "Ciclos - Read" ON ciclos FOR SELECT USING (has_permission('PROGRAMAS.VER'));
CREATE POLICY "Ciclos - Edit" ON ciclos FOR ALL USING (has_permission('PROGRAMAS.EDITAR'));
CREATE POLICY "Cursos - Read" ON cursos FOR SELECT USING (has_permission('PROGRAMAS.VER'));
CREATE POLICY "Cursos - Edit" ON cursos FOR ALL USING (has_permission('PROGRAMAS.EDITAR'));
CREATE POLICY "Ediciones - Read" ON ediciones FOR SELECT USING (has_permission('PROGRAMAS.VER'));
CREATE POLICY "Ediciones - Edit" ON ediciones FOR ALL USING (has_permission('PROGRAMAS.EDITAR'));
CREATE POLICY "Horarios - Read" ON horarios FOR SELECT USING (has_permission('PROGRAMAS.VER'));
CREATE POLICY "Horarios - Edit" ON horarios FOR ALL USING (has_permission('PROGRAMAS.EDITAR'));

-- CRM
CREATE POLICY "Prospectos - Read" ON prospectos FOR SELECT USING (has_permission('CRM.VER'));
CREATE POLICY "Prospectos - Edit" ON prospectos FOR ALL USING (has_permission('CRM.GESTIONAR'));
CREATE POLICY "Seguimientos - Read" ON seguimientos FOR SELECT USING (has_permission('CRM.VER'));
CREATE POLICY "Seguimientos - Edit" ON seguimientos FOR ALL USING (has_permission('CRM.GESTIONAR'));
CREATE POLICY "Tareas - Read" ON tareas_comerciales FOR SELECT USING (has_permission('CRM.VER'));
CREATE POLICY "Tareas - Edit" ON tareas_comerciales FOR ALL USING (has_permission('CRM.GESTIONAR'));

-- Matrículas y Pagos
CREATE POLICY "Matriculas - Read" ON matriculas FOR SELECT USING (has_permission('MATRICULAS.VER'));
CREATE POLICY "Matriculas - Edit" ON matriculas FOR ALL USING (has_permission('MATRICULAS.GESTIONAR'));
CREATE POLICY "Cuotas - Read" ON cuotas FOR SELECT USING (has_permission('COBRANZA.VER'));
CREATE POLICY "Cuotas - Edit" ON cuotas FOR ALL USING (has_permission('PAGOS.REGISTRAR') OR has_permission('PAGOS.ANULAR'));
CREATE POLICY "Pagos - Read" ON pagos FOR SELECT USING (has_permission('COBRANZA.VER'));
CREATE POLICY "Pagos - Insert" ON pagos FOR INSERT WITH CHECK (has_permission('PAGOS.REGISTRAR'));
CREATE POLICY "Pagos - Update" ON pagos FOR UPDATE USING (has_permission('PAGOS.ANULAR'));

-- Auditoría
CREATE POLICY "AuditLogs - Read" ON audit_logs FOR SELECT USING (has_permission('AUDITORIA.VER'));

-- Configuración Institucional
CREATE POLICY "Config - Read" ON institutional_config FOR SELECT USING (has_permission('CONFIGURACION.VER'));
CREATE POLICY "Config - Edit" ON institutional_config FOR UPDATE USING (has_permission('CONFIGURACION.EDITAR'));

-- Roles y Permisos (Sistema)
CREATE POLICY "Roles - Read" ON roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Roles - Edit" ON roles FOR ALL USING (has_permission('SISTEMA.ADMINISTRAR'));
CREATE POLICY "Permissions - Read" ON permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permissions - Edit" ON permissions FOR ALL USING (has_permission('SISTEMA.ADMINISTRAR'));
CREATE POLICY "RolePerms - Read" ON role_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "RolePerms - Edit" ON role_permissions FOR ALL USING (has_permission('SISTEMA.ADMINISTRAR'));

-- Turnos y Modalidades
CREATE POLICY "Turnos - Read" ON turnos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Turnos - Edit" ON turnos FOR ALL USING (has_permission('CONFIGURACION.EDITAR'));
CREATE POLICY "Modalidades - Read" ON modalidades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Modalidades - Edit" ON modalidades FOR ALL USING (has_permission('CONFIGURACION.EDITAR'));

-- Catálogos Comerciales
CREATE POLICY "CatalogosComerciales - Read" ON catalogos_comerciales FOR SELECT USING (has_permission('CRM.VER'));
CREATE POLICY "CatalogosComerciales - Edit" ON catalogos_comerciales FOR ALL USING (has_permission('CRM.ADMINISTRAR'));
