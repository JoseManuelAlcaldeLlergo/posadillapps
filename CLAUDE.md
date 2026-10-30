# App de gestión de explotación ganadera

App Android modular para registros de una explotación ganadera. Requisitos en @docs/PRD.md.

## Stack
- Expo (React Native) + TypeScript estricto, Expo Router
- SQLite local (expo-sqlite) con ORM tipado y migraciones versionadas
- PDF e impresión: expo-print (HTML → PDF); compartir: expo-sharing
- Excel: librería .xlsx en JS (elegir en la fase de plan)
- Solo Android: no añadir configuración ni código específico de iOS

## Comandos
<!-- Completar tras crear el proyecto -->
- Node 24 (ver `.nvmrc`): con Node 22.9 los tests que usan `better-sqlite3` fallan con un error de segmentación
- Arrancar: npx expo start
- Tests: npm test
- Lint y tipos: npm run lint && npx tsc --noEmit

## Arquitectura
- `src/modules/<modulo>/`: un módulo por tipo de registro (esquema, repositorio, pantallas, `tableDefinition.ts`)
- `src/core/export/`: motor genérico PDF/Excel que recibe una definición de tabla + filas
- `src/core/db/`: conexión y migraciones
- `src/modules/registry.ts`: registro central de módulos para la pantalla de inicio
- `src/modules/<modulo>/index.ts`: API pública del módulo. Un módulo solo importa de otro a través de su `index.ts`, nunca de sus archivos internos
- Las dependencias entre módulos van en un único sentido y sin ciclos (p. ej. `feed-entries` → `vehicle-entries`, nunca al revés). El módulo del que se depende no contiene lógica del módulo que lo usa
- Especificaciones de cada módulo en `docs/modulos/`
- Para crear un módulo nuevo, usar la skill `nuevo-modulo-tabla`

## Convenciones
- Código e identificadores en inglés; textos de la interfaz en español
- Las entradas guardan snapshot de texto (proveedor, pienso) además de la referencia al favorito
- Fechas en BD como ISO `YYYY-MM-DD`; mostrar por defecto como `dd-mm-aaaa`. La definición de tabla de un módulo puede fijar otro formato para su exportación (p. ej. `dd/mm/aaaa` en vehículos, como su hoja en papel)
- Cantidades como número + unidad; nunca como texto
- Toda lógica de formato y exportación con tests unitarios

## No hacer
- No modificar migraciones ya existentes: crear una nueva
- No meter lógica de un módulo concreto en `src/core/`
- No importar archivos internos de otro módulo ni crear dependencias circulares entre módulos
- No añadir dependencias sin indicarlo en el plan
- No usar servicios de red obligatorios: la app debe funcionar sin conexión
