# Decisions Log — Livias Kalas

## 2026-10-15 — Riktiga ljudeffekter i stället för syntes
Alla syntetiserade ljud är ersatta av filer i `public/sounds/`, framtagna med `scripts/process-sounds.sh` ur `assets/sound/` (mappen heter `sound`, inte `sounds`). Filerna förladdas vid första trycket och spelas via Web Audio. Ett ljud som efterfrågas innan laddningen är klar spelas om det hinner inom 0,5 s. Pop är 200–300 ms ur popcorn.mp3. Förkastat: de första 150 ms enligt ursprunglig instruktion, som är brus (max −28,8 dB). Jacob valde alternativet efter att ha lyssnat. Nattmössan använder sparkle med playbackRate 0.6 eftersom swoosh.mp3 saknas, och ljudet spelas när mössan dalar ner (tryck 2), inte när den flyger iväg. Topparna är normaliserade till −1 dBFS och huvudvolymen är 0,6. Commit: "Real sound effects".

## 2026-10-15 — Ljudknapp och ljudstart på iOS
Ljudknappen visar en ikon i taget och växlar etikett mellan "Stäng av ljud" och "Sätt på ljud". Förkastat: att också sätta `aria-pressed`, som tillsammans med en växlande etikett läses motsägelsefullt ("Sätt på ljud, nedtryckt"). AudioContext låses upp på varje tryck (touchend/pointerup/click/keydown) och `resume()` anropas när den inte är `running`. Förkastat: att bara låsa upp på första trycket, eftersom iOS pausar kontexten vid appbyte. Ljudet är på som standard (oförändrat). Commit: "Fix mute toggle and audio init".

## 2026-10-15 — Hero-tryck: tiara och nattmössa
Porträttet är en knapp (`#btn-hero`) som växlar mellan tre tillstånd: ingenting, tiara och nattmössa. Accessoarerna ligger i ett eget lager (`.hero-accessories`) bredvid `.hero-frame`, som har `overflow: hidden` och annars skulle klippa dem. Placeringen anges i % av ramen och är kalibrerad visuellt mot skärmdumpar vid 320/390/430 px. Hjässan sitter på ~17 % av ramen, inte på de ~11 % som räknats fram ur bildens beskärning. Ramen har fast storlek, så placeringen beror inte på skärmbredden. Förkastat: lägga accessoarerna inuti ramen (klipps). Ljud bara vid tiaran, enligt uppdraget. Commit: "Add hero tap: tiara and nightcap".

## 2026-10-15 — Tryckinteraktioner i Vad händer (pizza, tårta, popcorn)
Pizzans tuggor görs med en SVG-mask (`#bite-mask`) och inte en overlay i bakgrundsfärg, så de fungerar mot alla bakgrunder. Popcornets tryckyta är hela illustrationen med kuddar och hink, men bara hinken skakar. Förkastat: bara hinken, ~40×55 px, för liten för ett barn. Vid reduced motion visas bara slutlägen, men ljudet är kvar och styrs av ljudknappen. Popcornen visas då still och tonas ut efter 1,5 s. Förkastat: inget ljud alls, och inga popcorn alls. Bundle +~7 kB okomprimerat (+2,5 kB gzip). Ingen jank vid regn och scroll med CPU 4x: 0 frames >33 ms, 0 layout shifts. Commit: "Add tap interactions: pizza, cake, popcorn".

## 2026-10-15 — Skyltens fokusring: drop-shadow på plattan
iOS ritade en fyrkantig outline runt skylt-SVG:n (`role="button"`), och den lämnade spökkopior vid animation. Nu finns ingen outline och ingen tryckmarkering i komponenten. Fokusstil finns bara på `:focus-visible`, som en lila glöd på `#sign-plate`. Förkastat: `box-shadow`, som inte fungerar på SVG-element. `filter: drop-shadow` följer plattans rundade hörn. Plattan vaggar ±2° var 4:e sekund tills första trycket, bara när sektionen syns och inte vid reduced motion. Commit: "Fix signpost focus ring".

## 2026-10-14 — Tilltal till förälder och barn
Sidan läses ofta högt av en förälder. Med `?g=Namn` ersätter namnet "du" i introts "…och du är bjuden på" (`#invitee`), och namnet förifylls i OSA-fältet "Barnets namn". Formulär- och eftertext använder "ni" (Kommer ni?, Ja, vi kommer!, Ni har svarat…). Förkastat: en egen rad "Namn är bjuden på Livias kalas!" i stället för "Hej Namn!", eftersom den upprepar undertexten. Oförändrat: sidtiteln/förhandsvisningen ("du är bjuden!") och "Kom i pyjamas!". Commit: "Address parent and child".

## 2026-10-14 — "Akt 1/2/3"-etiketterna borttagna
Etiketterna var strukturnamn och inte innehåll, så `<h2 class="act-label">` och dess CSS är borttagna. "Kvällens program" har flyttats från `h3` till `h2`. Förkastat: behålla `h3`, eftersom rubrikordningen då hoppar från h1 till h3. Utseendet är oförändrat eftersom stilen sätts via `.act-title`. Ingen avståndsjustering behövdes: programrubriken ligger 64 px från sektionstoppen, samma som OSA, och Akt 1/2 är vertikalt centrerade. Commit: "Remove act labels".

## 2026-10-14 — Formspree mockas i tester; testsviten spåras i git
`qa/verify.spec.ts` fångar alla anrop till formspree.io med `context.route` och svarar med fejkat 200 `{"ok":true}`, eftersom sviten tidigare skickade riktiga OSA-svar. `.gitignore` ändrad från `qa/` till `qa/*` + `!qa/verify.spec.ts`. Förkastat: behålla hela `qa/` lokalt – då skulle skyddet bara finnas på en dator. Övrigt i `qa/` (rapport, skärmdumpar) ignoreras fortfarande. Commit: "Mock Formspree in tests".

## 2026-10-14 — Scroll-jank: svh i stället för dvh
`.act` ändrad från `min-height: 100dvh` till `100svh` (src/style.css:70). Förkastat: `dvh` – ändras när Safaris adressfält visas/döljs vid scroll och flyttar allt nedanför. Förkastat: lägga till `ScrollTrigger.config({ ignoreMobileResize: true })` – redan standard för touch i GSAP 3.15. Granskat utan åtgärd: reverse-animationer (alla `once: true`), FOUC (startläge redan i CSS), parallax/SVG-filter (finns inte). Pizzabildens storlek rättad och stjärnorna pausas utanför introt. Commit: "Fix scroll jank".

## 2026-10-14 — Asset filenames stored with colons
Assets were stored as `assets:livia-hero.png` and `assets:livia-pizza.png` (macOS colon artifact). Moved them to `assets/livia-hero.png` and `assets/livia-pizza.png`. Original files are PNG, not JPG as spec assumed — will convert to WebP with JPG fallback during build.

## 2026-10-14 — Font choice: Fredoka
Chose "Fredoka" as display font per spec suggestion. Round, friendly, good for children's party theme.

## 2026-10-14 — No yes.mp3 found
`assets/yes.mp3` does not exist. Using synthesized Web Audio API fanfare as specified in the fallback behavior.
