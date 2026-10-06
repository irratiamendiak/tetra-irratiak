# TETRA IRRATIAK — berreskuratze egonkorra

Bertsio hau **v6.5 egonkorraren** gainean prestatuta dago. Ez du Supabase eskemarik edo daturik aldatzen.

## Sartzen dena
- Euskera interfazea.
- TETRA IRRATIAK goiburua eta diseinu urdin garbia.
- Irrati zerrenda eta errenkadan klik eginda xehetasunak.
- Irratiaren alta/edizioa.
- Mugimenduen alta/edizioa/ezabapena.
- Historia leihoa eta itxiera zuzena.
- **Arreta Zb.** eta **RMA** irratiaren xehetasunetan, mugimenduetan, Excel-en eta PDF-an.
- `0` balioak bere horretan mantentzen dira.
- Tokiko `data/talkie.png` irudia erabiltzen da; ez dago kanpoko irudi-zerbitzariaren menpe.

## GitHub Pages-era igotzea
1. Ireki zure benetako repository-a: `irratimendiak/tetra-irratiaK`.
2. Ezabatu aurreko bertsioaren web-fitxategiak (ez ukitu Supabase).
3. ZIP honetako **fitxategi eta karpeta guztiak** igo repository-aren erroan.
4. Commit egin.
5. Itxaron GitHub Pages eguneratu arte eta ireki:
   `https://irratimendiak.github.io/tetra-irratiaK/`

## Egiaztapena
- `app.js`-k Node sintaxi-egiaztapena gainditzen du.
- Supabase URL eta publishable key-a proiektukoak dira; ez dago service_role/secret key-rik.
