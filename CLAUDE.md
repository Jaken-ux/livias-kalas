# Livias kalas — arbetsregler

Läsordning för en ny session: README.md → DECISIONS.md (beslutslogg, nyast överst) → Kända fällor nedan.

- En push till `main` deployar direkt till https://jaken-ux.github.io/livias-kalas/ via `.github/workflows/deploy.yml`.
- I `qa/` spåras bara testsviten `qa/verify.spec.ts`. Rapport, skärmdumpar och Lighthouse-data är gitignorerade och finns bara lokalt. Kör sviten med `npx playwright test`.

## Kända fällor

- **Använd `svh`, inte `dvh`/`vh`, för helskärmssektioner.** `dvh` ändras när Safaris adressfält visas vid uppåtscroll, och då hoppar allt innehåll under sektionen. Chromium/Playwright kan inte återskapa detta, så testa på riktig iPhone.
- **`width`/`height` på `<img>` ska ha bildfilens proportioner.** Pizzabilden var märkt 200×200 men filen var 864×1200, och ramen hade bara `max-width`, så 0 px reserverades innan bilden laddats. Kontrollera med `file public/<bild>`.
- **Tester får aldrig nå Formspree på riktigt.** Varje inskick landar i värdens inkorg. Tidigare skickade sviten ett riktigt "TEST – ignorera"-svar vid varje körning. Nu fångar en `context.route` i `beforeEach` i `qa/verify.spec.ts` allt mot `formspree.io` och svarar med ett fejkat `200 {"ok":true}`. Nya tester ska ligga i samma fil eller ha samma mock. Ta aldrig bort den.
