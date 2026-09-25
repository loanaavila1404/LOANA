# Limitación Técnica: Selector de Sede

Actualmente el sistema permite seleccionar globalmente la Sede ("Sede Central · Tumbes" o "Todas las sedes" para roles autorizados) y almacena esta preferencia de forma segura en una cookie (`erp_sede`).

## Estado Actual
El esquema de Supabase base (`00001_schema_base.sql` a `00006_matriculas_pagos.sql`) **no incluye actualmente un campo `sede_id`** en todas las entidades transaccionales (por ejemplo `personas`, `estudiantes`, `oferta_academica`).

## Consecuencia
Por el momento, el selector de sede actúa a nivel de UI y contexto de sesión, pero las consultas a la base de datos retornarán todos los registros independientemente de la sede, a menos que se filtre explícitamente y se preparen las tablas para soportarlo.

## Migración Aditiva Propuesta (Para aprobación)
Se propone la siguiente migración para habilitar el multisede real:
1. Crear una tabla `sedes (id, nombre, ubicacion)`.
2. Insertar 'Sede Central · Tumbes'.
3. Añadir la columna `sede_id` a `personas`, `estudiantes`, `oferta_academica` (nulleable temporalmente).
4. Actualizar los registros existentes a la sede por defecto.
5. Hacer el campo `NOT NULL`.
