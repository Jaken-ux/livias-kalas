# Livias kalas — arbetsregler

Läsordning för en ny session: README.md → DECISIONS.md (beslutslogg, nyast överst) → Kända fällor nedan.

- En push till `main` deployar direkt till https://jaken-ux.github.io/livias-kalas/ via `.github/workflows/deploy.yml`.
- `qa/` (tester, rapport, skärmdumpar) är gitignorerad och finns bara lokalt.

## Kända fällor

- **Använd `svh`, inte `dvh`/`vh`, för helskärmssektioner.** `dvh` ändras när Safaris adressfält visas vid uppåtscroll, och då hoppar allt innehåll under sektionen. Chromium/Playwright kan inte återskapa detta, så testa på riktig iPhone.
- **`width`/`height` på `<img>` ska ha bildfilens proportioner.** Pizzabilden var märkt 200×200 men filen var 864×1200, och ramen hade bara `max-width`, så 0 px reserverades innan bilden laddats. Kontrollera med `file public/<bild>`.
- **`qa/verify.spec.ts` skickar ett riktigt OSA-svar till Formspree** ("TEST – ignorera") vid varje körning, och det landar i värdens inkorg. Kör `npx playwright test --grep-invert Formspree` om du inte uttryckligen vill testa formuläret mot riktig backend.
