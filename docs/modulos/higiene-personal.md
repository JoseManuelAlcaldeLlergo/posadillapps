# Módulo: Higiene personal

## Propósito
Registro anual del "Plan de control de buenas prácticas de higiene personal". Cada fila declara una actuación de higiene que se realiza de forma periódica durante un año (p. ej. limpieza de manos y botas en la nave, mensualmente). El responsable firma a mano sobre la tabla impresa.

## Campos de cada registro
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| Año | Entero | Sí | Por defecto, el año actual. |
| Código de explotación | Texto | Sí | Se rellena solo desde Ajustes de la explotación; no se edita en el formulario. Se guarda como snapshot. |
| Unidad productiva | Texto con sugerencias | Sí | Sugerencias desde Ajustes: p. ej. "Ovino", "Porcino", "Ovino y porcino". |
| Actuación | Texto con sugerencias | Sí | Desde las plantillas de actuación. Ej.: "Limpieza de manos, botas". |
| Lugar | Texto con sugerencias | Sí | Ej.: "Nave", "Naves". |
| Resultado | Texto | Sí | Ej.: "Mensualmente año 2013". |
| Medidas correctoras | Texto | No | |
| Fecha | Texto | Sí | No es una fecha concreta, sino una periodicidad. Ej.: "1 de cada mes 2013". |

La **firma del responsable** no se guarda en la app: es una columna vacía en la exportación para firmar en papel.

## Plantillas de actuación (favoritos)
Hay varias actuaciones distintas, y cada año se repiten casi iguales. Para no reescribirlas, el módulo tiene **plantillas de actuación**, gestionadas desde su propia pantalla:

| Campo de la plantilla | Notas |
| --- | --- |
| Actuación | Nombre de la actuación. |
| Unidad productiva, Lugar, Medidas correctoras | Valores por defecto. |
| Resultado, Fecha | Textos con el marcador `{año}`, p. ej. `Mensualmente año {año}` y `1 de cada mes {año}`. |
| Activa | Las inactivas no se usan al generar un año nuevo. |

## Reglas
- **Generar año**: acción principal del módulo. El usuario elige un año y la app crea una fila por cada plantilla activa, sustituyendo `{año}`. Antes de guardar, muestra las filas para revisarlas o editarlas.
- Si ya existen filas de ese año para una plantilla, no se duplican: se avisa y se omiten.
- También se puede añadir una fila suelta, eligiendo una plantilla o desde cero, y ofrecer guardarla como plantilla.
- Al editar una plantilla no cambian las filas ya creadas.
- En papel se usan comillas (") para repetir el valor de la fila anterior. En la app se guarda siempre el texto completo.

## Ajustes de la explotación (cambio en `src/core/`)
Este módulo necesita datos de la explotación que no pertenecen a ningún módulo. Se crea una pantalla de **Ajustes de la explotación** común, reutilizable por futuros módulos:

- Código de explotación (texto libre).
- Unidades productivas (lista editable, p. ej. Ovino, Porcino).

Si el código de explotación no está configurado, el módulo pide configurarlo antes de crear filas.

## Listado
- Filas agrupadas por año, del más reciente al más antiguo.
- Filtros por año y por actuación.
- Editar y borrar (con confirmación).

## Exportación
- Título sobre la tabla: "PLAN DE CONTROL DE BUENAS PRÁCTICAS DE HIGIENE PERSONAL" (usa el título opcional del motor, ya implementado para vehículos).
- Columnas en el orden del papel: `CÓDIGO DE EXPLOTACIÓN | UNIDAD PRODUCTIVA | ACTUACIÓN | LUGAR | RESULTADO | MEDIDAS CORRECTORAS | FIRMA DEL RESPONSABLE | FECHA`
- **FIRMA DEL RESPONSABLE** siempre vacía, con anchura y altura de fila suficientes para firmar a mano.
- **Periodo por rango de años** (desde año – hasta año), no por rango de fechas. Si la pantalla de exportación actual solo admite rango de fechas, el tipo de periodo debe declararse en la definición de tabla (p. ej. `periodType: 'dateRange' | 'yearRange'`) para que siga siendo genérica. Proponer este cambio en el plan.
- Orden: por año ascendente y, dentro de cada año, por el orden de las plantillas.
- Orientación: A4 apaisado.
- En Excel, la columna de firma se incluye vacía para mantener el formato del papel.

## Criterios de aceptación
- [ ] Configurar el código de explotación y las unidades productivas en Ajustes.
- [ ] Crear varias plantillas de actuación con `{año}` en Resultado y Fecha.
- [ ] Generar un año completo en menos de 30 segundos, revisando las filas antes de guardar.
- [ ] Intentar generar el mismo año otra vez sin que se dupliquen filas.
- [ ] Exportar un rango de años a PDF con el título, la columna de firma vacía y espacio para firmar, e imprimirlo.
- [ ] Exportar a Excel el mismo rango.
- [ ] Los módulos de alimentos y vehículos siguen exportando igual tras los cambios en el motor.
