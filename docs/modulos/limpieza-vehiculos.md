# Módulo: Limpieza y desinfección de vehículos

## Propósito
Registro de la limpieza y desinfección de los vehículos de la explotación, según el formulario en papel "Plan de limpieza y desinfección de vehículos de las explotaciones". El responsable firma a mano sobre la tabla impresa.

## Tipos de registro
1. **Limpieza periódica anual**: un vehículo que se limpia con una frecuencia fija durante un año (p. ej. "Semanalmente"). En papel se repite una fila por vehículo y año, con la revisión "Semanalmente 2022", "Semanalmente 2023"…
2. **Limpieza puntual**: una limpieza concreta en una fecha concreta.

## Campos
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| Matrícula | Texto | Sí | Admite matrícula o número de bastidor (hasta 17 caracteres), sin validar formato. Mayúsculas. |
| Año | Entero | Solo periódicas | |
| Fecha | Fecha (puntual) o texto de frecuencia (periódica) | Sí | Frecuencia con sugerencias: "A diario", "Semanalmente", "Mensualmente". |
| Producto empleado | Texto con sugerencias | Sí | Sugerencias desde los productos favoritos del módulo de limpieza y desinfección. Ej.: "Cipergen". |
| Tipo de vehículo | Texto con sugerencias | Sí | Sugerencias: "Particular", "Turismo", "Camión", "Tractor", "Remolque". |
| Fecha de revisión | Texto | No | En periódicas, por defecto `{frecuencia} {año}` (p. ej. "Semanalmente 2023"). En puntuales, libre. Vacía se exporta "—". |

La **firma del responsable** no se guarda: es una columna vacía en la exportación.

## Vehículos de limpieza periódica
Lista de vehículos que se limpian periódicamente, gestionada desde una pantalla propia del módulo:

| Campo | Notas |
| --- | --- |
| Matrícula | Sugerencias desde las matrículas del módulo Entrada de vehículos. |
| Frecuencia | Ej.: "Semanalmente". |
| Producto, Tipo de vehículo | Valores por defecto. |
| Activo | Los inactivos no se usan al generar un año nuevo. |

## Reglas
- **Generar año**: igual que en el módulo de higiene personal. El usuario elige un año y la app crea una fila por cada vehículo activo, con la revisión `{frecuencia} {año}`, para revisarlas antes de guardar. Sin duplicados si ya existen filas de ese año para ese vehículo.
- **Limpieza puntual** con la acción "Repetir", como en el módulo de limpieza y desinfección.
- Al escribir una matrícula ya usada, se rellenan producto y tipo con los de su último registro.
- **Dependencias**: este módulo lee matrículas del módulo Entrada de vehículos y productos del módulo de limpieza y desinfección, solo a través de su `index.ts` público y solo para sugerencias. Nunca escribe en ellos. Si los productos favoritos se usan ya en dos módulos, valorar en el plan moverlos a un catálogo común en `src/core/`.
  - Decisión: no se mueven por ahora. Limpieza y desinfección sigue siendo su dueño y expone `listProductNames` en su `index.ts`. Se pasarán a `src/core/` cuando un segundo módulo necesite crearlos o editarlos.
- Reutilizar "Generar año", registros habituales y el selector de periodo que ya existan en `src/core/`; no reimplementarlos.

## Listado
- Dos secciones: limpiezas periódicas agrupadas por año y limpiezas puntuales por fecha, las más recientes primero.
- Filtros por año o rango de fechas y por matrícula.
- Editar, borrar (con confirmación) y "Repetir".

## Exportación
- Título sobre la tabla: "PLAN DE LIMPIEZA Y DESINFECCIÓN DE VEHÍCULOS DE LAS EXPLOTACIONES".
- Columnas en el orden del papel: `MATRÍCULA | FECHA | PRODUCTO EMPLEADO | TIPO DE VEHÍCULO | FIRMA DEL RESPONSABLE | FECHA DE REVISIÓN`
- Periodo por **rango de fechas**. Orden de filas:
    1. Las limpiezas periódicas de los años que caen dentro del rango, por año y matrícula.
    2. Las limpiezas puntuales del rango, por fecha ascendente.
- Formato de fecha `dd/mm/aaaa`.
- FIRMA DEL RESPONSABLE vacía, con espacio para firmar.
- Orientación: A4 apaisado.

## Criterios de aceptación
- [ ] Dar de alta un vehículo de limpieza periódica eligiendo una matrícula del módulo de vehículos.
- [ ] Dar de alta uno identificado por número de bastidor.
- [ ] Generar un año y ver "Semanalmente {año}" en la fecha de revisión.
- [ ] Generar el mismo año otra vez sin duplicados.
- [ ] Registrar una limpieza puntual eligiendo un producto favorito existente.
- [ ] Exportar un rango que abarque dos años y ver las filas periódicas de ambos años al principio.
- [ ] Exportar a PDF con título y columna de firma vacía, e imprimirlo; exportar a Excel.
- [ ] Los demás módulos siguen funcionando y exportando igual.
