---
name: nuevo-modulo-tabla
description: Crea un módulo nuevo de registro (una tabla nueva de la explotación, p. ej. tratamientos veterinarios, movimientos de animales) siguiendo la arquitectura modular. Úsala cuando haya que añadir un tipo de registro o tabla nueva.
---

# Crear un módulo de tabla

Toma como referencia el módulo `src/modules/feed-entries/` (entradas de alimentos).

1. Pide al usuario, si no los tienes: nombre del módulo, columnas en orden exacto del formulario en papel, tipo de cada columna, obligatorias, y si alguna usa favoritos.
2. Crea `src/modules/<modulo>/` con:
    - `schema.ts`: tabla(s) del módulo
    - una migración NUEVA en `src/core/db/migrations/` (nunca editar las existentes)
    - `repository.ts`: CRUD y consulta por rango de fechas
    - `tableDefinition.ts`: columnas, encabezados en MAYÚSCULAS como en el papel, formateadores, orientación de página
    - `screens/`: listado, formulario, exportación (reutilizando componentes de `src/core/ui/`)
3. Registra el módulo en `src/modules/registry.ts`.
4. No modifiques `src/core/export/`. Si el motor no cubre algo, para y propón el cambio genérico al usuario.
5. Añade tests: repositorio (rango de fechas) y `tableDefinition` (formato de cada columna).
6. Ejecuta tests, lint y `tsc --noEmit` antes de dar el trabajo por terminado.
