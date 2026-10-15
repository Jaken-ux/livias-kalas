# Livias kalas — inbjudan

Mobilanpassad, ensidig inbjudningssida till Livias 8-årskalas (pyjamas- och filmmyskväll). Byggt med Vite + vanilla TypeScript, GSAP-scrollanimationer och Formspree-formulär. Porträttet i introt går att trycka på (tiara → nattmössa → av). I programdelen kan man trycka på pizzan (tuggor), popcornhinken (popcornregn) och tårtan (blås ut ljusen).

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

## Ljud

Originalfilerna ligger i `assets/sound/`. De klipps och normaliseras till `public/sounds/` (max 1 s, fanfaren max 3 s, mono, 96 kbps) med:

```bash
bash scripts/process-sounds.sh   # kräver ffmpeg (brew install ffmpeg)
```

Start och längd per ljud står i skriptet. Kör om skriptet om en originalfil byts ut.

## Viktigt om integritet

Telefonnumret i `content.party.contact` blir publikt på ett publikt repo och sajt. Sätt fältet till `null` för att dölja det.

## Teknikstack

- **Vite** — build och dev-server
- **TypeScript** — vanilla, inget UI-ramverk
- **GSAP + ScrollTrigger** — scroll- och tryckanimationer
- **canvas-confetti** — konfettiburst vid OSA-ja
- **Web Audio API** — ljudeffekter från filer i `public/sounds/`, förladdas vid första trycket
- **Formspree** — formulärbackend (OSA)
- **Google Fonts (Fredoka)** — display-typsnitt
