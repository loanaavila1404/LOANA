-- Migracion 00012 para corregir encoding en la funcion confirmar_matricula_atomica

-- migrate:up

-- 1. Restricciones y Columnas Aditivas
DO $$
DECLARE
    v_cname text;
BEGIN
    -- Añadir idempotency_key a pagos si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagos' AND column_name = 'idempotency_key') THEN
        ALTER TABLE pagos ADD COLUMN idempotency_key uuid;
    END IF;

    -- Verificar duplicados de idempotency_key
    IF EXISTS (SELECT idempotency_key FROM pagos WHERE idempotency_key IS NOT NULL GROUP BY idempotency_key HAVING COUNT(*) > 1) THEN
        RAISE EXCEPTION 'Existen duplicados en pagos.idempotency_key. Limpie los datos antes de aplicar la migración.';
    END IF;
    -- Restricción UNIQUE para idempotency_key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pagos_idempotency_key') THEN
        ALTER TABLE pagos ADD CONSTRAINT uq_pagos_idempotency_key UNIQUE (idempotency_key);
    END IF;

    -- Verificar duplicados de codigo_estudiante
    IF EXISTS (SELECT codigo_estudiante FROM estudiantes WHERE codigo_estudiante IS NOT NULL GROUP BY codigo_estudiante HAVING COUNT(*) > 1) THEN
        RAISE EXCEPTION 'Existen duplicados en estudiantes.codigo_estudiante. Limpie los datos antes de aplicar la migración.';
    END IF;
    -- Restricción UNIQUE para codigo_estudiante
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_estudiantes_codigo') THEN
        ALTER TABLE estudiantes ADD CONSTRAINT uq_estudiantes_codigo UNIQUE (codigo_estudiante);
    END IF;

    -- Verificar duplicados de codigo_matricula
    IF EXISTS (SELECT codigo_matricula FROM matriculas WHERE codigo_matricula IS NOT NULL GROUP BY codigo_matricula HAVING COUNT(*) > 1) THEN
        RAISE EXCEPTION 'Existen duplicados en matriculas.codigo_matricula. Limpie los datos antes de aplicar la migración.';
    END IF;
    -- Restricción UNIQUE para codigo_matricula
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_matriculas_codigo') THEN
        ALTER TABLE matriculas ADD CONSTRAINT uq_matriculas_codigo UNIQUE (codigo_matricula);
    END IF;

    -- Renombrar restricción matriculas_estudiante_id_edicion_id_key si existe para que sea manejable de forma predecible
    SELECT conname INTO v_cname FROM pg_constraint
    WHERE conrelid = 'matriculas'::regclass AND contype = 'u'
    AND pg_get_constraintdef(oid) LIKE '%(estudiante_id, edicion_id)%';

    IF v_cname IS NOT NULL AND v_cname <> 'uq_matriculas_estudiante_edicion' THEN
        EXECUTE 'ALTER TABLE matriculas RENAME CONSTRAINT "' || v_cname || '" TO uq_matriculas_estudiante_edicion';
    END IF;
END $$;


-- 2. 