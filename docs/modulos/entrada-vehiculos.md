# Módulo: Entrada de vehículos

## Propósito
Registro de bioseguridad de los vehículos que entran en la explotación, según el formulario en papel "Plan de buenas prácticas en medidas de bioseguridad — Control de entrada de vehículos en la explotación".

## Tipos de registro

El módulo tiene dos tipos de registro:

1. **Vehículo habitual**: un vehículo que entra con una frecuencia fija y no se apunta cada vez (p. ej. el turismo del cuidador "A diario" o el veterinario "Semanalmente").
2. **Visita**: una entrada concreta en una fecha concreta.

### Campos del vehículo habitual
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| Matrícula | Texto | Sí | |
| Frecuencia | Texto con sugerencias | Sí | Sugerencias: "A diario", "Semanalmente", "Según guías". Admite texto libre. |
| Motivo de visita | Texto con sugerencias | Sí | |
| Tipo de vehículo | Desplegable | Sí | Ver valores en Reglas. |
| Activo | Sí/No | Sí | Por defecto sí. Los inactivos dejan de exportarse pero no se borran. |

### Campos de la visita
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| Matrícula | Texto | Sí | |
| Fecha | Fecha | Sí | Por defecto, hoy. |
| Motivo de visita | Texto con sugerencias | Sí | |
| Tipo de vehículo | Desplegable | Sí | Ver valores en Reglas. |
| Origen | Referencia interna | No | Solo en visitas creadas automáticamente (ver Integración). |

## Reglas
- **Matrícula**: se guarda en mayúsculas, sin validar formato, porque conviven formatos actuales (`6105 HHR`) y antiguos provinciales (`CO-46336-VE`). Para buscar y comparar se normaliza quitando espacios y guiones.
- **Autocompletado**: al escribir una matrícula ya usada, se rellenan tipo y motivo con los de su último registro (editables).
- **Tipo de vehículo**: desplegable con una lista fija, sin texto libre: "Vehículo particular", "Camión de alimento", "Camión de ganado", "Camión de retirada de cadáveres" y "Otros".
- **Motivo de visita**: sugerencias predefinidas más los motivos ya usados. Predefinidos: "Control y cuidado de animales", "Veterinario", "Transporte de pienso", "Transporte de animales", "Recogida de animales (venta)", "Vehículo particular".
- En papel se usan comillas (") para repetir el motivo de la fila anterior. En la app se guarda siempre el texto completo, y la opción "Guardar y añadir otro" conserva motivo y tipo.

## Favoritos
No crea un catálogo propio de favoritos. Usa como sugerencias las matrículas y motivos de registros anteriores.

Las matrículas de los camiones de pienso se gestionan como **camiones habituales de cada proveedor**, dentro de la pantalla de proveedores favoritos (ver Integración).

## Integración con Entradas de alimentos

Cada descarga de pienso la hace un camión que entra en la explotación, así que una entrada de alimentos genera automáticamente una visita.

### Cambios en el módulo de proveedores y alimentos
- Cada proveedor favorito tiene una lista de **camiones habituales** (matrícula).
- El formulario de entrada de alimentos añade el campo **Matrícula del camión**:
    - Sugiere los camiones habituales del proveedor elegido; si solo hay uno, se preselecciona.
    - Admite texto libre y ofrece guardarlo como camión habitual del proveedor.
    - Es opcional. Si se deja vacío, no se crea la visita y se muestra un aviso.

### Comportamiento
- Al guardar una entrada de alimentos con matrícula, se crea una visita con: fecha = fecha de la entrada, matrícula, motivo "Transporte de pienso", tipo "Camión de alimento".
- **Una sola visita por camión y día.** Si ya existe una visita automática con la misma fecha y matrícula (p. ej. varias entradas de la misma descarga con "Guardar y añadir otro"), las entradas se vinculan a esa visita en lugar de crear otra.
- Si se cambia la fecha o la matrícula de una entrada de alimentos, se reasigna su visita según la regla anterior.
- Al borrar una entrada de alimentos, su visita se borra solo si no le queda ninguna otra entrada vinculada.
- Las visitas automáticas muestran un enlace a sus entradas de alimentos. Fecha y matrícula no se editan desde el módulo de vehículos, sino desde la entrada de alimentos; motivo y tipo sí se pueden editar.
- Las visitas automáticas tampoco se borran desde el módulo de vehículos: desaparecen al borrar o cambiar sus entradas de alimentos.
- Una visita automática nunca se mezcla con una manual del mismo camión y día; las visitas manuales pueden repetirse.
- La creación, reasignación y borrado de la visita ocurren en la misma transacción que el cambio en la entrada de alimentos.
- Las entradas de alimentos registradas antes de este módulo no generan visitas retroactivas.

### Arquitectura de la integración
- El módulo de vehículos expone desde su `index.ts` una API genérica: `linkAutomaticVisit` (busca o crea la visita automática de un origen, fecha y matrícula, dentro de la transacción de quien llama) y `deleteAutomaticVisit`. Quien llama pasa el motivo y el tipo.
- El módulo de alimentos depende del de vehículos, nunca al revés. Es alimentos quien decide cuándo una visita se queda sin entradas y la borra.
- La relación se guarda en la entrada de alimentos (referencia a la visita), sin lógica de alimentos dentro del módulo de vehículos. Las visitas guardan solo su origen (`feed-entries`).
- El enlace de la visita a sus entradas lo monta la ruta de la app (`src/app/vehicle-entries/visits/[id].tsx`), para que el módulo de vehículos no importe nada de alimentos.

## Listado
- Dos secciones: vehículos habituales (activos primero) y visitas, de la más reciente a la más antigua.
- Filtros por rango de fechas, matrícula y tipo de vehículo.
- Indicador visual en las visitas creadas automáticamente.

## Exportación
- Título sobre la tabla, como en el papel: "PLAN DE BUENAS PRÁCTICAS EN MEDIDAS DE BIOSEGURIDAD" y, debajo, "(Control de entrada de vehículos en la explotación)". **El motor genérico debe admitir un título opcional por definición de tabla**; es un cambio en `src/core/export/` que beneficia a todos los módulos.
- Columnas en el orden del papel: `MATRÍCULA | FECHA | MOTIVO DE VISITA | TIPO DE VEHÍCULO`
- Orden de filas:
    1. Todos los vehículos habituales activos, al principio de cada tabla exportada sea cual sea el rango de fechas, por orden de alta y con su frecuencia en la columna FECHA.
    2. Las visitas del rango elegido, por fecha ascendente.
- Formato de fecha `dd/mm/aaaa`, como en esta hoja.
- Orientación: vertical (A4), por confirmar comparando con el papel. El diálogo de impresión de Android propone «Letter» por defecto; hay que elegir A4 al imprimir.
- En Excel, la columna FECHA mezcla texto (frecuencias) y fechas reales (visitas).

## Criterios de aceptación
- [ ] Registrar un vehículo habitual y verlo al principio de cualquier exportación.
- [ ] Desactivar un vehículo habitual y comprobar que deja de exportarse.
- [ ] Registrar una visita manual en menos de 20 segundos usando el autocompletado de matrícula.
- [ ] Registrar dos entradas de alimentos del mismo camión y día y comprobar que generan una sola visita.
- [ ] Cambiar la fecha de una entrada de alimentos y comprobar que su visita se actualiza.
- [ ] Borrar las entradas de alimentos de una visita automática y comprobar que la visita desaparece.
- [ ] Exportar a PDF con el título y la tabla como el formulario en papel, e imprimirlo.
- [ ] Exportar a Excel con las mismas filas.
