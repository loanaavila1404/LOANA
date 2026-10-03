BEGIN;

-- Migracion 00012 para corregir encoding en la funcion confirmar_matricula_atomica

CREATE OR REPLACE FUNCTION public.confirmar_matricula_atomica(
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
    p_frecuencia_meses int
) RETURNS uuid AS $$
DECLARE
    v_matricula_id uuid;
    v_estudiante_record record;
    v_edicion_record record;
    v_ciclo_record record;
    v_prospecto_record record;
    v_codigo_matricula text;
    v_codigo_estudiante text;
    v_vacantes_ocupadas int;
    i int;
    v_fecha_vencimiento date;
    v_uid uuid;
    v_total_bruto numeric;
    v_total_neto numeric;
    v_descuento_restante numeric;
    v_bruto_restante numeric;
    v_descuento_cuota numeric;
    v_cuota_importe_bruto numeric;
    v_cuota_importe_neto numeric;
    v_prospecto_actualizado int;
    v_constraint text;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para gestionar matrículas';
    END IF;

    -- Validaciones financieras
    IF p_importe_matricula < 0 THEN RAISE EXCEPTION 'Importe de matrícula no puede ser negativo'; END IF;
    IF p_importe_pension < 0 THEN RAISE EXCEPTION 'Importe de pensión no puede ser negativo'; END IF;
    IF p_numero_pensiones < 0 THEN RAISE EXCEPTION 'Número de pensiones no puede ser negativo'; END IF;
    IF p_descuento_total < 0 THEN RAISE EXCEPTION 'El descuento no puede ser negativo'; END IF;
    IF p_numero_pensiones > 0 AND (p_frecuencia_meses <= 0 OR p_frecuencia_meses IS NULL) THEN
        RAISE EXCEPTION 'Frecuencia de meses inválida';
    END IF;
    IF p_numero_pensiones > 0 AND p_primer_vencimiento IS NULL THEN
        RAISE EXCEPTION 'El primer vencimiento es obligatorio cuando hay pensiones';
    END IF;

    v_total_bruto := p_importe_matricula + (p_importe_pension * p_numero_pensiones);
    IF p_descuento_total > v_total_bruto THEN
        RAISE EXCEPTION 'El descuento supera el total bruto';
    END IF;
    v_total_neto := v_total_bruto - p_descuento_total;

    -- Bloqueo de la edición
    SELECT * INTO v_edicion_record FROM ediciones WHERE id = p_edicion_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Edición no encontrada'; END IF;
    IF v_edicion_record.status <> 'ACTIVO' THEN RAISE EXCEPTION 'La edición no está activa'; END IF;

    -- Idempotencia segura inicial
    SELECT id INTO v_matricula_id FROM matriculas
    WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');

    IF v_matricula_id IS NOT NULL THEN
        RETURN v_matricula_id;
    END IF;

    -- Vacantes
    SELECT count(*) INTO v_vacantes_ocupadas FROM matriculas
    WHERE edicion_id = p_edicion_id AND status IN ('RESERVADA', 'ACTIVA', 'FINALIZADA');

    IF v_edicion_record.vacantes IS NOT NULL AND v_vacantes_ocupadas >= v_edicion_record.vacantes THEN
        RAISE EXCEPTION 'No hay vacantes disponibles en esta edición';
    END IF;

    -- Validar Ciclo contra el esquema real (relación ciclos.plan_id = ediciones.plan_id)
    IF p_ciclo_id IS NOT NULL THEN
        SELECT * INTO v_ciclo_record FROM ciclos WHERE id = p_ciclo_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo no encontrado'; END IF;
        IF v_ciclo_record.plan_id <> v_edicion_record.plan_id THEN
            RAISE EXCEPTION 'El ciclo no corresponde al plan de estudios de la edición';
        END IF;
        IF v_ciclo_record.status <> 'ACTIVO' THEN RAISE EXCEPTION 'El ciclo no está activo'; END IF;
    END IF;

    -- Validar Estudiante
    SELECT * INTO v_estudiante_record FROM estudiantes WHERE id = p_estudiante_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Estudiante no encontrado'; END IF;
    IF v_estudiante_record.status <> 'ACTIVO' THEN RAISE EXCEPTION 'El estudiante no está activo'; END IF;

    -- Validar Prospecto
    IF p_prospecto_id IS NOT NULL THEN
        SELECT * INTO v_prospecto_record FROM prospectos WHERE id = p_prospecto_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Prospecto no encontrado'; END IF;
        IF v_prospecto_record.status = 'PERDIDO' THEN RAISE EXCEPTION 'El prospecto está perdido'; END IF;
        IF v_prospecto_record.matricula_id IS NOT NULL THEN
            RAISE EXCEPTION 'El prospecto ya tiene una matrícula vinculada';
        END IF;
        IF v_prospecto_record.estudiante_id IS NOT NULL AND v_prospecto_record.estudiante_id <> p_estudiante_id THEN
            RAISE EXCEPTION 'El prospecto pertenece a otro estudiante';
        END IF;
        IF v_prospecto_record.persona_id IS NOT NULL AND v_prospecto_record.persona_id <> v_estudiante_record.persona_id THEN
            RAISE EXCEPTION 'El prospecto pertenece a otra persona';
        END IF;
    END IF;

    -- Código estudiante
    IF v_estudiante_record.codigo_estudiante IS NULL THEN
        v_codigo_estudiante := generar_codigo_estudiante();
        UPDATE estudiantes SET codigo_estudiante = v_codigo_estudiante, updated_by = v_uid, updated_at = now() WHERE id = p_estudiante_id;
    END IF;

    -- Insertar Matrícula capturando unique_violation concurrente
    v_codigo_matricula := generar_codigo_matricula();
    BEGIN
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
            v_uid, v_uid
        ) RETURNING id INTO v_matricula_id;
    EXCEPTION WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint IN ('matriculas_estudiante_id_edicion_id_key', 'uq_matriculas_estudiante_edicion') THEN
            SELECT id INTO v_matricula_id FROM matriculas
            WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');

            IF v_matricula_id IS NULL THEN
                -- El registro existe por la restricción UNIQUE, pero su estado está anulado/vencido/retirado.
                -- La restricción UNIQUE impone que solo haya UNA matrícula por estudiante+edición sin importar el estado.
                RAISE EXCEPTION 'El estudiante ya tiene una matrícula anulada, vencida o retirada en esta edición. La restricción de unicidad impide re-matricularlo en la misma edición.';
            END IF;
            RETURN v_matricula_id;
        ELSE
            RAISE;
        END IF;
    END;

    -- Distribución proporcional del descuento con remanentes
    v_descuento_restante := p_descuento_total;
    v_bruto_restante := v_total_bruto;

    -- Cuota de Matrícula (Si aplica)
    IF p_importe_matricula > 0 THEN
        v_cuota_importe_bruto := p_importe_matricula;

        IF p_numero_pensiones = 0 THEN
            v_descuento_cuota := v_descuento_restante;
        ELSE
            -- Proporción truncada a 2 decimales
            v_descuento_cuota := trunc((v_cuota_importe_bruto / v_bruto_restante) * v_descuento_restante, 2);
            v_descuento_cuota := LEAST(v_cuota_importe_bruto, v_descuento_cuota);
        END IF;

        v_cuota_importe_neto := v_cuota_importe_bruto - v_descuento_cuota;

        IF v_descuento_cuota < 0 OR v_descuento_cuota > v_cuota_importe_bruto OR v_cuota_importe_neto < 0 THEN
            RAISE EXCEPTION 'Inconsistencia en la distribución del descuento de la matrícula';
        END IF;

        v_descuento_restante := v_descuento_restante - v_descuento_cuota;
        v_bruto_restante := v_bruto_restante - v_cuota_importe_bruto;

        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, descuento, importe_neto, saldo, status
        ) VALUES (
            v_matricula_id, 'MATRICULA', 0, 'Matrícula',
            CURRENT_DATE, CURRENT_DATE, v_cuota_importe_bruto, v_descuento_cuota, v_cuota_importe_neto, v_cuota_importe_neto, CASE WHEN v_cuota_importe_neto = 0 THEN 'PAGADA' ELSE 'PENDIENTE' END
        );
    END IF;

    -- Generar Cuotas de Pensión
    v_fecha_vencimiento := p_primer_vencimiento;
    FOR i IN 1..p_numero_pensiones LOOP
        v_cuota_importe_bruto := p_importe_pension;

        -- Si es la última cuota general, absorbe TODO el descuento restante
        IF i = p_numero_pensiones THEN
            v_descuento_cuota := v_descuento_restante;
            IF v_descuento_cuota > v_cuota_importe_bruto THEN
                RAISE EXCEPTION 'El descuento para la última cuota superó el importe bruto. Revisar configuración de importes.';
            END IF;
        ELSE
            v_descuento_cuota := trunc((v_cuota_importe_bruto / v_bruto_restante) * v_descuento_restante, 2);
            v_descuento_cuota := LEAST(v_cuota_importe_bruto, v_descuento_cuota);
        END IF;

        v_cuota_importe_neto := v_cuota_importe_bruto - v_descuento_cuota;

        IF v_descuento_cuota < 0 OR v_descuento_cuota > v_cuota_importe_bruto OR v_cuota_importe_neto < 0 THEN
            RAISE EXCEPTION 'Inconsistencia en la distribución del descuento de la pensión %', i;
        END IF;

        v_descuento_restante := v_descuento_restante - v_descuento_cuota;
        v_bruto_restante := v_bruto_restante - v_cuota_importe_bruto;

        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, descuento, importe_neto, saldo, status
        ) VALUES (
            v_matricula_id, 'PENSION', i, 'Pensión ' || i,
            CURRENT_DATE, v_fecha_vencimiento, v_cuota_importe_bruto, v_descuento_cuota, v_cuota_importe_neto, v_cuota_importe_neto, CASE WHEN v_cuota_importe_neto = 0 THEN 'PAGADA' ELSE 'PENDIENTE' END
        );
        v_fecha_vencimiento := v_fecha_vencimiento + (p_frecuencia_meses || ' months')::interval;
    END LOOP;

    -- Verificación final
    IF v_descuento_restante <> 0 THEN
        RAISE EXCEPTION 'El descuento no pudo ser completamente asignado sin generar valores negativos';
    END IF;

    -- Actualizar Prospecto asegurando actualización
    IF p_prospecto_id IS NOT NULL THEN
        UPDATE prospectos SET
            matricula_id = v_matricula_id,
            status = 'MATRICULADO',
            updated_by = v_uid,
            updated_at = now()
        WHERE id = p_prospecto_id;

        GET DIAGNOSTICS v_prospecto_actualizado = ROW_COUNT;
        IF v_prospecto_actualizado = 0 THEN
            RAISE EXCEPTION 'Error al actualizar el estado del prospecto';
        END IF;
    END IF;

    RETURN v_matricula_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) TO authenticated;


-- Data Correction
UPDATE public.cuotas
SET concepto = 'Matrícula'
WHERE concepto = 'MatrÃcula';

UPDATE public.cuotas
SET concepto = 'Pensión ' || substring(concepto FROM '([0-9]+)$')
WHERE concepto ~ '^PensiÃ³n [0-9]+$';

COMMIT;
