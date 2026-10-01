-- migrate:up

-- 1. Secuencia y RPC para Código Estudiantil (BRU-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_estudiante START 1;

CREATE OR REPLACE FUNCTION generar_codigo_estudiante()
RETURNS text AS $$
DECLARE
    nuevo_codigo text;
    anio text;
    num integer;
BEGIN
    anio := to_char(now(), 'YYYY');
    num := nextval('seq_codigo_estudiante');
    nuevo_codigo := 'BRU-' || anio || '-' || lpad(num::text, 6, '0');
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. Secuencia y RPC para Código de Matrícula (MAT-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_matricula START 1;

CREATE OR REPLACE FUNCTION generar_codigo_matricula()
RETURNS text AS $$
DECLARE
    nuevo_codigo text;
    anio text;
    num integer;
BEGIN
    anio := to_char(now(), 'YYYY');
    num := nextval('seq_codigo_matricula');
    nuevo_codigo := 'MAT-' || anio || '-' || lpad(num::text, 6, '0');
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Función atómica para Confirmar Matrícula (Idempotente)
CREATE OR REPLACE FUNCTION confirmar_matricula_atomica(
    p_estudiante_id uuid,
    p_edicion_id uuid,
    p_ciclo_id uuid,
    p_prospecto_id uuid,
    p_asesor_id uuid,
    p_importe_matricula numeric,
    p_importe_pension numeric,
    p_numero_pensiones int,
    p_descuento_total numeric,
    p_descuento_motivo text,
    p_primer_vencimiento date,
    p_frecuencia_meses int,
    p_usuario_id uuid
) RETURNS uuid AS $$
DECLARE
    v_matricula_id uuid;
    v_estudiante_record record;
    v_edicion_record record;
    v_codigo_matricula text;
    v_codigo_estudiante text;
    v_vacantes_ocupadas int;
    i int;
    v_fecha_vencimiento date;
BEGIN
    -- Verificar si ya existe una matrícula para este estudiante y edición
    SELECT id INTO v_matricula_id FROM matriculas 
    WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');
    
    IF v_matricula_id IS NOT NULL THEN
        -- Si existe, retornamos el ID (idempotencia)
        RETURN v_matricula_id;
    END IF;

    -- Validar vacantes
    SELECT * INTO v_edicion_record FROM ediciones WHERE id = p_edicion_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Edición no encontrada';
    END IF;
    
    SELECT count(*) INTO v_vacantes_ocupadas FROM matriculas 
    WHERE edicion_id = p_edicion_id AND status IN ('RESERVADA', 'ACTIVA', 'FINALIZADA');
    
    IF v_edicion_record.vacantes IS NOT NULL AND v_vacantes_ocupadas >= v_edicion_record.vacantes THEN
        RAISE EXCEPTION 'No hay vacantes disponibles en esta edición';
    END IF;

    -- Validar estudiante y asignar código si no tiene
    SELECT * INTO v_estudiante_record FROM estudiantes WHERE id = p_estudiante_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estudiante no encontrado';
    END IF;

    IF v_estudiante_record.codigo_estudiante IS NULL THEN
        v_codigo_estudiante := generar_codigo_estudiante();
        UPDATE estudiantes SET codigo_estudiante = v_codigo_estudiante, updated_by = p_usuario_id, updated_at = now() WHERE id = p_estudiante_id;
    END IF;

    -- Generar código matrícula e insertar
    v_codigo_matricula := generar_codigo_matricula();
    
    INSERT INTO matriculas (
        estudiante_id, edicion_id, ciclo_id, prospecto_id, asesor_comercial_id,
        codigo_matricula, fecha_matricula, status, importe_matricula,
        importe_pension, numero_pensiones, descuento_total, descuento_motivo,
        primer_vencimiento, frecuencia_meses, activada_en, cuotas_generadas_en,
        created_by, updated_by
    ) VALUES (
        p_estudiante_id, p_edicion_id, p_ciclo_id, p_prospecto_id, p_asesor_id,
        v_codigo_matricula, CURRENT_DATE, 'ACTIVA', p_importe_matricula,
        p_importe_pension, p_numero_pensiones, p_descuento_total, p_descuento_motivo,
        p_primer_vencimiento, p_frecuencia_meses, now(), now(),
        p_usuario_id, p_usuario_id
    ) RETURNING id INTO v_matricula_id;

    -- Generar Cuota de Matrícula
    IF p_importe_matricula > 0 THEN
        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, importe_neto, status
        ) VALUES (
            v_matricula_id, 'MATRICULA', 0, 'Matrícula',
            CURRENT_DATE, CURRENT_DATE, p_importe_matricula, p_importe_matricula, 'PENDIENTE'
        );
    END IF;

    -- Generar Cuotas de Pensión
    v_fecha_vencimiento := p_primer_vencimiento;
    FOR i IN 1..p_numero_pensiones LOOP
        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, importe_neto, status
        ) VALUES (
            v_matricula_id, 'PENSION', i, 'Pensión ' || i,
            CURRENT_DATE, v_fecha_vencimiento, p_importe_pension, p_importe_pension, 'PENDIENTE'
        );
        -- Agregar frecuencia en meses
        v_fecha_vencimiento := v_fecha_vencimiento + (p_frecuencia_meses || ' months')::interval;
    END LOOP;

    -- Si vino desde un prospecto, actualizar prospecto
    IF p_prospecto_id IS NOT NULL THEN
        UPDATE prospectos SET 
            matricula_id = v_matricula_id,
            status = 'MATRICULADO',
            updated_by = p_usuario_id,
            updated_at = now()
        WHERE id = p_prospecto_id;
    END IF;

    RETURN v_matricula_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 4. Función atómica para Registrar Pago (Idempotente)
CREATE OR REPLACE FUNCTION registrar_pago_atomico(
    p_estudiante_id uuid,
    p_importe numeric,
    p_medio_pago text,
    p_numero_operacion text,
    p_comprobante_tipo text,
    p_comprobante_numero text,
    p_observaciones text,
    p_cuotas_aplicadas jsonb, -- [{ "cuota_id": uuid, "importe": numeric }]
    p_usuario_id uuid
) RETURNS uuid AS $$
DECLARE
    v_pago_id uuid;
    v_cuota record;
    v_item jsonb;
    v_importe_aplicado numeric;
    v_total_aplicado numeric := 0;
    v_cuota_saldo numeric;
BEGIN
    -- Validar si el pago con este numero_operacion y medio_pago ya existe (Idempotencia)
    IF p_numero_operacion IS NOT NULL AND p_numero_operacion <> '' THEN
        SELECT id INTO v_pago_id FROM pagos 
        WHERE medio_pago = p_medio_pago AND numero_operacion = p_numero_operacion AND status = 'REGISTRADO';
        
        IF v_pago_id IS NOT NULL THEN
            RETURN v_pago_id;
        END IF;
    END IF;

    -- Insertar el pago
    INSERT INTO pagos (
        estudiante_id, fecha_pago, importe, medio_pago, numero_operacion,
        comprobante_tipo, comprobante_numero, observaciones, registrado_por
    ) VALUES (
        p_estudiante_id, CURRENT_DATE, p_importe, p_medio_pago, p_numero_operacion,
        p_comprobante_tipo, p_comprobante_numero, p_observaciones, p_usuario_id
    ) RETURNING id INTO v_pago_id;

    -- Aplicar a cuotas
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cuotas_aplicadas)
    LOOP
        v_importe_aplicado := (v_item->>'importe')::numeric;
        
        -- Obtener cuota
        SELECT * INTO v_cuota FROM cuotas WHERE id = (v_item->>'cuota_id')::uuid FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cuota % no encontrada', (v_item->>'cuota_id');
        END IF;

        -- Registrar aplicación
        INSERT INTO pago_aplicaciones (pago_id, cuota_id, importe_aplicado, created_by)
        VALUES (v_pago_id, v_cuota.id, v_importe_aplicado, p_usuario_id);

        -- Actualizar saldo de cuota
        -- saldo actual (si es null, es el importe neto)
        v_cuota_saldo := COALESCE(v_cuota.saldo, v_cuota.importe_neto) - v_importe_aplicado;
        
        UPDATE cuotas SET 
            saldo = v_cuota_saldo,
            status = CASE WHEN v_cuota_saldo <= 0 THEN 'PAGADA' ELSE 'PARCIAL' END,
            updated_at = now()
        WHERE id = v_cuota.id;

        v_total_aplicado := v_total_aplicado + v_importe_aplicado;
    END LOOP;

    -- Validar que no se haya aplicado más del importe del pago
    IF v_total_aplicado > p_importe THEN
        RAISE EXCEPTION 'El importe total aplicado a cuotas supera el importe del pago';
    END IF;

    RETURN v_pago_id;
END;
$$ LANGUAGE plpgsql VOLATILE;
