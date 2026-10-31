# Criterios de auditoría

Señales que hacen que una app Android se vea antigua, agrupadas. Para cada una: si aparece, dónde, y si de verdad perjudica (no todo lo «moderno» conviene en una app de campo).

## Jerarquía y composición

- Todo tiene el mismo peso: tarjetas idénticas, sin un elemento que guíe la vista.
- El título de pantalla no se distingue del contenido; no hay cabecera grande ni resumen arriba.
- Pantallas que son solo una lista de cajas con borde, sin agrupación ni encabezados de sección.
- Densidad desequilibrada: o todo apretado o mucho hueco sin intención.
- La acción principal («Nuevo», «Guardar») no está siempre a mano: escondida al final de un scroll o igual que las secundarias.

## Color y superficies

- Bordes finos grises como único recurso para separar (estilo Material 1 / Holo); sin superficies tonales ni contraste de fondo entre niveles.
- Color de categoría infrautilizado (solo en un icono pequeño) o, al revés, usado como decoración sin significado.
- Modo oscuro que es solo «invertir»: grises planos sin niveles de superficie.
- Barra de estado y barra de navegación del sistema que no casan con la cabecera ni el fondo (`expo-system-ui`, edge-to-edge).

## Tipografía

- Escala corta (pocas diferencias entre título, encabezado y cuerpo) → falta de jerarquía.
- Pesos poco contrastados; mayúsculas o negritas usadas para todo.
- Números (fechas, kilos, matrículas) sin cifras tabulares o sin destacar cuando son el dato principal.
- Fuente del sistema sin ajuste de interlineado (`lineHeight`) ni espaciado de letras en etiquetas.

## Componentes

- Botones rectangulares con borde grueso; sin variante tonal; todos del mismo ancho y peso.
- Respuesta al toque solo con opacidad, sin ripple de Android (`android_ripple` en `Pressable`).
- Campos de formulario como cajas sueltas sin etiqueta flotante/clara, sin estado de foco, error o ayuda visible.
- Falta de FAB o barra de acciones fija para crear registros.
- Chips, badges y selectores con estilos distintos entre sí.
- Diálogos de confirmación nativos (`Alert`) para todo, incluso donde un snackbar con «Deshacer» sería mejor.

## Estados

- Listado vacío con texto plano en vez de un estado vacío con icono, explicación y acción.
- Carga sin indicador o con un spinner a pantalla completa en vez de esqueleto o carga contenida.
- Errores y avisos sin estilo propio (color, icono, contenedor).
- Sin confirmación visual tras guardar o exportar.

## Movimiento

- Transiciones por defecto o ninguna; aparición brusca de elementos.
- Sin feedback al pulsar, guardar o borrar. (El movimiento debe ser breve y nunca bloquear: se usa con prisa.)

## Coherencia

- Estilos literales fuera de `theme.ts` (ver el `grep` del paso 1).
- Componentes duplicados o resueltos de forma distinta en cada módulo.
- Iconos de familias o variantes mezcladas (relleno vs. `-outline`) sin regla.
- Espaciados que no siguen la escala `spacing`.

## Uso en campo (no negociable)

Cualquier propuesta se descarta o se ajusta si:

- Baja el contraste por debajo de 4.5:1 en texto o 5:1 en acentos, en claro u oscuro.
- Reduce zonas táctiles por debajo de 48 dp o separa poco los controles (guantes).
- Depende de gestos finos (deslizar para borrar como única vía, pulsación larga oculta).
- Necesita conexión o añade peso notable al APK sin aportar claridad.
