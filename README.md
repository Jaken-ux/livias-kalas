# Livias kalas — inbjudan

Mobilanpassad, ensidig inbjudningssida till Livias 8-årskalas (pyjamas- och filmmyskväll). Byggt med Vite + vanilla TypeScript, GSAP-scrollanimationer och Formspree-formulär. I programdelen kan man trycka på pizzan (tuggor), popcornhinken (popcornregn) och tårtan (blås ut ljusen).

## Köra lokalt

```bash
npm install
npm run dev
```

Öppna `http://localhost:5173/livias-kalas/` i webbläsaren.

## Ändra fakta

All information (datum, tid, adress, program) finns i **`src/content.ts`**. Ändra där, inget annat behöver röras.

## Personlig länk

Lägg till `?g=Namn` i URL:en, så står det "…och Namn är bjuden på" i introt (i stället för "du"), och namnet förifylls i OSA-formulärets fält "Barnets namn" (går att ändra):

```
https://<user>.github.io/livias-kalas/?g=Emma
```

## Deploya till GitHub Pages

1. Initiera repo och pusha:
   ```bash
   git init
   git add -A
   git commit -m "Livias kalas"
   ```
   Skapa ett **publikt** repo vid namn `livias-kalas` på GitHub, koppla remote och pusha `main`.

2. Gå till repot → **Settings → Pages → Source: GitHub Actions**.

3. Vänta på att Actions-jobbet kör klart. Sajten finns på:
   ```
   https://<ditt-användarnamn>.github.io/livias-kalas/
   ```

## Viktigt om integritet

Telefonnumret i `content.party.contact` blir publikt på ett publikt repo och sajt. Sätt fältet till `null` för att dölja det.

## Teknikstack

- **Vite** — build och dev-server
- **TypeScript** — vanilla, inget UI-ramverk
- **GSAP + ScrollTrigger** — scroll- och tryckanimationer
- **canvas-confetti** — konfettiburst vid OSA-ja
- **Web Audio API** — syntetiserat ljud (pop, fanfar, tugg, blås, popcorn)
- **Formspree** — formulärbackend (OSA)
- **Google Fonts (Fredoka)** — display-typsnitt
