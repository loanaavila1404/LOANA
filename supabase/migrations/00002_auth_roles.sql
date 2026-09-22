-- migrate:up

-- Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    is_system boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE roles IS 'Roles del sistema';

CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de Permisos
CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    module text,
    description text
);
COMMENT ON TABLE permissions IS 'Permisos del sistema';

-- Tabla Intermedia Role-Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id uuid REFERENCES roles(id) ON DELETE RESTRICT,
    permission_id uuid REFERENCES permissions(id) ON DELETE RESTRICT,
    PRIMARY KEY (role_id, permission_id)
);
COMMENT ON TABLE role_permissions IS 'Asignación de permisos a roles';

-- Tabla de Perfiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    email text,
    display_name text,
    photo_url text,
    role_id uuid REFERENCES roles(id) ON DELETE RESTRICT,
    persona_id uuid,
    status text DEFAULT 'INVITADO' CHECK (status IN ('INVITADO', 'ACTIVO', 'BLOQUEADO', 'INACTIVO')),
    invited_at timestamptz,
    activated_at timestamptz,
    last_access_at timestamptz,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);
COMMENT ON TABLE profiles IS 'Perfiles de usuario del sistema';

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserción de roles
INSERT INTO roles (code, name, is_system) VALUES
('SUPERADMIN', 'Super Administrador', true),
('DIRECCION', 'Dirección', true),
('ADMINISTRACION', 'Administración', true),
('CAJA', 'Caja', true),
('COORDINACION_ACADEMICA', 'Coordinación Académica', true),
('ASESOR_COMERCIAL', 'Asesor Comercial', true),
('DOCENTE', 'Docente', true),
('ESTUDIANTE', 'Estudiante', true)
ON CONFLICT (code) DO NOTHING;

-- Inserción de permisos
INSERT INTO permissions (code, name, module) VALUES
('SISTEMA.ADMINISTRAR', 'Administrar Sistema', 'Sistema'),
('CONFIGURACION.VER', 'Ver Configuración', 'Configuración'),
('CONFIGURACION.EDITAR', 'Editar Configuración', 'Configuración'),
('USUARIOS.VER', 'Ver Usuarios', 'Usuarios'),
('USUARIOS.GESTIONAR', 'Gestionar Usuarios', 'Usuarios'),
('ROLES.VER', 'Ver Roles', 'Usuarios'),
('AUDITORIA.VER', 'Ver Auditoría', 'Sistema'),
('ESTUDIANTES.VER', 'Ver Estudiantes', 'Académico'),
('ESTUDIANTES.EDITAR', 'Editar Estudiantes', 'Académico'),
('PROGRAMAS.VER', 'Ver Programas', 'Académico'),
('PROGRAMAS.EDITAR', 'Editar Programas', 'Académico'),
('MATRICULAS.VER', 'Ver Matrículas', 'Matrículas'),
('MATRICULAS.GESTIONAR', 'Gestionar Matrículas', 'Matrículas'),
('MATRICULAS.DESCUENTOS_AUTORIZAR', 'Autorizar Descuentos en Matrícula', 'Matrículas'),
('COBRANZA.VER', 'Ver Cobranza', 'Finanzas'),
('PAGOS.REGISTRAR', 'Registrar Pagos', 'Finanzas'),
('PAGOS.ANULAR', 'Anular Pagos', 'Finanzas'),
('CRM.VER', 'Ver CRM', 'Comercial'),
('CRM.GESTIONAR', 'Gestionar CRM', 'Comercial'),
('CRM.ADMINISTRAR', 'Administrar CRM', 'Comercial'),
('CRM.CONVERSION_SOLICITAR', 'Solicitar Conversión', 'Comercial'),
('MATRICULA.CONFIRMAR', 'Confirmar Matrícula', 'Matrículas'),
('MATRICULA.ACTIVAR', 'Activar Matrícula', 'Matrículas'),
('DESCUENTO.AUTORIZAR', 'Autorizar Descuento', 'Matrículas'),
('ACADEMICO.VER', 'Ver Información Académica', 'Académico'),
('ACADEMICO.GESTIONAR', 'Gestionar Información Académica', 'Académico'),
('NOTAS.REGISTRAR', 'Registrar Notas', 'Académico'),
('PERFIL_PROPIO.VER', 'Ver Perfil Propio', 'General'),
('ACADEMICO_PROPIO.VER', 'Ver Información Académica Propia', 'General'),
('PAGOS_PROPIOS.VER', 'Ver Pagos Propios', 'General')
ON CONFLICT (code) DO NOTHING;

-- Asignar todos los permisos al SUPERADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'SUPERADMIN'
ON CONFLICT DO NOTHING;

-- Asignar permisos DIRECCION
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'DIRECCION' AND p.code IN (
    'CONFIGURACION.VER', 'USUARIOS.VER', 'ESTUDIANTES.VER', 'PROGRAMAS.VER', 
    'MATRICULAS.VER', 'COBRANZA.VER', 'CRM.VER', 'ACADEMICO.VER'
)
ON CONFLICT DO NOTHING;
