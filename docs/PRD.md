# PRD — App de gestión de explotación ganadera

## Visión

App Android para gestionar los registros de una explotación ganadera desde el móvil. Se construye por módulos: cada módulo es un tipo de registro (una tabla) con su formulario, su listado y su exportación. La v1 incluye dos módulos: **Entradas de alimentos** y **Entrada de vehículos**. Los módulos con especificación propia se detallan en `docs/modulos/`.

## Alcance de la v1

- Plataforma: solo Android.
- Una sola explotación (sin multi-explotación ni multiusuario).
- Datos guardados en el móvil; funciona sin conexión.
- Copia de seguridad en la nube.
- Exportación a PDF (con impresión) y a Excel.

Fuera de alcance en v1: iOS, varias explotaciones, usuarios y permisos, sincronización en tiempo real entre dispositivos, módulos de tablas distintos de los descritos en este documento.

## Módulos

| # | Módulo | Especificación |
| --- | --- | --- |
| 1 | Entradas de alimentos | En este documento. |
| 2 | Entrada de vehículos | [modulos/entrada-vehiculos.md](modulos/entrada-vehiculos.md). Registro de bioseguridad; las entradas de alimentos con matrícula generan visitas automáticamente. |

## Módulo 1: Entradas de alimentos

### Campos de cada entrada

| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| Fecha | Fecha | Sí | Por defecto, hoy. En el papel suele ser fin de mes. |
| Cantidad | Número decimal + unidad | Sí | Unidad por defecto `kg`. |
| Proveedor | Texto | Sí | Seleccionable de favoritos o texto libre. |
| Denominación comercial del pienso | Texto | Sí | Sugerencias según el proveedor elegido. |
| Factura/Albarán | Texto | No | Formatos variados: `F2000 525`, `SU 79`. Texto libre. |
| Matrícula del camión | Texto | No | Sugiere los camiones habituales del proveedor elegido; si solo hay uno, se preselecciona. Admite texto libre y ofrece guardarlo como camión habitual del proveedor. Si se deja vacía, no se crea visita y se muestra un aviso. |

Reglas:

- **Una entrada por producto.** Si una factura incluye varios piensos, se crean varias entradas que comparten número de factura. Para agilizarlo, el formulario ofrece "Guardar y añadir otro de la misma factura", que conserva fecha, proveedor, factura y matrícula del camión.
- La entrada guarda el **texto** del proveedor y del pienso tal como se usó (snapshot), además de la referencia opcional al favorito. Renombrar o borrar un favorito no altera registros históricos.
- **Visita de vehículo automática.** Al guardar una entrada con matrícula se crea, o se vincula si ya existe, una visita en el módulo Entrada de vehículos (una sola por camión y día). La reasignación al cambiar fecha o matrícula y el borrado se describen en [Integración con Entradas de alimentos](modulos/entrada-vehiculos.md#integración-con-entradas-de-alimentos).

### Proveedores, piensos y camiones favoritos

- Pantalla independiente para gestionar proveedores favoritos (crear, editar, borrar).
- Cada proveedor tiene su lista de piensos habituales y su lista de **camiones habituales** (matrícula), gestionadas en la misma pantalla.
- La matrícula se guarda en mayúsculas, sin validar formato (conviven formatos como `6105 HHR` y `CO-46336-VE`).
- En el formulario de entrada:
    1. Al elegir proveedor se muestran sus piensos y camiones habituales como sugerencias.
    2. Si se escribe un proveedor, pienso o matrícula nuevos, se ofrece guardarlo como favorito.

Ejemplos reales: proveedor "Mezclas del Valle" con piensos "Cerdos crecimiento", "Cerdos preamontanera", "Alfalfa en rama"; proveedor "Sierra de los Santos SCA" con "Pienso Cordero Eco S/P".

### Listado

- Entradas ordenadas por fecha, la más reciente primero.
- Filtro por rango de fechas y por proveedor.
- Editar y borrar (con confirmación).

### Exportación

- El usuario elige un **rango de fechas libre** (con atajos: año actual, año anterior, mes actual).
- Tabla con estas columnas y este orden, como el formulario en papel:
  `FECHA | CANTIDAD | PROVEEDOR | DENOMINACIÓN COMERCIAL DEL PIENSO | FACTURA/ALBARÁN`
- La matrícula del camión **no** se exporta en esta tabla; queda reflejada en la exportación de Entrada de vehículos.
- Filas ordenadas por fecha ascendente.
- Sin cabecera de explotación: solo la tabla.
- Formatos:
    - **PDF**: A4 apaisado, bordes en todas las celdas, encabezados en negrita y centrados, se repite la fila de encabezado en cada página. Acciones: imprimir (diálogo de impresión de Android) y compartir.
    - **Excel (.xlsx)**: mismas columnas; fecha como fecha real y cantidad como número para poder operar con ellas. Acción: compartir/guardar.
- Formato de presentación: fecha `dd-mm-aaaa`, cantidad con separador de miles y unidad (`9.340 kg`).

## Copia de seguridad

- Exportar todos los datos a un archivo (JSON) y restaurarlo, compartible a Google Drive u otro destino.
- Valorar además Android Auto Backup para copia automática en la cuenta de Google.
- Decisión final a tomar en la fase de planificación.

## Requisitos de escalabilidad

- Cada módulo vive en su propia carpeta con su esquema, pantallas y definición de tabla.
- La exportación (PDF/Excel) es un motor genérico que recibe una definición de tabla (columnas, formateadores, orientación) y filas. Un módulo nuevo no reescribe la exportación.
- El motor de exportación admite un título opcional por definición de tabla (lo necesita Entrada de vehículos).
- Un módulo solo depende de otro a través de su `index.ts` público y en un único sentido, sin ciclos (alimentos → vehículos, nunca al revés).
- La pantalla de inicio lista los módulos desde un registro central; añadir un módulo es registrarlo.
- Migraciones de base de datos versionadas desde el principio.

## Criterios de aceptación de la v1

- [ ] Registrar una entrada completa en menos de 30 segundos usando favoritos.
- [ ] Registrar dos productos de la misma factura sin volver a escribir fecha, proveedor y factura.
- [ ] Generar el PDF de un rango de fechas e imprimirlo desde el móvil.
- [ ] Generar el Excel del mismo rango con fechas y cantidades operables.
- [ ] Hacer copia de seguridad, borrar la app, reinstalar y restaurar sin pérdida de datos.
- [ ] La app funciona sin conexión.
- [ ] Se cumplen los criterios de aceptación de [Entrada de vehículos](modulos/entrada-vehiculos.md#criterios-de-aceptación).
