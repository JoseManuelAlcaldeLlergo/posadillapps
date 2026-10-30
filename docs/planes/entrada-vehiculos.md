# Plan de implementación: Entrada de vehículos

Especificación: [docs/modulos/entrada-vehiculos.md](../modulos/entrada-vehiculos.md).

Se implementa en **3 PR**, en este orden: primero los cambios genéricos del núcleo, después el módulo nuevo por separado y al final la integración con alimentos.

## PR 1 — Cambios genéricos en `src/core/`

1. **Título sobre la tabla**: `TableDefinition.heading?: string[]`, una línea por elemento. Es distinto de `title`, que ya se usa como título del documento, nombre de hoja y título del diálogo de compartir.
    - PDF: primera fila del `<thead>`, sin bordes y abarcando todas las columnas, así que se repite en cada página como en el papel.
    - Excel: filas combinadas y en negrita encima de los encabezados; la fila de encabezados y el autofiltro bajan.
2. **Formato de fecha por tabla**: `TableDefinition.dateSeparator?: '-' | '/'`, por defecto `-`. Lo usan `formatDate`/`formatCell` y el formato de Excel (`dd\/mm\/yyyy`, con la barra escapada para que no dependa del idioma del sistema).
3. **Copia de seguridad con referencias entre módulos**: `restoreBackup` activa `PRAGMA defer_foreign_keys = ON` en su transacción. Así un módulo puede referenciar a otro registrado después (las entradas de alimentos apuntan a visitas) sin cambiar el orden de la pantalla de inicio.
4. **Piezas de UI y texto compartidas** (hoy viven dentro de alimentos y vehículos no puede importarlas):
    - `normalizeName`/`nameKey` pasan a `src/core/text.ts`; `names.ts` de alimentos los reexporta.
    - `SuggestionChips` pasa a `src/core/ui/`, con elementos `{ id, name }` y una función de comparación opcional `matchKey` (por defecto `nameKey`; vehículos usará `plateKey`).
    - `SelectField` nuevo en `src/core/ui/`: desplegable hecho con `Modal` y una lista, sin dependencias nuevas.
    - `TableExportScreen` en `src/core/ui/`: rango de fechas, recuento y botones Imprimir/PDF/Excel. Recibe la tabla, `count(range)`, `load(range)` y los textos. La exportación de alimentos pasa a usarla.
5. **Tests**: título y desplazamiento de filas en PDF y Excel, separador de fecha, y restauración de un módulo que referencia a otro registrado después.

## PR 2 — Módulo `src/modules/vehicle-entries/` (sin integración)

- **Migración nueva `0002_vehicle_entries`** (generada con `npm run db:generate`):
    - `vehicle_regulars`: `plate`, `plate_key`, `frequency`, `reason`, `vehicle_type`, `active` (1 por defecto), fechas de creación y actualización.
    - `vehicle_visits`: `date`, `plate`, `plate_key`, `reason`, `vehicle_type`, `source` (nulo en las manuales; `'feed-entries'` en las automáticas), fechas. Índices por `date` y `plate_key`, e índice único parcial `(source, date, plate_key) WHERE source IS NOT NULL`: una visita automática por camión y día, sin impedir visitas manuales repetidas.
    - `vehicle_type` guarda claves `private_car | feed_truck | livestock_truck | carcass_truck | other`. Etiquetas en `vehicleTypes.ts`: Vehículo particular, Camión de alimento, Camión de ganado, Camión de retirada de cadáveres, Otros.
- **`plates.ts`**: `normalizePlate` (mayúsculas, espacios colapsados) y `plateKey` (además sin espacios ni guiones).
- **`repository.ts`**: CRUD de habituales y visitas; `listVisitsInRange`; filtros por rango, matrícula y tipo; `lastRecordForPlate` para autocompletar tipo y motivo; sugerencias de motivo (predefinidos y usados) y de frecuencia. `updateVisit` rechaza cambios de fecha o matrícula en las visitas automáticas.
- **`validation.ts`**, al estilo del de alimentos.
- **`tableDefinition.ts`**: `MATRÍCULA | FECHA | MOTIVO DE VISITA | TIPO DE VEHÍCULO`, A4 vertical, `heading` con las dos líneas del papel y `dateSeparator: '/'`. Las filas son habituales (frecuencia como texto en FECHA) o visitas (fecha real). Orden: habituales activos por orden de alta y después visitas por fecha ascendente.
- **`backup.ts`** (versión 1): habituales y visitas, con validación.
- **`index.ts`** (API pública): `normalizePlate`, `plateKey`, `VehicleType`, `linkAutomaticVisit(tx, { source, date, plate, reason, vehicleType })` (busca o crea) y `deleteAutomaticVisit(tx, id)`. El motivo y el tipo los pasa quien llama, así vehículos no sabe nada de pienso.
- **`screens/`**: listado en dos secciones (activos primero; visitas de la más reciente a la más antigua, con indicador «Automática»); formularios de habitual y de visita con «Guardar y añadir otro», que conserva motivo y tipo; exportación con `TableExportScreen`.
- **Rutas** en `src/app/vehicle-entries/` y registro en `registry.ts`, detrás de alimentos.
- **Tests**: matrículas, repositorio (rango, filtros, autocompletado, unicidad de la visita automática y no de la manual), `tableDefinition`, validación y copia de seguridad.

## PR 3 — Integración en alimentos (alimentos → vehículos)

- **Migración nueva `0003_feed_trucks`**: tabla `feed_supplier_trucks` (`supplier_id`, `plate`, `plate_key`, única por proveedor y clave); `feed_entries` gana `truck_plate` (snapshot, nulo) y `vehicle_visit_id` (referencia a `vehicle_visits`, se pone a nulo si se borra). Las entradas antiguas quedan con nulo: no hay visitas retroactivas. Revisar el SQL generado: SQLite solo admite `ADD COLUMN` con referencia si el valor por defecto es nulo.
- **Repositorio**: CRUD de camiones en `favoritesRepository`. `saveEntry`, en su transacción, llama a `linkAutomaticVisit` (motivo «Transporte de pienso», tipo `feed_truck`), guarda `vehicle_visit_id` y, si la visita anterior cambió y se queda sin entradas, llama a `deleteAutomaticVisit`. `deleteEntry` hace lo mismo. `FavoriteOptions.saveTruck` guarda la matrícula nueva como camión habitual.
- **UI**:
    - Formulario: campo «Matrícula del camión» con los camiones del proveedor (si solo hay uno, preseleccionado); ofrece guardarla como camión habitual; «Guardar y añadir otro de la misma factura» la conserva; si se deja vacía, aviso en la misma pantalla sin pedir confirmación.
    - Pantalla del proveedor: sección de camiones habituales.
    - Listado de alimentos: acepta `?visitId=` para mostrar las entradas de una visita.
    - Enlace desde la visita automática: la ruta `src/app/vehicle-entries/visits/[id].tsx` le pasa a la pantalla un enlace a `/feed-entries?visitId=…`. La relación se arma en `src/app` y el módulo de vehículos no importa nada de alimentos.
- **Copia de seguridad de alimentos, versión 2**: camiones, `truckPlate` y `vehicleVisitId`; los archivos de versión 1 se leen con esos campos vacíos.
- **Tests**: dos entradas del mismo camión y día dan una visita; cambiar fecha o matrícula reasigna y borra la visita vacía; borrar la última entrada borra la visita; sin matrícula no hay visita; copia v1 → v2 y restauración de los dos módulos juntos.

## Decisiones

- No se puede borrar una visita automática desde vehículos: desaparece al borrar o cambiar sus entradas de alimentos (igual que fecha y matrícula no se editan allí).
- Los habituales salen en la exportación por orden de alta.
- PDF en vertical hasta compararlo con el papel.
- «Vehículo particular» es a la vez tipo y motivo predefinido, como en la hoja en papel.
- Sin dependencias nuevas.

## Verificación en cada PR

- `npm test`, `npm run lint`, `npx tsc --noEmit` y `npx expo export --platform android`.
- Emulador: recorrer los criterios de aceptación afectados; imprimir el PDF y compararlo con el papel.
