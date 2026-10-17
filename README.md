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

Vid bygget fyller `vite.config.ts` (insticket `prerender-content`) i de fasta texterna och kartlänkarna direkt i HTML:en från `staticText()`/`staticHref()` i `content.ts`. Sidan går då att läsa även om JavaScript inte körs. Bygget avbryts om ett element som en text ska in i saknas i `index.html`.

## Utan JavaScript och felsökning

- **Utan JS** syns porträtt, all text och adressen. Animationerna och tryckinteraktionerna kräver JS, liksom nedräkningen och namnet från `?g`.
- **Inanimering:** ett litet skript i `<head>` sätter klassen `js` på `<html>`, och bara då döljer CSS de element som tonas in. Blir huvudskriptet inte klart inom 4 s, eller fallerar ett steg i `init()`, tas klassen bort och allt visas utan animation.
- **Felrapport:** lägg till `?debug=1` i URL:en. Efter cirka 4,5 s visas en ruta längst ner med webbläsarens user agent, porträttets status, om det finns ett sparat OSA-svar och alla JS-fel.

## Personlig länk

Lägg till `?g=Namn` i URL:en, så står det "…och Namn är bjuden på" i introt (i stället för "du"), och namnet förifylls i OSA-formulärets fält "Barnets namn" (går att ändra):

```
https://<user>.github.io/livias-kalas/?g=Emma
```

## Sparat OSA-svar

Svaret sparas bara i webbläsarens `localStorage`, **per gäst**: nyckeln är `livias-kalas-rsvp:<namn från ?g, gemener>` eller `livias-kalas-rsvp:default` utan `?g`. Om två gäster öppnar sina länkar på samma telefon ser därför var och en bara sitt eget svar. Svaret följer inte med till andra enheter eller webbläsare. Den gamla nyckeln utan gäst (`livias-kalas-rsvp`) läses inte längre. Lägg till `?reset=1` för att rensa alla sparade svar i den aktuella webbläsaren. Sidan laddas då om utan parametern. `?debug=1` visar vilken nyckel som lästes:

```
https://<user>.github.io/livias-kalas/?reset=1
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

Originalfilerna ligger lokalt i `assets/sound/`. Mappen är gitignorerad och finns inte i repot, bara de bearbetade filerna gör det. Originalen klipps och normaliseras till `public/sounds/` (max 1 s, fanfaren max 3 s, mono, 96 kbps) med:

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
