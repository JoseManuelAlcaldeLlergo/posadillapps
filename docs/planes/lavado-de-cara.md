# Plan de implementación: Lavado de cara del diseño

Dirección elegida: **Material 3 tonal**. Capturas del estado actual en [docs/rediseno/antes/](../rediseno/antes/), tomadas en un Pixel 8 (Android 15) con los datos de ejemplo (`npm run sample:backup`).

Solo cambia la presentación: no se tocan esquemas, migraciones, repositorios, `tableDefinition.ts` ni `src/core/export/`. Se implementa en **9 PR**, en este orden: primero se limpian los estilos sueltos y se cambian los tokens, después los componentes de `src/core/ui/`, luego cada tipo de pantalla y al final la guía.

## Diagnóstico

| # | Hallazgo | Dónde | Impacto | Esfuerzo |
|---|---|---|---|---|
| 1 | En los listados, tres botones apilados ocupan una cuarta parte de la pantalla antes del primer registro, y «Nueva entrada» desaparece al bajar | Cabecera de todos los listados (`EntryListScreen.tsx:50-68` y equivalentes) | Alto | M |
| 2 | Todos los registros pesan igual: caja con borde y dos o tres líneas grises iguales (proveedor, pienso, factura, camión), sin agrupar por mes | `ListItem.tsx`, `renderItem` de cada listado | Alto | M |
| 3 | El color de la categoría desaparece en cuanto se sale del inicio: todas las pantallas de módulo son verdes y grises iguales | `_layout.tsx` (cabecera), botones `primary` | Alto | S |
| 4 | Solo hay bordes finos para separar superficies; cabecera con sombra por defecto sobre un fondo casi igual | `ListItem.tsx:44`, `ModuleCard.tsx:51`, `_layout.tsx:13` | Alto | S |
| 5 | Al pulsar solo cambia la opacidad (0.7): no hay ripple de Android | Todos los `Pressable` de `src/core/ui/` | Medio | S |
| 6 | Los textos de ejemplo («9.340», «Mezclas del Valle», «1234 BCD») salen en gris dentro de cajas iguales a las rellenas y se confunden con datos ya puestos | `TextField.tsx:22`, formularios | Alto (uso en campo) | S |
| 7 | «Guardar» queda fuera de pantalla en los formularios largos: hay que bajar para verlo | Formularios (`Screen scroll`) | Medio | S |
| 8 | Iconos hechos con caracteres de texto (▾ ✕ ✓) en lugar de iconos; los iconos de PDF, Excel y nuevo registro de la guía no se usan | `SelectField.tsx:56,100`, `DateField.tsx:62`, `Checkbox.tsx:29`, `TableExportScreen.tsx` | Medio | S |
| 9 | Zonas táctiles por debajo de 48 dp: chips (40), casilla (40) y botón de borrar fecha (40 de ancho) | `Chip.tsx:41`, `Checkbox.tsx:40`, `DateField.tsx:80` | Alto (guantes) | S |
| 10 | Avisos resueltos cada uno a su manera: cajas con borde verde, rojo o gris sin icono (guardado, visita, generación, copia, código de explotación) | `EntryFormScreen.tsx` (`notice`), `EntryListScreen.tsx` (`visitFilter`), `YearGenerationScreen.tsx`, `BackupReminder.tsx`, `FarmCodeInfo.tsx` | Medio | S |
| 11 | Estado vacío con texto plano, sin icono ni acción | `CenteredMessage.tsx`, `ListEmptyComponent` de cada listado | Medio | S |
| 12 | Badge «Inactivo» en verde `primary`, el mismo color que una acción | `ListItem.tsx:31` | Bajo | S |
| 13 | Unidades (kg, t, l) como chips sueltos en vez de un control segmentado | `EntryFormScreen.tsx` | Bajo | S |
| 14 | Selector en un `Modal` centrado con fondo `rgba` literal, no una hoja inferior | `SelectField.tsx:113` | Bajo | S |
| 15 | Deuda: 90 estilos literales fuera de `theme.ts`; tamaños 13 y 15 fuera de la escala; radios 4, 10 y 20 sueltos | `grep` del paso 1 (más en `SelectField`, `ListItem`, `DateField` y los listados) | Medio | M |
| 16 | Con los colores actuales, algunos acentos de categoría no llegan a 5:1 sobre su propio fondo (ámbar 4.62, verde azulado 4.35, pizarra 4.37) | `theme.ts` | Medio | S |

**Se conserva**: colores por categoría y agrupación del inicio; contraste alto y texto de 16; modo oscuro; fuente del sistema; iconos `MaterialCommunityIcons`; logo en la cabecera; los textos de la interfaz.

## Dirección elegida: Material 3 tonal

- Superficies **tonales** en vez de bordes: las tarjetas se separan del fondo por el tono, no por una línea.
- **Color de la categoría en la cabecera** de todas las pantallas del módulo (fondo `category.container`), sin sombra.
- **Botón flotante extendido** («+ Nueva entrada») siempre visible en los listados; el resto de acciones como chips tonales con icono y texto.
- Listados **agrupados por mes**, con la fecha en un bloque a la izquierda y jerarquía clara: cantidad, producto y proveedor.
- Botones de **pastilla** con variantes rellena, tonal y con borde, con icono opcional; **ripple** de Android al pulsar.
- Campos con estado de foco, iconos reales y barra fija abajo con «Guardar».

```
INICIO                 LISTADO
┌────────────────────┐ ┌────────────────────┐
│ [logo] PosadillApps│ │← Entradas alimentos│
│                    │ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ <- cabecera
│ ALIMENTACIÓN       │ │ (Filtros)(Export.) │    ámbar suave
│ ░░░░░░░░░░░░░░░░░░ │ │                    │
│ ░[▣] Entradas de  ░│ │ OCTUBRE 2026       │
│ ░    alimentos   ›░│ │ ░[23]  6.500 kg   ░│
│ ░░░░░░░░░░░░░░░░░░ │ │ ░ oct Corderos ceb░│
│ BIOSEGURIDAD       │ │ ░      Coop. N.S. ░│
│ ░[▣] Entrada de   ░│ │ ░[23] 14.500 kg   ░│
│ ░    vehículos   ›░│ │ ░ oct Cebo cerdos ░│
│ ░[▣] Limpieza de  ░│ │ ░      Guadalquiv.░│
│ ░    vehículos   ›░│ │                    │
│                    │ │      ╭────────────╮│
│ (sin bordes,       │ │      │ + Nueva    ││ <- FAB fijo
│  fondos tonales)   │ │      ╰────────────╯│
└────────────────────┘ └────────────────────┘
```

## Tokens nuevos y cambiados (`src/core/ui/theme.ts`)

### Colores

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `background` | `#F7F9F7` (antes `#F4F6F4`) | `#121513` | Fondo de pantalla |
| `surface` | `#FFFFFF` | `#1D211E` | Campos de formulario, hoja inferior |
| `surfaceContainer` **nuevo** | `#EBF0EC` | `#1E2420` | Tarjetas, elementos de lista |
| `surfaceContainerHigh` **nuevo** | `#DFE6E0` | `#29302B` | Chips sin seleccionar, segmentado |
| `textMuted` | `#525A54` (antes `#5B635D`) | `#A9B1AB` (antes `#A3ABA5`) | Texto secundario sobre las superficies tonales |
| `onPrimary` **nuevo** | `#FFFFFF` | `#0D2915` | Texto sobre `primary` (hoy se usa `surface`) |
| `primaryContainer` **nuevo** | `#C8EBD0` | `#1F4D2C` | Botón tonal, FAB, chip seleccionado |
| `onPrimaryContainer` **nuevo** | `#0F3D1D` | `#C4EBCC` | Texto e icono sobre `primaryContainer` |
| `outline` **nuevo** | `#737B75` | `#8C948E` | Borde de campos (≥ 3:1, componente no textual) |
| `outlineVariant` | (= `border` actual, `#C9D0CB`) | `#3A413C` | Separadores |
| `scrim` **nuevo** | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.6)` | Fondo tras la hoja inferior |
| `ripple` **nuevo** | `rgba(27,31,28,0.12)` | `rgba(232,236,233,0.12)` | `android_ripple` |
| `category.feed.accent` | `#875000` (antes `#9A5B00`) | `#F2B866` | |
| `category.hygiene.accent` | `#00695D` (antes `#00796B`) | `#7FD3C6` | |
| `category.settings.accent` | `#4A616C` (antes `#546E7A`) | `#B0BEC5` | |

`border` se renombra a `outlineVariant`. Los `container` de categoría no cambian.

### Contraste comprobado

| Pareja | Claro | Oscuro |
|---|---|---|
| `text` / `surfaceContainer` | 14.46 | 13.25 |
| `textMuted` / `surfaceContainer` | 6.17 | 7.20 |
| `textMuted` / `category.*.container` (cabecera) | ≥ 5.74 | ≥ 6.29 |
| `text` / `category.*.container` | ≥ 13.44 | ≥ 11.58 |
| `primary` / `surfaceContainer` | 5.53 | 7.64 |
| `onPrimary` / `primary` | 6.38 | 7.55 |
| `onPrimaryContainer` / `primaryContainer` | 9.53 | 7.47 |
| `danger` / `surfaceContainer` | 5.67 | 9.26 |
| `warning` / `surfaceContainer` | 5.14 | 9.64 |
| Acentos de categoría / su `container` | feed 5.63 · bio 5.19 · hyg 5.41 · set 5.29 | ≥ 7.08 |
| Acentos de categoría / `surfaceContainer` | ≥ 5.58 | ≥ 8.29 |
| `outline` / `surface` (borde de campo) | 4.36 | 5.23 |

### Tipografía, radios y elevación

- `typography`: se añade `lineHeight` a cada estilo (`title` 28, `heading` 24, `body` 22, `caption` 20, `label` 16) y `fontVariant: ['tabular-nums']` en un estilo nuevo `number` (16 / 600) para fechas y cantidades. Los tamaños 13 y 15 desaparecen: 13 → `caption` (14), 15 → `body` (16).
- `radius`: se añade `lg` 16 (tarjetas y hoja inferior) y `xl` 28 (FAB). Botones y chips pasan a `pill`.
- `elevation` **nuevo**: `{ none: 0, fab: 3 }`. Solo el FAB tiene sombra; la cabecera, ninguna.

## PR 1 — Deuda de tokens (sin cambio visual)

- Sustituir los 90 estilos literales por `typography`, `spacing` y `radius`. Únicos cambios visibles: 13 → 14 y 15 → 16 en el tamaño de letra, y radios 4/10/20 → `sm`/`pill`.
- `scrim` como token (lo usa `SelectField`).
- Un test en `src/core/__tests__/` que recorra `src/core/ui`, `src/modules` y `src/app` y falle si aparece un color hexadecimal o un `fontSize` numérico fuera de `theme.ts`, para que la deuda no vuelva.

## PR 2 — Tokens y tema

- Valores nuevos de la tabla anterior en `theme.ts`; `border` → `outlineVariant` en todos los usos.
- `_layout.tsx`:
  - `headerShadowVisible: false`; en el inicio, cabecera en `background`.
  - En las pantallas de un módulo, cabecera en `category.container` y título en `text`. La categoría sale del registro: una función genérica `categoryForRoute(routeName, modules)` en `src/core/ui/categories.ts` (con tests) busca el módulo cuyo `route` es prefijo de la ruta. No sabe nada de ningún módulo concreto.
  - Barra de estado y barra de navegación del sistema con el color del fondo (`expo-system-ui`, ya instalado), en claro y oscuro.
- Tests: `categoryForRoute` (ruta exacta, subrutas, rutas sin módulo como `/backup` → `settings`).

## PR 3 — Componentes base: acciones y listas

En `src/core/ui/`, todos con `android_ripple` (`colors.ripple`) en lugar de opacidad:

- **`Button`**: variantes `filled`, `tonal`, `outlined`, `text` y `danger`; prop `icon?: IconName`; radio `pill`, alto 48. `secondary` pasa a llamarse `outlined`.
- **`Fab`** (nuevo): botón flotante extendido con icono y texto, abajo a la derecha, `primaryContainer`, elevación `fab`. `Screen` gana una prop `fab` que lo coloca y añade margen inferior a la lista para que no tape el último elemento.
- **`ListItem`**: fondo `surfaceContainer`, sin borde, radio `lg`. Props nuevas: `leading` (nodo a la izquierda), `lines` (líneas con jerarquía: la primera en `text`, el resto en `textMuted`) y `badgeTone: 'neutral' | 'primary' | 'warning'` («Inactivo» pasa a `neutral`).
- **`DateBadge`** (nuevo): día en grande y mes abreviado debajo (`23 / oct`), para el `leading` de los listados con fecha.
- **`SectionHeader`** (nuevo): encabezado `label` de grupo, para el inicio y los meses de los listados.
- **`groupByMonth(items, getIsoDate)`** (nuevo, en `src/core/dates.ts`): agrupa ya ordenados en secciones `{ title: 'Octubre 2026', data }`, con los nombres de mes en español sin depender de `Intl`. Con tests.
- **`ActionChip`** (nuevo): chip tonal con icono y texto para acciones secundarias (Exportar, Proveedores, Nuevo habitual). `Chip` (filtros) gana un icono `check` cuando está seleccionado y fondo `primaryContainer`. Los dos con alto táctil de 48 (`hitSlop` si el chip se ve más bajo).
- **`EmptyState`** (nuevo): icono en un contenedor, título, mensaje y acción opcional. `CenteredMessage` queda para carga y errores.
- **`Notice`** (nuevo): aviso con icono y tono `info | success | warning | danger`, sobre el `container` de su tono. Sustituye las cajas con borde sueltas.
- **`ModuleCard`**: `surfaceContainer`, sin borde, radio `lg`.

## PR 4 — Componentes base: campos

- **`TextField`**: borde `outline`; con foco, borde de 2 en `primary`; prop `icon` a la derecha. El texto de ejemplo se muestra como «p. ej. 9.340» (el prefijo lo añade el componente), para que no parezca un valor.
- **`DateField`**: icono `calendar-month-outline`; borrar con `close-circle-outline` en una zona de 48 × 48.
- **`SelectField`**: icono `chevron-down`; las opciones se abren en una **hoja inferior** (`Modal` con `animationType="slide"`, radio `lg` arriba, fondo `scrim`), marcando la elegida con `check`.
- **`Checkbox`**: iconos `checkbox-marked` / `checkbox-blank-outline` de 24 en `primary`, fila de 48.
- **`SegmentedControl`** (nuevo): opciones fijas en una barra de 48 (unidades kg/t/l, y cualquier otra elección corta).
- **`Screen`** gana una prop `footer`: barra fija abajo, en `surface` con separador `outlineVariant`, para «Guardar» y «Guardar y añadir otro». Respeta el área segura y sube con el teclado.

## PR 5 — Inicio

- Cabecera sin sombra con el logo; grupos con `SectionHeader`.
- `ModuleCard` tonal. El grupo Configuración, con `ListItem` compacto con icono, para que pese menos que los módulos.
- `BackupReminder` pasa a `Notice` (`warning` si hace tiempo de la última copia, `danger` si nunca se ha hecho).

## PR 6 — Listados

Listados principales de los cinco módulos y listados de favoritos (proveedores, plantillas, productos, vehículos):

- «Nueva…» pasa al `Fab`; Exportar y el resto de acciones, a una fila de `ActionChip` junto a «Filtros».
- `SectionList` agrupado por mes con `groupByMonth` cuando el listado tiene fecha; los listados por año (higiene, limpieza periódica) se agrupan por año, como ahora.
- Cada registro con `DateBadge` y líneas con jerarquía. Por ejemplo, en alimentos: «6.500 kg · Corderos cebo granulado» en `text`, y «Coop. Nuestra Señora de la Sierra · Factura COOP-2026/00292 · Camión 4521 KTB» en `textMuted`.
- `EmptyState` con el icono del módulo y la acción «Nueva…».
- El aviso de «Entradas de una visita» pasa a `Notice` con la acción «Ver todas».

## PR 7 — Formularios y detalle

- Barra fija `footer` con «Guardar» (y «Guardar y añadir otro» donde exista); «Borrar» queda al final del formulario como botón `text` en `danger`.
- «Guardada: …» pasa a `Notice` `success`.
- Unidades con `SegmentedControl`.
- Repasar en todos los formularios que los textos de ejemplo sigan teniendo sentido con el prefijo «p. ej.».

## PR 8 — Exportación, generación, ajustes y copia de seguridad

- `TableExportScreen`: periodo en una tarjeta tonal; botones con icono (`printer`, `file-pdf-box`, `microsoft-excel`): Imprimir `filled`, los otros dos `tonal`.
- `YearGenerationScreen`: los avisos pasan a `Notice`; «Guardar año» en el `footer`.
- `FarmSettingsScreen`, `BackupScreen` y `FarmCodeInfo`: `ListItem`, `Notice` y `footer` donde corresponda.

## PR 9 — Guía

Actualizar `.claude/skills/guia-diseno/SKILL.md`:

- Principios: diseño tonal en vez de plano con bordes; ripple; FAB para crear; barra fija para guardar.
- Tablas de tokens nuevas (colores, contraste, tipografía con `lineHeight`, radios, elevación).
- Componentes nuevos y cuándo usar cada uno (`Fab`, `ActionChip`, `Notice`, `EmptyState`, `SegmentedControl`, `DateBadge`, `SectionHeader`, `footer`).
- Iconos nuevos en la tabla de acciones: `calendar-month-outline`, `chevron-down`, `close-circle-outline`, `check`, `printer`.
- Actualizar el paso 2 de `nuevo-modulo-tabla` si cambia algo de lo que pide (p. ej. el icono del estado vacío).

## Dependencias nuevas

Sin dependencias nuevas. El ripple es nativo de `Pressable` en Android, la hoja inferior usa `Modal`, los iconos vienen de `@expo/vector-icons` y la barra del sistema usa `expo-system-ui`, todo ya instalado. `react-native-reanimated` no hace falta en este plan.

## Fuera de alcance

- Lógica, base de datos, repositorios y validaciones.
- Exportación PDF/Excel (copia el papel).
- Resúmenes por módulo en el inicio («14 este mes»): exigen lógica nueva en cada módulo; se puede plantear aparte.
- Snackbar con «Deshacer» y animaciones más allá del ripple.
- iOS.

## Decisiones

- La categoría de cada pantalla se deduce de la ruta y el registro en `_layout.tsx`; los módulos no declaran nada nuevo.
- «Borrar» deja de ser un botón grande: pasa al final del formulario como botón de texto en rojo y sigue pidiendo confirmación.
- El prefijo «p. ej.» lo pone `TextField`, no cada pantalla.
- El test contra estilos literales entra en el PR 1 para que los PR siguientes no reintroduzcan deuda.

## Verificación en cada PR

- `npm test`, `npm run lint` y `npx tsc --noEmit`.
- Emulador con los datos de ejemplo: capturas «después» en `docs/rediseno/despues/` con los mismos nombres que las de `docs/rediseno/antes/`, en claro y oscuro, y compararlas.
- Comprobar zonas táctiles de 48 dp (Opciones de desarrollador → «Mostrar límites de diseño») y el contraste de cualquier color nuevo que no esté en la tabla.
