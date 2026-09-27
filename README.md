# Departementenspel

Het Franse departementenspel als webapp. Lees onderweg de kentekens van Franse auto's, toets het departementnummer in en probeer ze allemaal te vinden. Of speel bingo met het hele gezelschap.

Een statische browserapp zonder build-stap of backend. Hij werkt offline (service worker) en je kunt hem op je telefoon installeren via "Zet op beginscherm".

## Spelvormen

- **Alle departementen vinden.** Elke reis begint opnieuw. Een reis begint als je Frankrijk in rijdt (knop *Start reis*) en stopt als je Frankrijk uit rijdt. Alle 101 departementen staan in een grote tabel in rijen van tien: 01–10, 11–19 + 2A/2B (20 bestaat niet meer), 21–30, … 91–95, en overzee (971–976). Bijzondere vondsten, zoals een oude 20, overzeese gebieden en rode TT-platen, tellen als bonus.
- **Kaart.** Gevonden departementen kleuren groen op de kaart. Tik op een departement voor de naam, prefectuur, regio en een weetje. Parijs en omgeving hebben een uitvergroting, overzee heeft eigen kaartjes.
- **Bingo.** Elke speler maakt een eigen kaart van 12, 16 of 20 departementen (alleen vasteland en Corsica). Wordt er een nummer geroepen, dan mag iedereen die het op de kaart heeft het afstrepen, door op het vakje te tikken of het nummer in te vullen. Een volle rij, kolom of diagonaal is bingo. Elke kaart heeft een code: dezelfde code en grootte geven altijd dezelfde kaart.
  Elke kaart bevat een vaste mix van vaak, gemiddeld en zelden geziene departementen (16 vakjes: 7 / 6 / 3), zodat één zeldzaam nummer het spel niet eindeloos rekt. De indeling is een schatting op basis van het inwonertal, zie `VAAK` en `ZELDEN` in `game.js`.
- **Statistiek.** Cijfers over de huidige of laatste reis (aantal, duur, vondsten per uur) en over alle reizen samen: record, gemiddelde, vaakst gevonden, voortgang per regio en welke departementen je nog nooit hebt gezien. Hier kun je ook oude reizen verwijderen.
- **Kentekens.** Uitleg over de verschillende Franse kentekentypen: SIV, het oude FNI, zwart, rood (TT), groen (diplomaten), W garage en WW.

## Bestanden

- `data.js`: departementen (code, naam, prefectuur, regio, toelichting) en bonusvondsten.
- `game.js`: pure spellogica (invoer herkennen, tabelindeling, bingokaarten, bingocontrole), getest in `tests/`.
- `app.js`: de interface. `kentekens.js`: de inhoud van het kentekentabblad.
- `departements.geojson`: vereenvoudigde grenzen, afgeleid van [france-geojson](https://github.com/gregoiredavid/france-geojson) (Grégoire David, open licentie).
- `sw.js`: offline-cache. Verhoog `CACHE` bij elke wijziging, anders zien spelers de oude versie.

Voortgang wordt alleen op het eigen apparaat bewaard (localStorage).

## Draaien en testen

```sh
npm start      # of: python3 -m http.server 8000
npm test       # node --test, geen dependencies
```

Hosten kan op GitHub Pages: Settings → Pages → Deploy from branch → `main`, map `/ (root)`.
