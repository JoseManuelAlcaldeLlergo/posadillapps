# PRD — App de gestión de explotación ganadera

## Visión

App Android para gestionar los registros de una explotación ganadera desde el móvil. Se construye por módulos: cada módulo es un tipo de registro (una tabla) con su formulario, su listado y su exportación. La v1 incluye un único módulo: **Entradas de alimentos**.

## Alcance de la v1

- Plataforma: solo Android.
- Una sola explotación (sin multi-explotación ni multiusuario).
- Datos guardados en el móvil; funciona sin conexión.
- Copia de seguridad en la nube.
- Exportación a PDF (con impresión) y a Excel.

Fuera de alcance en v1: iOS, varias explotaciones, usuarios y permisos, sincronización en tiempo real entre dispositivos, otros módulos de tablas.

## Módulo 1: Entradas de alimentos

### Campos de cada entrada

| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| Fecha | Fecha | Sí | Por defecto, hoy. En el papel suele ser fin de mes. |
| Cantidad | Número decimal + unidad | Sí | Unidad por defecto `kg`. |
| Proveedor | Texto | Sí | Seleccionable de favoritos o texto libre. |
| Denominación comercial del pienso | Texto | Sí | Sugerencias según el proveedor elegido. |
| Factura/Albarán | Texto | No | Formatos variados: `F2000 525`, `SU 79`. Texto libre. |

Reglas:

- **Una entrada por producto.** Si una factura incluye varios piensos, se crean varias entradas que comparten número de factura. Para agilizarlo, el formulario ofrece "Guardar y añadir otro de la misma factura", que conserva fecha, proveedor y factura.
- La entrada guarda el **texto** del proveedor y del pienso tal como se usó (snapshot), además de la referencia opcional al favorito. Renombrar o borrar un favorito no altera registros históricos.

### Proveedores y piensos favoritos

- Pantalla independiente para gestionar proveedores favoritos (crear, editar, borrar).
- Cada proveedor tiene su lista de piensos habituales.
- En el formulario de entrada:
    1. Al elegir proveedor se muestran sus piensos habituales como sugerencias.
    2. Si se escribe un proveedor o pienso nuevo, se ofrece guardarlo como favorito.

Ejemplos reales: proveedor "Mezclas del Valle" con piensos "Cerdos crecimiento", "Cerdos preamontanera", "Alfalfa en rama"; proveedor "Sierra de los Santos SCA" con "Pienso Cordero Eco S/P".

### Listado

- Entradas ordenadas por fecha, la más reciente primero.
- Filtro por rango de fechas y por proveedor.
- Editar y borrar (con confirmación).

### Exportación

- El usuario elige un **rango de fechas libre** (con atajos: año actual, año anterior, mes actual).
- Tabla con estas columnas y este orden, como el formulario en papel:
  `FECHA | CANTIDAD | PROVEEDOR | DENOMINACIÓN COMERCIAL DEL PIENSO | FACTURA/ALBARÁN`
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
- La pantalla de inicio lista los módulos desde un registro central; añadir un módulo es registrarlo.
- Migraciones de base de datos versionadas desde el principio.

## Criterios de aceptación de la v1

- [ ] Registrar una entrada completa en menos de 30 segundos usando favoritos.
- [ ] Registrar dos productos de la misma factura sin volver a escribir fecha, proveedor y factura.
- [ ] Generar el PDF de un rango de fechas e imprimirlo desde el móvil.
- [ ] Generar el Excel del mismo rango con fechas y cantidades operables.
- [ ] Hacer copia de seguridad, borrar la app, reinstalar y restaurar sin pérdida de datos.
- [ ] La app funciona sin conexión.
