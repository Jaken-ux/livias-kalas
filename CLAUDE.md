# Livias kalas — arbetsregler

Läsordning för en ny session: README.md → DECISIONS.md (beslutslogg, nyast överst) → Kända fällor nedan.

- En push till `main` deployar direkt till https://jaken-ux.github.io/livias-kalas/ via `.github/workflows/deploy.yml`.
- **Commit och push:** slutar en instruktion med "commita X och pusha" är det Jacobs godkännande, och det gäller även inklistrade instruktioner. Fråga inte igen: committa med det angivna meddelandet och pusha när ändringen är verifierad. Går en verifiering fel (tester, bygge, avvikelse) gäller fortfarande stopp och fråga.
- I `qa/` spåras bara testsviten `qa/verify.spec.ts`. Rapport, skärmdumpar och Lighthouse-data är gitignorerade och finns bara lokalt. Kör sviten med `npx playwright test`.

## Kända fällor

- **Använd `svh`, inte `dvh`/`vh`, för helskärmssektioner.** `dvh` ändras när Safaris adressfält visas vid uppåtscroll, och då hoppar allt innehåll under sektionen. Chromium/Playwright kan inte återskapa detta, så testa på riktig iPhone.
- **`width`/`height` på `<img>` ska ha bildfilens proportioner.** Pizzabilden var märkt 200×200 men filen var 864×1200, och ramen hade bara `max-width`, så 0 px reserverades innan bilden laddats. Kontrollera med `file public/<bild>`.
- **GSAP på SVG: sätt rotations-/skalpunkten en gång med `gsap.set(el, { svgOrigin })`, inte i varje tween.** Står `transformOrigin`/`svgOrigin` bara i to-delen av en `fromTo`, eller avbryts tweens med `overwrite`, lämnar GSAP en kvarvarande translate. Pizzabiten hamnade då ~7 px fel i förhållande till sin mask. Kontrollera att `transform` är `matrix(1,0,0,1,0,0)` efter animationen.
- **Reduced motion ger alla element `transition-duration: 0.2s`** (src/style.css, sektionen REDUCED MOTION). Ändringar som GSAP sätter direkt tonar därför 0,2 s i computed style. Tester ska polla slutvärdet och inte läsa det direkt.
- **Attributet `hidden` döljer inte SVG.** Webbläsarens `[hidden] { display: none }` gäller bara HTML-element. Därför syntes båda ljudikonerna. Använd `toggleAttribute("hidden")` plus en CSS-regel (`.btn-mute svg[hidden]`), och testa vad som syns (computed `display`), inte JS-egenskapen `.hidden`.
- **iOS-ljud: AudioContext måste skapas eller `resume()`:as inom ett tryck.** Ljud som spelas efter ett `await` (fanfaren efter OSA-svaret) räknas inte som ett tryck. `initAudioUnlock()` i src/main.ts låser upp på varje tryck. Skapa aldrig kontexten vid sidladdning.
- **ffmpeg: klipp med `atrim=…,asetpts=PTS-STARTPTS` i filtret, inte `-ss` efter `-i`.** Med `-ss` efter `-i` behåller filtren originalets tidsstämplar, så `afade st=0.07` tystade hela klippet (−91 dB). Gör även om till mono i filterkedjan (`pan=mono|c0=0.5*c0+0.5*c1`) före toppmätningen. Med `-ac 1` vid utskrift mäts stereo men mono skrivs, cirka +3 dB, och då klipper ljudet vid 0 dB. Mät alltid den färdiga filen.
- **Dölj aldrig innehåll med `opacity: 0` i CSS utan `.js`-prefix.** Startläget för inanimering ska skrivas `.js .x { opacity: 0 }`. Klassen sätts i `<head>` och tas bort av nödspärren eller vid ett fel i `init()`. En vanlig `opacity: 0` lämnar elementet osynligt för alltid om JS inte kör. Nya texter från `content.ts` läggs till i `staticText()` så att de fylls i vid bygget.
- **Tester får aldrig nå Formspree på riktigt.** Varje inskick landar i värdens inkorg. Tidigare skickade sviten ett riktigt "TEST – ignorera"-svar vid varje körning. Nu fångar en `context.route` i `beforeEach` i `qa/verify.spec.ts` allt mot `formspree.io` och svarar med ett fejkat `200 {"ok":true}`. Nya tester ska ligga i samma fil eller ha samma mock. Ta aldrig bort den.
