-- migrate:up

CREATE TABLE IF NOT EXISTS catalogos_comerciales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_catalogo text NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    orden int,
    active boolean DEFAULT true,
    es_sistema boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tipo_catalogo, codigo)
);

CREATE TRIGGER update_catalogos_updated_at BEFORE UPDATE ON catalogos_comerciales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS prospectos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    tipo_documento text,
    numero_documento text,
    nombres text,
    apellidos text,
    telefono text,
    telefono_alt text,
    email text,
    departamento text,
    provincia text,
    distrito text,
    programa_id uuid REFERENCES programas(id) ON DELETE RESTRICT,
    plan_id uuid REFERENCES planes_estudio(id) ON DELETE RESTRICT,
    edicion_id uuid REFERENCES ediciones(id) ON DELETE RESTRICT,
    modalidad text,
    turno text,
    canal_captacion text,
    campana text,
    asesor_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    status text DEFAULT 'NUEVO',
    nivel_interes text,
    proximo_seguimiento_en timestamptz,
    ultimo_contacto_en timestamptz,
    consentimiento_contacto boolean,
    observaciones text,
    motivo_perdida text,
    detalle_perdida text,
    persona_id uuid REFERENCES personas(id) ON DELETE RESTRICT,
    estudiante_id uuid REFERENCES estudiantes(id) ON DELETE RESTRICT,
    matricula_id uuid,
    fecha_conversion timestamptz,
    asesor_conversion_id uuid,
    status_registro text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

CREATE TRIGGER update_prospectos_updated_at BEFORE UPDATE ON prospectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS seguimientos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospecto_id uuid REFERENCES prospectos(id) ON DELETE RESTRICT,
    asesor_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    tipo_actividad text,
    fecha_hora timestamptz,
    resultado text,
    nota text,
    estado_anterior text,
    estado_nuevo text,
    proximo_seguimiento timestamptz,
    status_registro text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

CREATE TRIGGER update_seguimientos_updated_at BEFORE UPDATE ON seguimientos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS tareas_comerciales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospecto_id uuid REFERENCES prospectos(id) ON DELETE RESTRICT,
    asesor_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    tipo_tarea text,
    titulo text,
    descripcion text,
    fecha_programada timestamptz,
    status text DEFAULT 'PENDIENTE',
    fecha_realizada timestamptz,
    resultado text,
    status_registro text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

CREATE TRIGGER update_tareas_comerciales_updated_at BEFORE UPDATE ON tareas_comerciales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS transferencias_prospectos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospecto_id uuid REFERENCES prospectos(id) ON DELETE RESTRICT,
    asesor_anterior_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    asesor_nuevo_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    fecha_hora timestamptz DEFAULT now(),
    motivo text,
    usuario_id uuid,
    status_registro text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    created_by uuid
);

INSERT INTO catalogos_comerciales (tipo_catalogo, codigo, nombre, es_sistema) VALUES
('CANAL', 'FACEBOOK', 'Facebook Ads', true),
('CANAL', 'INSTAGRAM', 'Instagram Ads', true),
('CANAL', 'WHATSAPP', 'WhatsApp', true),
('CANAL', 'REFERIDO', 'Referido', true),
('CANAL', 'ORGANICO', 'Búsqueda Orgánica', true)
ON CONFLICT DO NOTHING;
