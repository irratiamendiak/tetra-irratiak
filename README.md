# TETRA — v6 historial real

Esta versión parte de la aplicación v5 y añade el historial real recuperado desde Access.

## Datos verificados

- Radios: 126
- Movimientos históricos: 742
- `RADIO_ID` no nulo: 742
- `IRRATI_ID` no nulo: 742
- Coincidencias `RADIO_ID = IRRATI_ID`: 742
- IDs de movimiento de Access únicos: 742
- Fechas: 2012-03-10 → 2026-09-16

La relación usada es la que se comprobó en Access:
`IRRATIA.Id = MUGIMENDUAK.IRRATI_ID`.

## Importación en Supabase

1. Ejecuta `supabase/schema.sql` si todavía no lo hiciste.
2. Abre el SQL Editor de Supabase.
3. Ejecuta `supabase/import_access_verified.sql`.
4. Comprueba que `mugimenduak` tiene 742 filas.
5. Publica el contenido de esta carpeta en GitHub Pages.

La importación conserva el `Id` original de Access como `mugimenduak.id`, por lo que el historial puede rastrearse hasta Access.

## Aplicación

- Interfaz en Euskera.
- Lista inicial: ZKA, Alias, Marka, Modeloa, Egoera.
- Detalle del radio con TEI una sola vez.
- Historial real de movimientos.
- Alta y edición de movimientos.
- Eliminación de movimientos.
- Exportación real del historial a `.xlsx`.
- Exportación a PDF mediante la impresión del navegador.
- Botón Historia con vista completa.
