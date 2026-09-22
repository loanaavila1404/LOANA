-- migrate:up

CREATE TABLE IF NOT EXISTS programas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    nombre text NOT NULL,
    tipo_programa text CHECK (tipo_programa IN ('CARRERA_TECNICA', 'CURSO_CORTO', 'PROGRAMA_VARIABLE')),
    duracion_cantidad int,
    duracion_unidad text,
    total_ciclos int,
    descripcion text,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_programas_updated_at BEFORE UPDATE ON programas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS planes_estudio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    programa_id uuid REFERENCES programas(id) ON DELETE RESTRICT,
    codigo text UNIQUE NOT NULL,
    nombre text NOT NULL,
    version text,
    fecha_vigencia_desde date,
    fecha_vigencia_hasta date,
    total_ciclos int,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_planes_estudio_updated_at BEFORE UPDATE ON planes_estudio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS periodos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    nombre text NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_periodos_updated_at BEFORE UPDATE ON periodos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS ciclos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid REFERENCES planes_estudio(id) ON DELETE RESTRICT,
    numero_orden int,
    codigo text,
    nombre text,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid,
    UNIQUE(plan_id, numero_orden)
);

CREATE TRIGGER update_ciclos_updated_at BEFORE UPDATE ON ciclos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS cursos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid REFERENCES planes_estudio(id) ON DELETE RESTRICT,
    ciclo_id uuid REFERENCES ciclos(id) ON DELETE RESTRICT,
    codigo text,
    nombre text,
    horas_semanales int,
    creditos int,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS turnos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    nombre text NOT NULL,
    active boolean DEFAULT true,
    sort_order int
);

CREATE TABLE IF NOT EXISTS modalidades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    nombre text NOT NULL,
    active boolean DEFAULT true,
    sort_order int
);

CREATE TABLE IF NOT EXISTS ediciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    programa_id uuid REFERENCES programas(id) ON DELETE RESTRICT,
    plan_id uuid REFERENCES planes_estudio(id) ON DELETE RESTRICT,
    periodo_id uuid REFERENCES periodos(id) ON DELETE RESTRICT,
    ciclo_id uuid REFERENCES ciclos(id) ON DELETE RESTRICT,
    codigo text UNIQUE NOT NULL,
    nombre text,
    fecha_inicio date,
    fecha_fin date,
    turno text,
    modalidad text,
    vacantes int,
    precio_matricula numeric(10,2),
    precio_pension numeric(10,2),
    numero_pensiones int,
    dias_reserva int DEFAULT 7,
    primer_vencimiento date,
    frecuencia_meses int DEFAULT 1,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_ediciones_updated_at BEFORE UPDATE ON ediciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS horarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    edicion_id uuid REFERENCES ediciones(id) ON DELETE RESTRICT,
    curso_id uuid REFERENCES cursos(id) ON DELETE RESTRICT,
    dia_semana text CHECK (dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
    hora_inicio time,
    hora_fin time,
    ubicacion text,
    docente text,
    observaciones text,
    status text DEFAULT 'ACTIVO',
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

CREATE TRIGGER update_horarios_updated_at BEFORE UPDATE ON horarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO turnos (codigo, nombre, sort_order) VALUES
('MANANA', 'Mañana', 1),
('TARDE', 'Tarde', 2),
('NOCHE', 'Noche', 3)
ON CONFLICT DO NOTHING;

INSERT INTO modalidades (codigo, nombre, sort_order) VALUES
('PRESENCIAL', 'Presencial', 1),
('SEMIPRESENCIAL', 'Semipresencial', 2),
('VIRTUAL', 'Virtual', 3)
ON CONFLICT DO NOTHING;
