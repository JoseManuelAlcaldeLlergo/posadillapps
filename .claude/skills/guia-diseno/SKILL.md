---
name: guia-diseno
description: Guía visual de la app — diseño tonal (Material 3), paleta claro/oscuro con contrastes, colores por categoría, tipografía, espaciados, componentes de `src/core/ui/` (botón flotante, avisos, estados vacíos, barra fija para guardar…) e iconos MaterialCommunityIcons. Úsala al crear o modificar pantallas, componentes de `src/core/ui/` o módulos.
---

# Guía de diseño

Referencia visual de la app. Los valores viven como tokens en `src/core/ui/theme.ts` y se usan con `useThemeColors()`, `typography`, `spacing`, `radius` y `elevation`. Si un token de esta guía aún no existe allí, se añade a `theme.ts`; nunca se escribe el valor literal en una pantalla. El test `src/core/__tests__/styleTokens.test.ts` falla si aparece un color, `fontSize`, `fontWeight`, `borderRadius` o `lineHeight` literal en un `.tsx`.

## 1. Principios

- La app se usa en exterior, con prisa y a veces con guantes: contraste alto (texto ≥ 4.5:1, acentos ≥ 5:1 en claro y oscuro), texto de cuerpo 16 (nunca menos de 12) y zonas táctiles de al menos 48 dp.
- **Diseño tonal**: las superficies se separan por el tono, no por bordes. Tarjetas y listas sobre `surfaceContainer`; los bordes solo en campos de formulario (`outline`) y separadores (`outlineVariant`). Solo el botón flotante tiene sombra.
- **El color identifica**: la categoría del módulo tiñe la cabecera de todas sus pantallas y los iconos de módulo; el verde `primary` es la acción. El color no es decoración.
- **Respuesta al toque con ripple** de Android (`android_ripple={{ color: colors.ripple }}`), no con opacidad. Todo `Pressable` con radio lleva `overflow: 'hidden'`.
- **La acción principal siempre a mano**: en los listados, botón flotante («+ Nueva…»); en los formularios, barra fija abajo con «Guardar». Las acciones secundarias son chips con icono; borrar va al final del formulario, como texto en rojo, y siempre pide confirmación.
- Un icono nunca es el único portador de significado: va junto a un texto o lleva `accessibilityLabel`.
- Toda pantalla se revisa en modo claro y oscuro (`userInterfaceStyle: "automatic"`).

## 2. Paleta base

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `background` | `#F7F9F7` | `#121513` | Fondo de pantalla; cabecera del inicio |
| `surface` | `#FFFFFF` | `#1D211E` | Campos de formulario, hoja inferior, barra fija, chips sin seleccionar |
| `surfaceContainer` | `#EBF0EC` | `#1E2420` | Tarjetas, elementos de lista, panel de filtros |
| `surfaceContainerHigh` | `#DFE6E0` | `#29302B` | Chips de acción, `DateBadge`, avisos `info` |
| `text` | `#1B1F1C` | `#E8ECE9` | Texto principal |
| `textMuted` | `#525A54` | `#A9B1AB` | Texto secundario, ayudas, chevrons, textos de ejemplo |
| `outline` | `#737B75` | `#8C948E` | Borde de campos y del control segmentado |
| `outlineVariant` | `#C9D0CB` | `#3A413C` | Separadores, chips sin seleccionar |
| `primary` | `#2E6B3F` | `#7CC48F` | Acción principal, foco, casilla marcada |
| `onPrimary` | `#FFFFFF` | `#0D2915` | Texto e iconos sobre `primary` |
| `primaryContainer` | `#C8EBD0` | `#1F4D2C` | Botón tonal, botón flotante, chip seleccionado, aviso `success` |
| `onPrimaryContainer` | `#0F3D1D` | `#C4EBCC` | Texto e iconos sobre `primaryContainer` |
| `danger` | `#B3261E` | `#F2B8B5` | Borrar, errores, icono de aviso `danger` |
| `dangerContainer` / `onDangerContainer` | `#F9DEDC` / `#410E0B` | `#5C1A16` / `#F9DEDC` | Fondo y texto del aviso `danger` |
| `warning` | `#8A5A00` | `#F5C26B` | Icono de aviso `warning` |
| `warningContainer` / `onWarningContainer` | `#FCEFD2` / `#4D3200` | `#3D2E0B` / `#F7DFA8` | Fondo y texto del aviso `warning` |
| `success` | `#2E6B3F` | `#7CC48F` | Confirmaciones |
| `scrim` | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.6)` | Fondo tras la hoja inferior |
| `ripple` | `rgba(27,31,28,0.12)` | `rgba(232,236,233,0.12)` | Color del ripple |
| `logoBackground` | `#FFFFFF` | `#FFFFFF` | Fondo del logo (azul oscuro sobre blanco, como el icono) |

### Contraste comprobado

| Pareja | Claro | Oscuro |
|---|---|---|
| `text` / `background` | 15.76 | 15.41 |
| `text` / `surfaceContainer` | 14.46 | 13.25 |
| `textMuted` / `surfaceContainer` | 6.17 | 7.20 |
| `textMuted` / `surfaceContainerHigh` | 5.61 | 6.16 |
| `primary` / `surfaceContainer` | 5.53 | 7.64 |
| `onPrimary` / `primary` | 6.38 | 7.55 |
| `onPrimaryContainer` / `primaryContainer` | 9.53 | 7.47 |
| `danger` / `surfaceContainer` | 5.67 | 9.26 |
| `onDangerContainer` / `dangerContainer` (icono `danger`) | 12.77 (5.14) | 10.23 (7.62) |
| `onWarningContainer` / `warningContainer` (icono `warning`) | 10.39 (5.20) | 10.08 (8.04) |
| `outline` / `surface` (borde, componente no textual ≥ 3:1) | 4.36 | 5.23 |

Al añadir o cambiar un color, calcula su contraste (fórmula WCAG) contra cada fondo donde se use y añádelo a esta tabla.

## 3. Color por categoría

Cada módulo pertenece a una categoría. La categoría aporta un `accent` (icono del módulo, estado vacío) y un `container` (fondo del icono del módulo, **cabecera de todas las pantallas del módulo**, fondo del icono del estado vacío).

| Categoría (`category`) | `accent` claro | `container` claro | `accent` oscuro | `container` oscuro |
|---|---|---|---|---|
| Alimentación (`feed`) — ámbar | `#875000` | `#FBEBD0` | `#F2B866` | `#3A2A12` |
| Bioseguridad (`biosecurity`) — azul | `#1F5FA8` | `#DCE8F7` | `#9CC3F0` | `#172A40` |
| Higiene (`hygiene`) — verde azulado | `#00695D` | `#D3EEEA` | `#7FD3C6` | `#12302C` |
| Configuración (`settings`) — gris pizarra | `#4A616C` | `#E3E8EB` | `#B0BEC5` | `#263035` |

Contraste de cada `accent` sobre su `container` y sobre `surfaceContainer`: ≥ 5.19 en claro y ≥ 7.08 en oscuro. `text` sobre cualquier `container`: ≥ 13.44 en claro y ≥ 11.31 en oscuro.

En `theme.ts`: `colors.category.<categoría>.accent` y `.container`.

La cabecera toma el color sola: `src/app/_layout.tsx` usa `categoryForRoute(route.name, …)` con el registro de módulos y `settingsEntries`, así que un módulo nuevo no declara nada para tenerla. El inicio usa `background` en la cabecera y ninguna cabecera tiene sombra.

## 4. Tipografía

Fuente del sistema (Roboto). No se añaden fuentes externas.

| Estilo | Tamaño / peso / interlineado | Uso |
|---|---|---|
| `title` | 22 / 700 / 28 | Título de la cabecera del inicio |
| `heading` | 18 / 600 / 24 | Título de tarjeta y de elemento de lista, título del estado vacío |
| `body` | 16 / 400 / 22 | Texto general, valores de campos, primera línea de un elemento de lista |
| `bodyStrong` | 16 / 600 / 22 | Botones, títulos de aviso, opción elegida |
| `number` | 16 / 600 / 22, cifras tabulares | Fechas y cantidades que se alinean |
| `caption` | 14 / 400 / 20 | Ayudas y líneas secundarias, en `textMuted` |
| `captionStrong` | 14 / 600 / 20 | Etiquetas de campo, etiquetas de grupo de filtros |
| `label` | 12 / 600 / 16 | Encabezados de sección, badges, mes del `DateBadge` |

En un `TextInput` se anula el `lineHeight` (desplaza el texto y el cursor en Android); `TextField` ya lo hace.

## 5. Espaciados, radios y elevación

- `spacing`: `xxs` 2, `xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 32.
  - Padding de pantalla y de tarjeta: `md`. Entre elementos de lista: `sm`. Entre título y líneas de un elemento: `xxs`.
- `radius`: `sm` 8 (campos), `md` 12 (contenedor de icono, `DateBadge`), `lg` 16 (tarjetas, elementos de lista, avisos, hoja inferior), `xl` 28 (botón flotante), `pill` 999 (botones, chips, badges, control segmentado).
- `elevation`: `none` 0, `fab` 3. Solo el botón flotante tiene elevación.
- Altura mínima de cualquier control táctil: 48. Los chips se ven de 40 y llevan `hitSlop` hasta 48.

## 6. Componentes de `src/core/ui/`

### Estructura de pantalla
- **`Screen`**: fondo y área segura. `scroll` para formularios. `fab` coloca un `Fab` abajo a la derecha. `footer` añade la barra fija de abajo. Aparta el contenido y la barra del teclado (Android edge-to-edge no encoge la ventana).
- **`SectionHeader`**: encabezado de grupo (categoría en el inicio, mes o año en un listado).

### Acciones
- **`Button`** — variantes: `filled` (acción principal, una por pantalla), `tonal` (secundaria destacada: «Guardar y añadir otro», «Compartir PDF»), `outlined` (secundaria), `text`, `dangerText` (borrar al final de un formulario), `danger` (acción destructiva que debe destacar, p. ej. «Deshacer la última restauración»; borrados en línea). Prop `icon` opcional.
- **`Fab`**: acción principal de un listado («+ Nueva entrada»). Se pasa a `Screen` por `fab`, y la lista añade `FAB_CLEARANCE` a su `paddingBottom`.
- **`ActionChip`**: acción secundaria con icono («Exportar», «Proveedores», «Repetir», «Subir»/«Bajar»).
- **`Chip`**: elección o filtro; seleccionado, tonal y con ✓ (`check={false}` en filas cortas que deben caber en una línea, como los periodos predefinidos). `ChipRow` los agrupa.

### Listas
- **`ListItem`**: tarjeta tonal. `title` (lo principal: cantidad, matrícula, producto), `lines` (la primera en `text`, el resto en `textMuted`), `leading` (p. ej. `DateBadge`), `badge` + `badgeTone` (`neutral` por defecto; `primary` para algo destacado como «Automática»; `warning`), `actions` (chips dentro de la tarjeta).
- **`DateBadge`**: día y mes abreviado (`23` / `oct`) a la izquierda de los registros con fecha.
- **`groupByMonth`** (`src/core/dates.ts`): secciones por mes para `SectionList`, con título «Octubre 2026».
- **`ListToolbar`** + **`FilterGroup`**: chips de acción, «Filtros (n)», «Quitar filtros» y panel de filtros tonal.
- **`ModuleCard`**: tarjeta de módulo del inicio (contenedor de icono 44×44 en `category.container`, icono de 26 en `category.accent`, título, descripción y chevron).

### Estados y mensajes
- **`Notice`**: aviso con icono, tono `info` | `success` | `warning` | `danger`, `title` opcional y `action` opcional («Ver todas», «Ir a Ajustes»). Para «Guardada: …», falta de código de explotación, recordatorio de copia, filas omitidas, datos de solo lectura.
- **`EmptyState`**: listado vacío: icono (el del módulo, con `tone={colors.category[…]}`), título, mensaje y acción («Nueva…»). Con filtros activos, icono `filter-off-outline` y «No hay … con estos filtros», sin acción.
- **`CenteredMessage`**: solo para carga y errores a pantalla completa.

### Campos
- **`TextField`**: borde `outline`; con foco, 2 en `primary`; con error, 2 en `danger`. `example` muestra «p. ej. …» (para valores de muestra); `placeholder` para indicaciones que no son ejemplos («Sin límite», «Parte de la matrícula»). `icon` a la derecha. `optional` añade «(opcional)».
- **`DateField`** (icono de calendario; `clearable` añade borrar en 48×48), **`DateRangeField`**, **`YearRangeField`**.
- **`SelectField`**: lista fija; las opciones se abren en una hoja inferior.
- **`SegmentedControl`**: elección corta y fija en una barra de 48 (unidades kg / t / l).
- **`Checkbox`**: casilla con icono, fila de 48.
- **`SuggestionChips`** y **`FrequencyField`**: sugerencias como chips bajo un campo.

### Pantallas genéricas
- **`TableExportScreen`**: periodo, recuento en `Notice`, Imprimir (`filled`) y Compartir PDF / Excel (`tonal`).
- **`YearGenerationScreen`**: filas propuestas en tarjetas tonales y «Guardar N filas de AAAA» en la barra fija.

## 7. Patrones por tipo de pantalla

- **Listado de módulo**: `Screen` con `fab` → `SectionList` con `ListToolbar` de cabecera → secciones con `SectionHeader` (habituales primero, después registros por mes con `groupByMonth`, o por año) → `ListItem` con `DateBadge` → `EmptyState` si no hay nada.
- **Formulario**: `Screen scroll footer={<Button label="Guardar" icon="content-save-outline" …/>}` (+ «Guardar y añadir otro» `tonal` si existe) → campos → al final, en edición, acciones secundarias y `Button variant="dangerText"` para borrar.
- **Exportación**: `TableExportScreen`. **Generar año**: `YearGenerationScreen`.

## 8. Iconos

Solo `MaterialCommunityIcons` de `@expo/vector-icons` (funciona sin conexión: la fuente va en el APK).

```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
```

Tipar los nombres con `IconName` (exportado por `src/core/ui`) para que TypeScript rechace iconos inexistentes.

- Tamaños: 18 en chips, 20 en botones y en línea con texto, 24 estándar (campos, acciones, avisos), 26 en la tarjeta de módulo, 36 en el estado vacío.
- Variante rellena para el icono de módulo; variante `-outline` para acciones y estados.
- Color siempre desde tokens (`text`, `textMuted`, `primary`, `on…Container`, `category.*.accent`…).

### Icono y categoría de cada módulo

| Módulo | Categoría | Icono |
|---|---|---|
| Entradas de alimentos (`feed-entries`) | Alimentación | `silo` |
| Entrada de vehículos (`vehicle-entries`) | Bioseguridad | `truck-check` |
| Limpieza de vehículos (`vehicle-cleaning`) | Bioseguridad | `car-wash` |
| Higiene personal (`personal-hygiene`) | Higiene | `hand-wash` |
| Limpieza y desinfección (`cleaning-disinfection`) | Higiene | `spray-bottle` |
| Ajustes de la explotación | Configuración | `barn` |
| Copia de seguridad | Configuración | `backup-restore` |

### Iconos de acción comunes

| Acción | Icono |
|---|---|
| Nuevo registro (FAB, estado vacío) | `plus` |
| Guardar | `content-save-outline` |
| Borrar | `delete-outline` |
| Repetir | `repeat` |
| Subir / Bajar | `arrow-up` / `arrow-down` |
| Editar / Cerrar (tarjeta desplegable) | `pencil-outline` / `chevron-up` |
| Ir a detalle | `chevron-right` |
| Exportar (chip del listado) | `file-export-outline` |
| Imprimir | `printer-outline` |
| Compartir PDF | `file-pdf-box` |
| Compartir Excel | `microsoft-excel` |
| Generar año | `calendar-sync` |
| Fecha (campo) | `calendar-month-outline` |
| Desplegar opciones | `chevron-down` |
| Quitar valor | `close-circle-outline` |
| Seleccionado | `check` |
| Sin resultados con filtros | `filter-off-outline` |
| Compartir copia / Elegir archivo / Deshacer | `share-variant-outline` / `file-upload-outline` / `undo-variant` |
| Avisos | `information-outline`, `check-circle-outline`, `alert-outline`, `alert-circle-outline` (los pone `Notice`) |

## 9. Al crear o modificar un módulo

1. Elegir su categoría (o proponer una nueva con sus cuatro colores, comprobando el contraste de la sección 3).
2. Elegir el icono y comprobar que existe:
   ```sh
   node -e "const g=require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'); console.log('nombre-icono' in g)"
   ```
3. Añadir el módulo a la tabla de la sección 8.
4. Construir sus pantallas con los patrones de la sección 7, sin estilos literales.
5. Revisar sus pantallas en modo claro y oscuro, con datos (`npm run sample:backup`) y vacías.
