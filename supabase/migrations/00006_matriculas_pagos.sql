-- migrate:up

CREATE TABLE IF NOT EXISTS matriculas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id uuid REFERENCES estudiantes(id) ON DELETE RESTRICT NOT NULL,
    edicion_id uuid REFERENCES ediciones(id) ON DELETE RESTRICT NOT NULL,
    ciclo_id uuid REFERENCES ciclos(id) ON DELETE RESTRICT,
    prospecto_id uuid REFERENCES prospectos(id) ON DELETE RESTRICT,
    asesor_comercial_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    codigo_matricula text UNIQUE NOT NULL,
    fecha_prematricula timestamptz,
    fecha_matricula date,
    ciclo_ingreso text,
    tipo_matricula text,
    status text DEFAULT 'PREMATRICULA' CHECK (status IN ('PREMATRICULA', 'RESERVADA', 'ACTIVA', 'FINALIZADA', 'RETIRADA', 'ANULADA', 'VENCIDA')),
    importe_matricula numeric(10,2),
    importe_pension numeric(10,2),
    numero_pensiones int,
    descuento_total numeric(10,2) DEFAULT 0,
    descuento_motivo text,
    descuento_autorizado_por uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    primer_vencimiento date,
    frecuencia_meses int,
    observaciones text,
    reservada_en timestamptz,
    reserva_vence_en timestamptz,
    activada_en timestamptz,
    finalizada_en timestamptz,
    retirada_en timestamptz,
    anulada_en timestamptz,
    motivo_estado text,
    cuotas_generadas_en timestamptz,
    pdf_storage_path text,
    pdf_generado_en timestamptz,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid,
    UNIQUE(estudiante_id, edicion_id)
);

CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON matriculas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_matriculas_estudiante ON matriculas(estudiante_id);
CREATE INDEX idx_matriculas_edicion ON matriculas(edicion_id);
CREATE INDEX idx_matriculas_status ON matriculas(status);

ALTER TABLE prospectos ADD CONSTRAINT fk_prospecto_matricula FOREIGN KEY (matricula_id) REFERENCES matriculas(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS cuotas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id uuid REFERENCES matriculas(id) ON DELETE RESTRICT NOT NULL,
    tipo_cuota text CHECK (tipo_cuota IN ('MATRICULA', 'PENSION', 'OTRO')),
    numero_cuota int,
    concepto text,
    fecha_emision date,
    fecha_vencimiento date,
    importe_original numeric(10,2),
    descuento numeric(10,2) DEFAULT 0,
    recargo numeric(10,2) DEFAULT 0,
    importe_neto numeric(10,2),
    saldo numeric(10,2),
    status text DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_cuotas_updated_at BEFORE UPDATE ON cuotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_cuotas_matricula ON cuotas(matricula_id);
CREATE INDEX idx_cuotas_status ON cuotas(status);

CREATE TABLE IF NOT EXISTS pagos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id uuid REFERENCES estudiantes(id) ON DELETE RESTRICT NOT NULL,
    fecha_pago date,
    importe numeric(10,2),
    medio_pago text,
    numero_operacion text,
    comprobante_tipo text,
    comprobante_numero text,
    status text DEFAULT 'REGISTRADO' CHECK (status IN ('REGISTRADO', 'ANULADO')),
    observaciones text,
    registrado_en timestamptz DEFAULT now(),
    registrado_por uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    anulado_en timestamptz,
    anulado_por uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    motivo_anulacion text
);

CREATE INDEX idx_pagos_estudiante ON pagos(estudiante_id);
CREATE INDEX idx_pagos_status ON pagos(status);

CREATE TABLE IF NOT EXISTS pago_aplicaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id uuid REFERENCES pagos(id) ON DELETE RESTRICT NOT NULL,
    cuota_id uuid REFERENCES cuotas(id) ON DELETE RESTRICT NOT NULL,
    importe_aplicado numeric(10,2),
    created_at timestamptz DEFAULT now(),
    created_by uuid
);
