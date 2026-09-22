-- migrate:up

-- Tabla de Personas
CREATE TABLE IF NOT EXISTS personas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento text,
    numero_documento text,
    nombres text,
    apellido_paterno text,
    apellido_materno text,
    fecha_nacimiento date,
    telefono text,
    email text,
    direccion text,
    departamento text,
    provincia text,
    distrito text,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (tipo_documento, numero_documento)
);
COMMENT ON TABLE personas IS 'Registro único de personas (Datos demográficos)';

CREATE TRIGGER update_personas_updated_at
BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices de búsqueda para personas
CREATE INDEX idx_personas_doc ON personas(numero_documento);
CREATE INDEX idx_personas_nombres ON personas(nombres, apellido_paterno);
CREATE INDEX idx_personas_contacto ON personas(telefono, email);

-- Tabla de Estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE RESTRICT UNIQUE,
    codigo_estudiante text UNIQUE,
    fecha_ingreso date,
    status text DEFAULT 'ACTIVO',
    observaciones text,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);
COMMENT ON TABLE estudiantes IS 'Registro de estudiantes (Roles institucionales)';

CREATE TRIGGER update_estudiantes_updated_at
BEFORE UPDATE ON estudiantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_estudiantes_codigo ON estudiantes(codigo_estudiante);
