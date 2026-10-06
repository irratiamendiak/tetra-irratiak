# TETRA Web — GitHub Pages + Supabase

Proyecto estático para gestionar radios TETRA y sus movimientos.

## Datos preparados

- 126 radios desde `IRRATIAK.xlsx`.
- 742 movimientos desde `MUGIMENDUAK.xlsx`.
- 157 movimientos se han vinculado automáticamente a una radio por coincidencia exacta de ALIAS/NORK.
- 585 movimientos quedan sin vincular para revisión posterior.

## 1. Supabase

Ejecuta `supabase/schema.sql` en SQL Editor.

Después importa:
- `data/irratia.csv` en `public.irratia`
- `data/mugimenduak.csv` en `public.mugimenduak`

## 2. Usuario

En Supabase > Authentication > Users crea el usuario que utilizará la aplicación.

## 3. GitHub Pages

Sube `index.html`, `app.js` y `styles.css` a un repositorio y activa Pages desde Settings > Pages, usando GitHub Actions o la rama principal.

## Importante sobre movimientos

El Excel de movimientos procede de una consulta de Access y no contiene el identificador interno `IRRATI_ID`. Para no inventar relaciones, solo se vinculan automáticamente los casos donde `NORK` coincide exactamente con un `ALIAS` actual. Los demás conservan su texto original y `radio_id` queda vacío. Esto se puede revisar posteriormente en Supabase.
