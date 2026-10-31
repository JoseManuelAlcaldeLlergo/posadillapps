---
name: nuevo-modulo-tabla
description: Crea un módulo nuevo de registro (una tabla nueva de la explotación, p. ej. tratamientos veterinarios, movimientos de animales) siguiendo la arquitectura modular. Úsala cuando haya que añadir un tipo de registro o tabla nueva.
---

# Crear un módulo de tabla

Toma como referencia el módulo `src/modules/feed-entries/` (entradas de alimentos).

1. Pide al usuario, si no los tienes: nombre del módulo, columnas en orden exacto del formulario en papel, tipo de cada columna, obligatorias, y si alguna usa favoritos.
2. Elige su aspecto en la pantalla de inicio siguiendo la skill `guia-diseno` y confírmalo con el usuario junto con el resto de datos del paso 1:
    - **Categoría**: `feed` (Alimentación), `biosecurity` (Bioseguridad) o `hygiene` (Higiene). El **color** sale de la categoría (`colors.category` en `src/core/ui/theme.ts`); no se declara un color suelto. Si ninguna encaja, para y propón una categoría nueva con sus cuatro colores (sección 3 de `guia-diseno`).
    - **Icono**: un nombre de `MaterialCommunityIcons`, variante rellena. Comprueba que existe con el comando de la sección 8 de `guia-diseno`.
3. Crea `src/modules/<modulo>/` con:
    - `schema.ts`: tabla(s) del módulo
    - una migración NUEVA en `src/core/db/migrations/` (nunca editar las existentes)
    - `repository.ts`: CRUD y consulta por rango de fechas
    - `tableDefinition.ts`: columnas, encabezados en MAYÚSCULAS como en el papel, formateadores, orientación de página
    - `module.ts`: su `AppModule` con `id`, `title`, `description`, `category`, `icon`, `route` y `backup` (los campos `category` e `icon` son obligatorios)
    - `screens/`: listado, formulario, exportación, siguiendo los patrones de la sección 7 de `guia-diseno` (listado con `Fab`, `ListToolbar`, `groupByMonth`, `DateBadge` y `EmptyState` con el icono del módulo; formulario con «Guardar» en el `footer` de `Screen` y borrar con `dangerText`; exportación con `TableExportScreen`), reutilizando componentes y tokens de `src/core/ui/`, sin colores ni tamaños literales
4. Registra el módulo en `src/modules/registry.ts` (el orden dentro de su categoría es el de la lista) y añádelo a la tabla «Icono y categoría de cada módulo» de `.claude/skills/guia-diseno/SKILL.md`.
5. No modifiques `src/core/export/`. Si el motor no cubre algo, para y propón el cambio genérico al usuario.
6. Añade tests: repositorio (rango de fechas) y `tableDefinition` (formato de cada columna).
7. Ejecuta tests, lint y `tsc --noEmit` y revisa la pantalla de inicio en modo claro y oscuro antes de dar el trabajo por terminado.
