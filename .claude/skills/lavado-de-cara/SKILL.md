---
name: lavado-de-cara
description: Audita el diseño visual actual de la app (tokens, componentes de `src/core/ui/` y pantallas) y redacta un plan por fases para modernizarlo sin tocar la lógica. Solo planifica: no implementa. Úsala cuando se pida revisar, modernizar o rediseñar el aspecto de la app.
disable-model-invocation: true
argument-hint: "[alcance opcional: toda la app, «inicio», un módulo, «formularios»…]"
---

# Lavado de cara del diseño

Objetivo: que la app se vea actual sin perder lo que la hace útil en la explotación (exterior, prisas, guantes, sin conexión). El resultado es **un plan aprobado por el usuario** en `docs/planes/lavado-de-cara.md`, no código.

Alcance pedido: `$ARGUMENTS` (si está vacío, toda la app).

## Reglas

- **No modifiques código** en esta skill. Solo lees, auditas, propones y escribes el plan.
- El rediseño es solo de presentación: no cambia esquemas, migraciones, repositorios, `tableDefinition.ts` ni `src/core/export/` (los PDF/Excel copian el papel y no forman parte del lavado de cara).
- Se mantienen los principios de la skill `guia-diseno` que no son estéticos: contraste alto (texto ≥ 4.5:1, acentos ≥ 5:1 en ambos modos), cuerpo 16, controles ≥ 48 dp, icono siempre con texto o `accessibilityLabel`, modo claro y oscuro, solo tokens de `theme.ts`.
- Lo estético de `guia-diseno` (planitud, sin sombras, bordes finos, tamaños, radios, paleta) **sí se puede replantear**: es precisamente lo que se revisa.
- Cada dependencia nueva va justificada en el plan (qué aporta, peso, que funciona sin conexión y en Android). Preferir lo que ya está instalado: `react-native-reanimated`, `react-native-gesture-handler`, `@expo/vector-icons`, `expo-font`, `expo-system-ui`.
- Nada específico de iOS. Nada que necesite red.
- Las piezas comunes se cambian en `src/core/ui/` sin meter lógica de ningún módulo.

## Paso 1 — Inventario

1. Lee `.claude/skills/guia-diseno/SKILL.md`, `src/core/ui/theme.ts`, `src/core/ui/index.ts` y todos los componentes de `src/core/ui/`.
2. Lee `src/app/_layout.tsx`, `src/app/index.tsx` y lista las rutas de `src/app/`. Clasifica cada pantalla por tipo: **inicio**, **listado**, **formulario**, **detalle/edición**, **exportación**, **generación de año**, **ajustes**. Casi todas comparten componentes, así que se audita por tipo, no pantalla a pantalla.
3. Lee al menos una pantalla de cada tipo (pantalla en `src/modules/<modulo>/screens/`) para ver cómo se combinan los componentes.
4. Busca estilos que se saltan los tokens (son deuda que el plan debe cerrar antes de cambiar el aspecto):
   ```sh
   grep -rnE "#[0-9A-Fa-f]{3,8}\b|fontSize: *[0-9]|fontWeight: *'[0-9]|borderRadius: *[0-9]|padding[A-Za-z]*: *[0-9]|margin[A-Za-z]*: *[0-9]|gap: *[0-9]" src/core/ui src/modules src/app | grep -v theme.ts
   ```

## Paso 2 — Capturas del estado actual

El código no basta para juzgar si algo «parece antiguo». Necesitas ver la app.

Capturas necesarias (en `docs/rediseno/antes/`, nombre `<tipo>-<claro|oscuro>.png`): inicio, un listado con datos, un listado vacío, un formulario, una exportación; en claro y en oscuro.

### Opción A — Emulador (preferida)

`adb` y `emulator` pueden no estar en el PATH; usa las rutas del SDK:

```sh
ADB="$ANDROID_HOME/platform-tools/adb"; EMU="$ANDROID_HOME/emulator/emulator"
"$EMU" -list-avds
```

1. Si no hay ya un dispositivo en `"$ADB" devices`, arranca un emulador de **teléfono estándar** (evita plegables y tablets: deforman la maqueta) en segundo plano y espera a que arranque:
   ```sh
   "$EMU" -avd <nombre> -no-snapshot-save &
   "$ADB" wait-for-device shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'
   ```
   Si solo hay AVD raros, pide al usuario que cree uno de teléfono (Android Studio → Device Manager → Pixel 8, API 35).
2. Instala y abre la app con `npx expo run:android` (en segundo plano: compila y deja Metro corriendo).
3. **Datos realistas**: en un emulador recién creado la BD está vacía y un listado vacío no muestra los problemas de uno lleno. Pide al usuario que restaure una copia de seguridad (pantalla «Copia de seguridad»); para pasarle el archivo: `"$ADB" push <copia> /sdcard/Download/`. Si no tiene copia, que cree unos cuantos registros por módulo.
4. Para cada pantalla, pide al usuario que navegue a ella (o navega tú con el esquema `posadillapps://`: `"$ADB" shell am start -a android.intent.action.VIEW -d "posadillapps:///<ruta>"`) y captura en los dos modos:
   ```sh
   "$ADB" shell cmd uimode night no
   "$ADB" exec-out screencap -p > docs/rediseno/antes/<tipo>-claro.png
   "$ADB" shell cmd uimode night yes
   "$ADB" exec-out screencap -p > docs/rediseno/antes/<tipo>-oscuro.png
   ```
   Al terminar, deja el modo como estaba (`night no`).

### Opción B — Capturas del usuario

Si no se puede usar emulador ni móvil por USB, pide al usuario que deje las capturas en `docs/rediseno/antes/` con esos nombres. Espera a tenerlas.

### Revisarlas

Mira cada captura (herramienta Read) y anota lo que ves, no lo que supones por el código.

## Paso 3 — Auditoría

Evalúa con los criterios de [criterios.md](criterios.md). Para cada hallazgo anota:

- **Qué**: síntoma concreto («todas las tarjetas tienen el mismo peso visual; el título de pantalla no destaca sobre el contenido»).
- **Dónde**: componente o tipo de pantalla, con `ruta:línea`.
- **Por qué envejece la app** o por qué empeora el uso en campo.
- **Impacto** (alto/medio/bajo) y **esfuerzo** (S/M/L). Como casi todo sale de `src/core/ui/`, un cambio en un componente suele ser alto impacto y esfuerzo S.

Separa también **lo que funciona y se conserva** (p. ej. colores por categoría, agrupación del inicio): un lavado de cara no es empezar de cero.

## Paso 4 — Direcciones visuales

Propón **2 o 3 direcciones** distintas y coherentes, no una lista de retoques sueltos. Por ejemplo:

- **Material 3 actualizado**: superficies tonales en vez de bordes, botones de pastilla, FAB extendido para «Nuevo», barra superior grande que se contrae.
- **Campo moderno**: más aire, tarjetas grandes con resumen (último registro, nº de registros del mes), color de categoría más presente en cabeceras.
- **Minimal de alto contraste**: tipografía con más jerarquía, menos cajas, separadores y listas a sangre.

Para cada una: qué cambia en tokens (color, tipografía, radios, elevación), en componentes y en la sensación general; riesgos para el uso en exterior; dependencias nuevas, si las hay.

Preséntalas con `AskUserQuestion` usando `preview` con una maqueta ASCII de **la pantalla de inicio y un listado** en cada dirección, y recomienda una. Si el usuario quiere verlas con color real, ofrece una maqueta HTML estática publicada como Artifact (solo maqueta para decidir; no es código de la app).

No sigas hasta que el usuario elija (o combine) una dirección.

## Paso 5 — Plan

Escribe `docs/planes/lavado-de-cara.md` con el estilo de los otros planes de `docs/planes/` (en español, por PR, concreto):

1. **Diagnóstico**: resumen de la auditoría en una tabla (hallazgo · dónde · impacto · esfuerzo) y lo que se conserva.
2. **Dirección elegida**: descripción y la maqueta acordada.
3. **Tokens nuevos**: tabla de valores claro/oscuro para cada token que cambia o se añade en `theme.ts` (incluye ratios de contraste de texto y acentos sobre sus fondos).
4. **PRs en orden**, cada uno pequeño, revisable y que deja la app funcionando:
   - **PR 1 — Deuda de tokens**: eliminar estilos literales detectados en el paso 1 (sin cambio visual).
   - **PR 2 — Tokens y tema**: nuevos valores en `theme.ts`, cabecera y barra de estado en `_layout.tsx`.
   - **PR 3 — Componentes base** de `src/core/ui/` (`Button`, `ListItem`, `ModuleCard`, campos, `Chip`, `Screen`…) y componentes nuevos genéricos si hacen falta (estado vacío, cabecera de sección, FAB…).
   - **PR 4+ — Por tipo de pantalla**: inicio, listados, formularios, exportación/generación. Un PR por tipo, no por módulo.
   - **Último PR — Guía**: actualizar `.claude/skills/guia-diseno/SKILL.md` con los nuevos principios, tokens, componentes y la tabla de iconos, para que los módulos futuros nazcan con el diseño nuevo.
5. **Dependencias nuevas** (o «Sin dependencias nuevas»).
6. **Fuera de alcance**: lógica, BD, exportación PDF/Excel, iOS.
7. **Verificación en cada PR**: `npm test`, `npm run lint`, `npx tsc --noEmit`; capturas «después» en `docs/rediseno/despues/` con los mismos nombres que las de «antes», en claro y oscuro; comprobar contraste y zonas táctiles de 48 dp.

Termina enseñando al usuario el diagnóstico resumido y la lista de PRs, y pregunta si aprueba el plan. La implementación se hace después, PR a PR, fuera de esta skill.
