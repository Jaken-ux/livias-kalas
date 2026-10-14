# Decisions Log — Livias Kalas

## 2026-10-14 — Scroll-jank: svh i stället för dvh
`.act` ändrad från `min-height: 100dvh` till `100svh` (src/style.css:70). Förkastat: `dvh` – ändras när Safaris adressfält visas/döljs vid scroll och flyttar allt nedanför. Förkastat: lägga till `ScrollTrigger.config({ ignoreMobileResize: true })` – redan standard för touch i GSAP 3.15. Granskat utan åtgärd: reverse-animationer (alla `once: true`), FOUC (startläge redan i CSS), parallax/SVG-filter (finns inte). Pizzabildens storlek rättad och stjärnorna pausas utanför introt. Commit: "Fix scroll jank".

## 2026-10-14 — Asset filenames stored with colons
Assets were stored as `assets:livia-hero.png` and `assets:livia-pizza.png` (macOS colon artifact). Moved them to `assets/livia-hero.png` and `assets/livia-pizza.png`. Original files are PNG, not JPG as spec assumed — will convert to WebP with JPG fallback during build.

## 2026-10-14 — Font choice: Fredoka
Chose "Fredoka" as display font per spec suggestion. Round, friendly, good for children's party theme.

## 2026-10-14 — No yes.mp3 found
`assets/yes.mp3` does not exist. Using synthesized Web Audio API fanfare as specified in the fallback behavior.
