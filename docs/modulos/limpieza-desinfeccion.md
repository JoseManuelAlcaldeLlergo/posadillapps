# Módulo: Limpieza, desinfección, desinsectación y desratización

## Propósito
Registro de las aplicaciones de productos de limpieza, desinfección, desinsectación y desratización en la explotación, según el formulario en papel "Plan de limpieza - desinfección - desinsectación y desratización". El responsable firma a mano sobre la tabla impresa.

## Tipos de registro
Como en el módulo de vehículos, hay dos tipos:

1. **Aplicación habitual**: se realiza con una frecuencia fija y no se apunta cada vez (p. ej. agua en bebederos "A diario").
2. **Aplicación**: una aplicación concreta en una fecha concreta.

## Campos
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| Código de explotación | Texto | Sí | Automático desde Ajustes de la explotación. Snapshot. |
| Unidad productiva | Texto con sugerencias | Sí | Desde Ajustes. Por defecto, la última usada. |
| Fecha | Fecha (aplicación) o texto de frecuencia (habitual) | Sí | Frecuencia con sugerencias: "A diario", "Semanalmente", "Mensualmente". |
| Producto empleado | Texto con sugerencias | Sí | Desde los productos favoritos. Ej.: "Cal en polvo", "Agua", "Cipergen". |
| Lugar de aplicación | Texto con sugerencias | Sí | Ej.: "Naves, suelo y paredes", "Bebederos". |
| Periodo de espera | Entero (días) | Sí | Se muestra como "0 días", "15 días". |
| Fecha de revisión | Fecha | No | Si está vacía, se exporta "—", como en el papel. |
| Activa | Sí/No | Solo habituales | Las inactivas dejan de exportarse pero no se borran. |

La **firma del responsable** no se guarda: es una columna vacía en la exportación.

## Productos favoritos
Pantalla propia del módulo para gestionar productos:

| Campo | Notas |
| --- | --- |
| Nombre | Ej.: "Cal en polvo". |
| Periodo de espera por defecto | En días. Ej.: 0 para cal, 15 para otros productos. |
| Lugar de aplicación por defecto | Opcional. |

Al elegir un producto en el formulario, se rellenan su periodo de espera y lugar por defecto (editables). Si se escribe un producto nuevo, se ofrece guardarlo como favorito con los valores introducidos.

## Reglas
- **Repetir aplicación**: en el listado, cada aplicación tiene la acción "Repetir", que abre el formulario con los mismos valores y la fecha de hoy. Sustituye a las comillas (") del papel, donde muchas filas repiten producto, lugar y periodo.
- Cambiar los valores por defecto de un producto no altera registros ya guardados.
- Reutilizar la pantalla de Ajustes de la explotación y el patrón de registros habituales del módulo de vehículos. Si ese patrón se puede extraer a `src/core/` sin romper vehículos, proponerlo en el plan; si no, implementarlo dentro de este módulo.

## Listado
- Dos secciones: aplicaciones habituales (activas primero) y aplicaciones, de la más reciente a la más antigua.
- Filtros por rango de fechas y por producto.
- Editar, borrar (con confirmación) y "Repetir".

## Exportación
- Título sobre la tabla: "PLAN DE LIMPIEZA - DESINFECCIÓN - DESINSECTACIÓN Y DESRATIZACIÓN".
- Columnas en el orden del papel: `CÓDIGO EXPLOTACIÓN | UNIDAD PRODUCTIVA | FECHA | PRODUCTO EMPLEADO | LUGAR DE APLICACIÓN | PERIODO DE ESPERA | FIRMA DEL RESPONSABLE | FECHA DE REVISIÓN`
- Periodo por **rango de fechas**.
- Orden de filas:
    1. Todas las aplicaciones habituales activas, al principio de cada tabla, con su frecuencia en la columna FECHA.
    2. Las aplicaciones del rango, por fecha ascendente.
- Formato de fecha `dd/mm/aaaa`.
- FIRMA DEL RESPONSABLE vacía, con espacio suficiente para firmar.
- Orientación: A4 apaisado.
- En Excel, la columna FECHA mezcla texto (frecuencias) y fechas reales; la de firma se incluye vacía.

## Criterios de aceptación
- [ ] Crear productos favoritos con periodo de espera y lugar por defecto.
- [ ] Registrar una aplicación en menos de 20 segundos eligiendo un producto favorito.
- [ ] Usar "Repetir" para registrar la misma aplicación en otra fecha.
- [ ] Registrar una aplicación habitual ("A diario") y verla al principio de cualquier exportación.
- [ ] Dejar la fecha de revisión vacía y ver "—" en el PDF.
- [ ] Exportar a PDF con título y columna de firma vacía, e imprimirlo.
- [ ] Exportar a Excel el mismo rango.
- [ ] Los demás módulos siguen funcionando y exportando igual.
