---
name: guia-diseno
description: Guía visual de la app — paleta claro/oscuro, colores por categoría de módulo, tipografía, espaciados, tarjetas e iconos MaterialCommunityIcons. Úsala al crear o modificar pantallas, componentes de `src/core/ui/` o módulos.
---

# Guía de diseño

Referencia visual de la app. Los valores viven como tokens en `src/core/ui/theme.ts` y se usan con `useThemeColors()`; si un token de esta guía aún no existe allí, se añade a `theme.ts` (nunca se escribe el valor literal en una pantalla).

## 1. Principios

- La app se usa en exterior, con prisa y a veces con guantes: contraste alto, texto de cuerpo 16 (nunca menos de 12) y zonas táctiles de al menos 48 dp.
- Diseño plano y sobrio: bordes finos, sin sombras. El color identifica la categoría del módulo; no es decoración.
- Nunca colores, tamaños ni radios literales en pantallas: siempre tokens de `theme.ts`.
- Un icono nunca es el único portador de significado: va junto a un texto o lleva `accessibilityLabel`.
- Toda pantalla se revisa en modo claro y oscuro (`userInterfaceStyle: "automatic"`).

## 2. Paleta base

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `background` | `#F4F6F4` | `#121513` | Fondo de pantalla |
| `surface` | `#FFFFFF` | `#1D211E` | Tarjetas, campos, texto sobre relleno `primary` |
| `text` | `#1B1F1C` | `#E8ECE9` | Texto principal |
| `textMuted` | `#5B635D` | `#A3ABA5` | Subtítulos, ayudas, chevrons |
| `border` | `#D8DDD9` | `#343A36` | Bordes de tarjetas y campos |
| `primary` | `#2E6B3F` | `#7CC48F` | Acción principal (verde campo) |
| `danger` | `#B3261E` | `#F2B8B5` | Borrar, errores |
| `warning` | `#8A5A00` | `#F5C26B` | Avisos (p. ej. recordatorio de copia de seguridad) |
| `success` | `#2E6B3F` | `#7CC48F` | Confirmaciones |

## 3. Color por categoría

Cada módulo pertenece a una categoría. La categoría aporta un `accent` (icono, borde activo, badge) y un `container` (fondo suave del icono). Contraste del acento sobre `surface` ≥ 5:1 en ambos modos.

| Categoría (`category`) | `accent` claro | `container` claro | `accent` oscuro | `container` oscuro |
|---|---|---|---|---|
| Alimentación (`feed`) — ámbar | `#9A5B00` | `#FBEBD0` | `#F2B866` | `#3A2A12` |
| Bioseguridad (`biosecurity`) — azul | `#1F5FA8` | `#DCE8F7` | `#9CC3F0` | `#172A40` |
| Higiene (`hygiene`) — verde azulado | `#00796B` | `#D3EEEA` | `#7FD3C6` | `#12302C` |
| Configuración (`settings`) — gris pizarra | `#546E7A` | `#E3E8EB` | `#B0BEC5` | `#263035` |

En `theme.ts`: `colors.category.<categoría>.accent` y `.container`.

## 4. Tipografía

Fuente del sistema (Roboto). No se añaden fuentes externas.

| Estilo | Tamaño / peso | Uso |
|---|---|---|
| `title` | 22 / 700 | Cabecera de pantalla o sección principal |
| `heading` | 18 / 600 | Título de tarjeta |
| `body` | 16 / 400 | Texto general y valores de campos; botones en 600 |
| `caption` | 14 / 400 | Subtítulos y ayudas, en `textMuted` |
| `label` | 12 / 600 | Badges, encabezados de grupo, etiquetas de campo |

Fechas y cantidades en listados con `fontVariant: ['tabular-nums']` para que se alineen.

## 5. Espaciados y radios

- `spacing`: `xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 32.
  - Padding de pantalla y de tarjeta: `md`. Separación entre tarjetas: `md`. Entre título y subtítulo: `xs`. Entre grupos de la pantalla de inicio: `lg`.
- `radius`: `sm` 8 (botones, campos, chips), `md` 12 (tarjetas y contenedor de icono), `pill` 999 (badges).
- Altura mínima de cualquier control táctil: 48.

## 6. Tarjetas

- **Tarjeta base** (`ListItem`): fondo `surface`, borde `StyleSheet.hairlineWidth` en `border`, radio `md`, padding `md`, sin sombra ni `elevation`. Al pulsar, opacidad 0.7.
- **Tarjeta de módulo** (pantalla de inicio), en fila:
  1. Contenedor de icono 44×44, radio `md`, fondo `category.container`, icono de 26 en `category.accent`.
  2. Título (`heading`, `text`) y descripción (`caption`, `textMuted`), ocupando el espacio restante.
  3. `chevron-right` de 24 en `textMuted`.
- **Inicio agrupado por categoría**: encabezado `label` en `textMuted` sobre cada grupo, en el orden Alimentación, Bioseguridad, Higiene y Configuración al final.
- **Badges**: texto `label`, borde 1 y texto en el acento correspondiente (`primary` o `category.accent`), radio `pill`.

## 7. Iconos

Solo `MaterialCommunityIcons` de `@expo/vector-icons` (funciona sin conexión: la fuente va en el APK).

```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
```

Tipar los nombres con `IconName` para que TypeScript rechace iconos inexistentes.

- Tamaños: 20 en línea con texto, 24 estándar (acciones, chevrons), 26 en la tarjeta de módulo.
- Variante rellena para el icono de módulo; variante `-outline` para acciones y estados.
- Color siempre desde tokens (`text`, `textMuted`, `primary`, `category.*.accent`…).

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
| Nuevo registro | `plus` |
| Ir a detalle | `chevron-right` |
| Exportar PDF | `file-pdf-box` |
| Exportar Excel | `microsoft-excel` |
| Generar año | `calendar-sync` |
| Aviso | `alert-circle-outline` |
| Ajustes | `cog-outline` |

## 8. Al crear o modificar un módulo

1. Elegir su categoría (o proponer una nueva con sus cuatro colores, comprobando el contraste).
2. Elegir el icono y comprobar que existe:
   ```sh
   node -e "const g=require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'); console.log('nombre-icono' in g)"
   ```
3. Añadir el módulo a la tabla de la sección 7.
4. Revisar sus pantallas en modo claro y oscuro.
