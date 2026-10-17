import { test, expect, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QA_DIR = path.resolve(__dirname);
const widths = [320, 375, 390, 430] as const;

// Inga riktiga anrop till Formspree från tester – allt mot formspree.io
// fångas på context-nivå och besvaras med ett fejkat 200 {"ok":true}.
let formspreeCalls = 0;
test.beforeEach(async ({ context }) => {
  formspreeCalls = 0;
  await context.route(/formspree\.io/, (route) => {
    formspreeCalls++;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
});

test.describe("Definition of Done", () => {
  test("no horizontal overflow at mobile widths", async ({ page }) => {
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 812 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      );
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(
        scrollWidth,
        `Horizontal overflow at ${w}px: scrollWidth=${scrollWidth} > innerWidth=${innerWidth}`
      ).toBeLessThanOrEqual(innerWidth);
    }
  });

  test("no console errors during full scroll at 390px", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to bottom slowly
    await page.evaluate(async () => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const step = window.innerHeight / 2;
      const maxScroll = document.documentElement.scrollHeight;
      for (let pos = 0; pos < maxScroll; pos += step) {
        window.scrollTo(0, pos);
        await delay(100);
      }
      window.scrollTo(0, maxScroll);
      await delay(200);
    });

    expect(errors, `Console errors: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("all act elements visible after scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for intro animations
    await page.waitForTimeout(2000);

    // Scroll through all acts
    const sections = ["#act-when", "#act-where", "#act-program", "#act-rsvp", "#act-outro"];
    for (const sel of sections) {
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
    }

    // Check elements are visible
    const checks = [
      { sel: ".title-main", name: "title" },
      { sel: ".ticket", name: "ticket" },
      { sel: ".signpost-wrapper", name: "signpost" },
      { sel: "#beat-pizza", name: "pizza beat" },
      { sel: "#beat-movie", name: "movie beat" },
      { sel: "#beat-cake", name: "cake beat" },
      { sel: "#rsvp-form", name: "form" },
      { sel: ".credits", name: "outro" },
    ];

    for (const { sel, name } of checks) {
      const opacity = await page.locator(sel).evaluate((el) =>
        parseFloat(getComputedStyle(el).opacity)
      );
      expect(opacity, `${name} (${sel}) opacity`).toBeGreaterThanOrEqual(0.95);
    }
  });

  test("countdown shows correct days", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const countdownText = await page.locator("#countdown").textContent();
    const partyDate = new Date("2026-11-13T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (partyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff > 0) {
      expect(countdownText).toContain(`${diff}`);
    } else if (diff === 0) {
      expect(countdownText).toContain("idag");
    } else {
      expect(countdownText).toContain("har varit");
    }
  });

  test("signpost reveals address and map links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#act-where").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Click signpost
    await page.locator("#signpost-wrapper").click();
    await page.waitForTimeout(600);

    // Address card should be visible
    const card = page.locator("#address-card");
    await expect(card).toHaveClass(/open/);

    // Check map links
    const googleHref = await page.locator("#btn-google-maps").getAttribute("href");
    const appleHref = await page.locator("#btn-apple-maps").getAttribute("href");
    const q = encodeURIComponent("Kardemummagränd 20, 135 36 Tyresö");
    expect(googleHref).toContain(q);
    expect(appleHref).toContain(q);
  });

  test("?g=Emma: 'Emma är bjuden på' and name prefilled in OSA", async ({ page }) => {
    await page.goto("/?g=Emma");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".subtitle")).toContainText("och Emma är bjuden på");
    await expect(page.locator(".title")).not.toContainText("Hej");
    await expect(page.locator("#field-name")).toHaveValue("Emma");
    // Förifyllt namn ska gå att ändra
    await page.locator("#field-name").fill("Emma S");
    await expect(page.locator("#field-name")).toHaveValue("Emma S");
  });

  test("without ?g: 'du är bjuden på' and empty name field", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".subtitle")).toContainText("och du är bjuden på");
    await expect(page.locator("#field-name")).toHaveValue("");
  });

  test("greeting with ?g=<script> renders as text", async ({ page }) => {
    await page.goto("/?g=<script>alert(1)</script>");
    await page.waitForLoadState("networkidle");
    // Should not contain HTML tags
    const html = await page.locator("#invitee").innerHTML();
    expect(html).not.toContain("<");
    expect(await page.locator("#field-name").inputValue()).not.toContain("<");
  });

  test("form validation: empty name shows error", async ({ page }) => {
    await page.goto("/");
    await page.locator("#act-rsvp").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click submit without filling anything
    await page.locator("#btn-submit").click();
    await page.waitForTimeout(200);

    const errorName = await page.locator("#error-name").textContent();
    expect(errorName).toBeTruthy();

    // Verify no POST was made (we can't easily, but check form is still visible)
    await expect(page.locator("#rsvp-form")).toBeVisible();
  });

  test("Formspree test submission", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#act-rsvp").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Fill the form
    await page.locator("#field-name").fill("TEST – ignorera");
    await page.locator("#btn-yes").click();
    await page.waitForTimeout(200);

    // Intercept the fetch to record response
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("formspree.io") && r.request().method() === "POST"
    );

    await page.locator("#btn-submit").click();

    const response = await responsePromise;
    const status = response.status();

    // Save response info
    const responseBody = await response.text().catch(() => "Could not read body");
    fs.writeFileSync(
      path.join(QA_DIR, "formspree-response.json"),
      JSON.stringify({ status, body: responseBody }, null, 2)
    );

    expect(status).toBe(200);
    expect(formspreeCalls, "POST ska ha fångats av mocken").toBe(1);

    // Check success state
    await page.waitForTimeout(1000);
    const statusEl = page.locator("#form-status");
    await expect(statusEl).toContainText("Hurra");
  });

  test("localStorage persistence after submission", async ({ page }) => {
    // First set up localStorage as if submitted
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      localStorage.setItem(
        "livias-kalas-rsvp",
        JSON.stringify({
          name: "TestBarn",
          attending: "ja",
          diet: "Nötallergi",
          phone: "",
          message: "",
        })
      );
    });

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator("#act-rsvp").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Summary should show
    const summary = page.locator("#rsvp-summary");
    await expect(summary).toBeVisible();
    const summaryText = await page.locator("#summary-text").textContent();
    expect(summaryText).toContain("TestBarn");

    // Click change
    await page.locator("#btn-change").click();
    await page.waitForTimeout(300);

    // Form should be visible and prefilled
    const form = page.locator("#rsvp-form");
    await expect(form).toBeVisible();
    const nameValue = await page.locator("#field-name").inputValue();
    expect(nameValue).toBe("TestBarn");
  });

  test("mute toggle: one visible icon, label toggles, persists", async ({ page }) => {
    // Faktiskt synliga ikoner (computed display), inte .hidden-egenskapen –
    // SVG följer inte webbläsarens [hidden]-regel.
    const shown = () =>
      page.$$eval("#btn-mute svg", (s) =>
        s.filter((x) => getComputedStyle(x).display !== "none").map((x) => x.id)
      );
    const btn = page.locator("#btn-mute");

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#act-outro").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Standard: ljud PÅ
    expect(await shown()).toEqual(["icon-sound-on"]);
    await expect(btn).toHaveAttribute("aria-label", "Stäng av ljud");

    await btn.click();
    expect(await shown()).toEqual(["icon-sound-off"]);
    await expect(btn).toHaveAttribute("aria-label", "Sätt på ljud");
    expect(await page.evaluate(() => localStorage.getItem("livias-kalas-mute"))).toBe("true");

    // Efter omladdning: fortfarande av
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(await shown()).toEqual(["icon-sound-off"]);
    await expect(btn).toHaveAttribute("aria-label", "Sätt på ljud");

    // Och på igen
    await page.locator("#act-outro").scrollIntoViewIfNeeded();
    await btn.click();
    expect(await shown()).toEqual(["icon-sound-on"]);
    await expect(btn).toHaveAttribute("aria-label", "Stäng av ljud");
  });

  test("audio: no AudioContext at load, running after first tap, resumed after suspend", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    // Registrera alla AudioContext som sidan skapar
    await page.addInitScript(() => {
      const Orig = window.AudioContext;
      (window as any).__ctxs = [];
      window.AudioContext = class extends Orig {
        constructor(...a: any[]) {
          super(...a);
          (window as any).__ctxs.push(this);
        }
      } as typeof AudioContext;
    });
    const states = () => page.evaluate(() => (window as any).__ctxs.map((c: AudioContext) => c.state));

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    expect(await states()).toEqual([]); // inte vid sidladdning

    await page.locator("#btn-hero").tap();
    await expect.poll(states).toEqual(["running"]);

    // iOS pausar kontexten vid appbyte – nästa tryck ska väcka den
    await page.evaluate(() => (window as any).__ctxs[0].suspend());
    await expect.poll(states).toEqual(["suspended"]);
    await page.locator("#btn-hero").tap();
    await expect.poll(states).toEqual(["running"]);
    await ctx.close();
  });

  test("prefers-reduced-motion: page readable", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // All sections should be readable — scroll through
    const sections = ["#intro", "#act-when", "#act-where", "#act-program", "#act-rsvp", "#act-outro"];
    for (const sel of sections) {
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    // Title should be visible
    const titleOpacity = await page.locator(".title-main").evaluate(
      (el) => parseFloat(getComputedStyle(el).opacity)
    );
    expect(titleOpacity).toBeGreaterThanOrEqual(0.95);

    await context.close();
  });

  test("noindex meta present", async ({ page }) => {
    await page.goto("/");
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robotsMeta).toContain("noindex");
  });

  test("screenshots at all widths", async ({ page }) => {
    // Per-section screenshots at 390px (scrolled, so animations have fired)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Intro
    await page.screenshot({
      path: path.join(QA_DIR, "screenshot-intro.png"),
      fullPage: false,
    });

    // Scroll through each section and screenshot
    const sections = [
      { sel: "#act-when", name: "when" },
      { sel: "#act-where", name: "where" },
      { sel: "#act-program", name: "program" },
      { sel: "#act-rsvp", name: "rsvp" },
      { sel: "#act-outro", name: "outro" },
    ];
    for (const s of sections) {
      await page.locator(s.sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(QA_DIR, `screenshot-${s.name}.png`),
        fullPage: false,
      });
    }

    // Also open signpost then screenshot
    await page.locator("#act-where").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator("#signpost-wrapper").click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(QA_DIR, "screenshot-where-open.png"),
      fullPage: false,
    });

    // Full page at each width
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 844 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Scroll slowly to trigger all animations
      await page.evaluate(async () => {
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const step = window.innerHeight / 2;
        const max = document.documentElement.scrollHeight;
        for (let y = 0; y < max; y += step) {
          window.scrollTo(0, y);
          await delay(150);
        }
        window.scrollTo(0, 0);
        await delay(300);
      });

      await page.screenshot({
        path: path.join(QA_DIR, `screenshot-${w}px.png`),
        fullPage: true,
      });
    }

    // Success state screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      localStorage.setItem(
        "livias-kalas-rsvp",
        JSON.stringify({
          name: "TestBarn",
          attending: "ja",
          diet: "",
          phone: "",
          message: "",
        })
      );
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator("#act-rsvp").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(QA_DIR, "screenshot-rsvp-success.png"),
      fullPage: false,
    });
  });
});

test.describe("Tap interactions (Vad händer)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  const trackErrors = (page: import("@playwright/test").Page) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    return errors;
  };

  const open = async (page: import("@playwright/test").Page, sel: string) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator(sel).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200); // entrance-animationen klar
  };

  test("pizza: three bites, then a fresh slice", async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, "#beat-pizza");
    const btn = page.locator("#btn-pizza");
    const label = page.locator("#pizza-label");
    await expect(btn).toHaveAttribute("aria-label", /.+/);
    await expect(label).toHaveText("Ta en tugga!");

    const steps: [number, string][] = [
      [1, "Mums!"],
      [3, "En till?"],
      [6, "Bara kanten kvar…"],
    ];
    for (const [paths, text] of steps) {
      await btn.tap();
      await expect(page.locator("#bites path")).toHaveCount(paths);
      await expect(label).toHaveText(text);
    }
    await page.waitForTimeout(500);
    await page.locator("#beat-pizza .beat-illustration").screenshot({
      path: path.join(QA_DIR, "screenshot-tap-pizza.png"),
    });

    await btn.tap();
    await expect(page.locator("#bites path")).toHaveCount(0);
    await expect(label).toHaveText("Ta en tugga!");
    expect(errors).toEqual([]);
  });

  test("cake: blow out candles, then relight", async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, "#beat-cake");
    const btn = page.locator("#btn-cake");
    const label = page.locator("#cake-label");
    const flameOpacity = () =>
      page.$$eval("#btn-cake .flame", (f) => f.map((x) => getComputedStyle(x).opacity));

    await btn.tap();
    await expect(label).toHaveText("Grattis Livia!");
    await expect(btn).toHaveAttribute("aria-label", "Tänd ljusen");
    await expect(page.locator("#cake-svg .smoke")).not.toHaveCount(0);
    await page.waitForTimeout(600);
    expect(await flameOpacity()).toEqual(["0", "0", "0", "0"]);
    await page.locator("#beat-cake .beat-illustration").screenshot({
      path: path.join(QA_DIR, "screenshot-tap-cake.png"),
    });
    // Rökslingorna tas bort när de tonat ut
    await expect(page.locator("#cake-svg .smoke")).toHaveCount(0, { timeout: 3000 });

    await btn.tap();
    await expect(label).toHaveText("");
    await expect(btn).toHaveAttribute("aria-label", "Blås ut ljusen");
    await page.waitForTimeout(1000);
    expect(await flameOpacity()).toEqual(["1", "1", "1", "1"]);
    expect(errors).toEqual([]);
  });

  test("popcorn: 25–35 kernels, one rain at a time, cleaned up within 4 s", async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, "#beat-movie");
    const btn = page.locator("#btn-popcorn");

    const t0 = Date.now();
    await btn.tap();
    const count = await page.locator(".popcorn").count();
    expect(count).toBeGreaterThanOrEqual(25);
    expect(count).toBeLessThanOrEqual(35);

    // Nytt tryck under pågående regn: bara en extra skak, inget nytt regn
    await btn.tap();
    await expect(page.locator(".popcorn-layer")).toHaveCount(1);
    expect(await page.locator(".popcorn").count()).toBeLessThanOrEqual(count);

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(QA_DIR, "screenshot-tap-popcorn.png") });

    await expect(page.locator(".popcorn-layer")).toHaveCount(0, { timeout: 4000 });
    await expect(page.locator(".popcorn")).toHaveCount(0);
    expect(Date.now() - t0).toBeLessThan(4000);
    expect(errors).toEqual([]);
  });

  test("reduced motion: end states only, popcorn still cleaned up", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = trackErrors(page);
    await open(page, "#beat-pizza");

    await page.locator("#btn-pizza").tap();
    await expect(page.locator("#bites path")).toHaveCount(1);
    // Ingen knyck: biten står still (identitetsmatris)
    expect(await page.$eval("#pizza-slice", (e) => e.getAttribute("transform") ?? "matrix(1,0,0,1,0,0)")).toBe(
      "matrix(1,0,0,1,0,0)"
    );

    await page.locator("#btn-cake").tap();
    // Lågorna släcks direkt (scale 0), utan rök. Opaciteten tonar på 0,2 s via
    // sidans globala reduced-motion-transition, därav poll.
    expect(
      await page.$$eval("#btn-cake .flame", (f) => f.map((x) => x.getAttribute("transform")?.startsWith("matrix(0,0,0,0")))
    ).toEqual([true, true, true, true]);
    await expect
      .poll(() => page.$$eval("#btn-cake .flame", (f) => f.map((x) => getComputedStyle(x).opacity)))
      .toEqual(["0", "0", "0", "0"]);
    await expect(page.locator("#cake-svg .smoke")).toHaveCount(0);

    const t0 = Date.now();
    await page.locator("#btn-popcorn").tap();
    const count = await page.locator(".popcorn").count();
    expect(count).toBeGreaterThanOrEqual(25);
    await expect(page.locator(".popcorn-layer")).toHaveCount(0, { timeout: 4000 });
    expect(Date.now() - t0).toBeLessThan(4000);
    expect(errors).toEqual([]);
  });
});

test.describe("Hero tap (tiara och nattmössa)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  const vis = (page: import("@playwright/test").Page, sel: string) =>
    page.$eval(sel, (e) => {
      const c = getComputedStyle(e);
      return c.visibility === "visible" && c.opacity === "1";
    });

  test("three taps cycle tiara → nightcap → nothing, no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // intro klar
    const btn = page.locator("#btn-hero");
    await expect(btn).toHaveAttribute("aria-label", "Tryck på Livia");
    expect(await vis(page, "#tiara")).toBe(false);
    expect(await vis(page, "#nightcap")).toBe(false);

    await btn.tap();
    await expect(btn).toHaveAttribute("data-state", "1");
    await expect.poll(() => vis(page, "#tiara")).toBe(true);
    await page.waitForTimeout(1200);
    await page.locator("#btn-hero").screenshot({ path: path.join(QA_DIR, "screenshot-hero-tiara.png") });

    await btn.tap();
    await expect(btn).toHaveAttribute("data-state", "2");
    await expect.poll(() => vis(page, "#nightcap")).toBe(true);
    await expect.poll(() => vis(page, "#tiara")).toBe(false);
    await page.waitForTimeout(1200);
    await page.locator("#btn-hero").screenshot({ path: path.join(QA_DIR, "screenshot-hero-nightcap.png") });

    await btn.tap();
    await expect(btn).toHaveAttribute("data-state", "0");
    await expect.poll(() => vis(page, "#nightcap"), { timeout: 3000 }).toBe(false);
    expect(await vis(page, "#tiara")).toBe(false);
    await expect(page.locator(".hero-spark")).toHaveCount(0, { timeout: 2000 });

    // Börjar om
    await btn.tap();
    await expect(btn).toHaveAttribute("data-state", "1");
    expect(errors).toEqual([]);
  });

  test("reduced motion: accessory appears directly without falling", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#btn-hero").tap();
    // Står på plats direkt (ingen y-förskjutning), ingen stjärnpop
    expect(await page.$eval("#tiara", (e) => getComputedStyle(e).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await expect(page.locator(".hero-spark")).toHaveCount(0);
    await expect.poll(() => vis(page, "#tiara")).toBe(true);
  });
});

test.describe("Sound files", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("preloaded on first tap, right file per interaction, silent when muted", async ({ page }) => {
    // Märk varje avkodad buffer med filnamnet och logga varje uppspelning
    await page.addInitScript(() => {
      const w = window as any;
      w.__played = [];
      const urlOf = new WeakMap<ArrayBuffer, string>();
      const nameOf = new WeakMap<AudioBuffer, string>();
      const origAB = Response.prototype.arrayBuffer;
      Response.prototype.arrayBuffer = async function () {
        const ab = await origAB.call(this);
        const m = this.url.match(/sounds\/(\w+)\.mp3/);
        if (m) urlOf.set(ab, m[1]);
        return ab;
      };
      const origDecode = BaseAudioContext.prototype.decodeAudioData;
      BaseAudioContext.prototype.decodeAudioData = async function (ab: ArrayBuffer) {
        const name = urlOf.get(ab);
        const buf = await origDecode.call(this, ab);
        if (name) nameOf.set(buf, name);
        return buf;
      } as any;
      const origStart = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...a: any[]) {
        const name = this.buffer && nameOf.get(this.buffer);
        if (name) w.__played.push({ name, rate: +this.playbackRate.value.toFixed(2) });
        return origStart.apply(this, a as any);
      };
    });
    const soundRequests: { url: string; status: number }[] = [];
    page.on("response", (r) => {
      if (r.url().includes("/sounds/")) soundRequests.push({ url: r.url(), status: r.status() });
    });
    const played = () => page.evaluate(() => (window as any).__played as { name: string; rate: number }[]);
    const playedSince = async (n: number) => (await played()).slice(n);

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(soundRequests).toEqual([]); // inget laddas vid sidladdning

    // Tryck 1 på porträttet: förladdning + sparkle
    await page.locator("#btn-hero").tap();
    await expect.poll(() => soundRequests.length).toBe(6);
    expect(soundRequests.every((r) => r.status === 200)).toBe(true);
    await expect.poll(async () => (await played()).map((p) => p.name)).toContain("sparkle");

    // Tryck 2: nattmössan = sparkle nedpitchad 0.6
    let n = (await played()).length;
    await page.locator("#btn-hero").tap();
    await expect.poll(() => playedSince(n)).toEqual([{ name: "sparkle", rate: 0.6 }]);

    // Tryck 3: mössan flyger iväg = samma ljud igen
    n = (await played()).length;
    await page.locator("#btn-hero").tap();
    await expect.poll(() => playedSince(n)).toEqual([{ name: "sparkle", rate: 0.6 }]);

    // Pizza = bite
    await page.locator("#beat-pizza").scrollIntoViewIfNeeded();
    n = (await played()).length;
    await page.locator("#btn-pizza").tap();
    await expect.poll(async () => (await playedSince(n)).map((p) => p.name)).toEqual(["bite"]);

    // Popcorn = popcorn (skak) + 7 pop med slumpad tonhöjd
    n = (await played()).length;
    await page.locator("#btn-popcorn").tap();
    await page.waitForTimeout(1200);
    const pc = await playedSince(n);
    expect(pc.filter((p) => p.name === "popcorn")).toHaveLength(1);
    const pops = pc.filter((p) => p.name === "pop");
    expect(pops).toHaveLength(7);
    expect(new Set(pops.map((p) => p.rate)).size).toBeGreaterThan(1);

    // Tårta = blow
    n = (await played()).length;
    await page.locator("#btn-cake").tap();
    await expect.poll(async () => (await playedSince(n)).map((p) => p.name)).toEqual(["blow"]);

    // Skylten (knapptryck) = pop
    n = (await played()).length;
    await page.locator("#signpost-svg").tap();
    await expect.poll(async () => (await playedSince(n)).map((p) => p.name)).toEqual(["pop"]);

    // OSA ja = fanfare (Formspree mockas i beforeEach)
    await page.locator("#field-name").fill("Testbarn");
    await page.locator("#btn-yes").click();
    n = (await played()).length;
    await page.locator("#btn-submit").click();
    await expect.poll(async () => (await playedSince(n)).map((p) => p.name)).toContain("fanfare");

    // Ljud av: inga uppspelningar
    await page.locator("#btn-mute").scrollIntoViewIfNeeded();
    await page.locator("#btn-mute").click();
    n = (await played()).length;
    await page.locator("#btn-hero").tap();
    await page.locator("#btn-pizza").tap();
    await page.waitForTimeout(500);
    expect(await playedSince(n)).toEqual([]);
  });
});

// Pixel 7 utan defaultBrowserType (får inte sättas i en describe)
const { defaultBrowserType: _pixelBrowser, ...pixel7 } = devices["Pixel 7"];

test.describe("Android hero (Pixel 7)", () => {
  test.use(pixel7);

  const heroState = (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      const img = document.querySelector<HTMLImageElement>("#hero-frame img")!;
      return {
        naturalWidth: img.naturalWidth,
        opacity: getComputedStyle(document.querySelector("#hero-frame")!).opacity,
      };
    });

  test("hero image loads and is fully visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect.poll(() => heroState(page)).toEqual({ naturalWidth: 864, opacity: "1" });
  });

  test("hero becomes visible even if the intro animation never runs (no JS)", async ({ browser }) => {
    const ctx = await browser.newContext({ ...pixel7, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const s = await heroState(page);
    expect(s.naturalWidth).toBeGreaterThan(0);
    await expect.poll(() => heroState(page).then((x) => x.opacity), { timeout: 5000 }).toBe("1");
    await ctx.close();
  });
});

test.describe("RSVP persistence", () => {
  test("answer lives only in localStorage, not tied to ?g", async ({ page, browser }) => {
    await page.goto("/?g=Emma");
    await page.waitForLoadState("networkidle");
    await page.locator("#act-rsvp").scrollIntoViewIfNeeded();
    await page.locator("#btn-yes").click();
    await page.locator("#btn-submit").click(); // Formspree mockas i beforeEach
    await expect(page.locator("#rsvp-summary")).toBeVisible({ timeout: 5000 });

    // Ingen state utanför localStorage
    expect(page.url()).toMatch(/\/\?g=Emma$/);
    expect(await page.context().cookies()).toEqual([]);
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
    expect(await page.evaluate(() => Object.keys(localStorage))).toContain("livias-kalas-rsvp");

    // Samma webbläsare, annat ?g: svaret visas ändå (per webbläsare, inte per namn)
    await page.goto("/?g=Olle");
    await expect(page.locator("#rsvp-summary")).toBeVisible();

    // Annan webbläsare, samma URL: inget svar följer med
    const other = await browser.newContext();
    const p2 = await other.newPage();
    await p2.goto("/?g=Emma");
    await expect(p2.locator("#rsvp-form")).toBeVisible();
    await expect(p2.locator("#rsvp-summary")).toBeHidden();
    await other.close();
  });

  test("?reset=1 clears the saved answer and reloads without the parameter", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.setItem(
        "livias-kalas-rsvp",
        JSON.stringify({ name: "Emma", attending: "ja", diet: "", phone: "", message: "" })
      )
    );
    await page.evaluate(() => localStorage.setItem("livias-kalas-mute", "true"));
    await page.goto("/?g=Emma&reset=1");
    await page.waitForURL(/\/\?g=Emma$/);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => localStorage.getItem("livias-kalas-rsvp"))).toBeNull();
    // Bara svaret rensas, inte ljudinställningen
    expect(await page.evaluate(() => localStorage.getItem("livias-kalas-mute"))).toBe("true");
    await expect(page.locator("#rsvp-form")).toBeVisible();
    await expect(page.locator("#rsvp-summary")).toBeHidden();
  });
});

test.describe("Resilience (no JS, init crash, blocked script)", () => {
  test.use(pixel7);

  // Synligt = opacity 1 i hela kedjan upp till body och inte display:none
  const visible = (page: import("@playwright/test").Page, sel: string) =>
    page.$eval(sel, (el) => {
      if (el.getClientRects().length === 0) return false;
      for (let n: Element | null = el; n; n = n.parentElement) {
        if (getComputedStyle(n).opacity !== "1") return false;
      }
      return true;
    });

  const CONTENT = [
    ["#main-title", "Livia fyller 8!"],
    ["#ticket-date", "Fredag 13 november"],
    ["#ticket-time", "Kl 17:00"],
    ["#address-street", "Kardemummagränd 20"],
    ["#beat-pizza-text", "Pizza till middag"],
    ["#beat-cake-text", "Tårta"],
    ["#rsvp-deadline", "Svara senast"],
    ["#outro-see-you", "Vi ses den 13:e!"],
  ] as const;

  const expectAllContentVisible = async (page: import("@playwright/test").Page) => {
    expect(await visible(page, "#hero-frame")).toBe(true);
    expect(await page.$eval("#hero-frame img", (i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    for (const [sel, text] of CONTENT) {
      await expect(page.locator(sel)).toContainText(text);
      expect(await visible(page, sel), sel).toBe(true);
    }
    // Ingen OSA-sammanfattning utan sparat svar
    await expect(page.locator("#rsvp-summary")).toBeHidden();
  };

  test("without JS: hero, all text and the address are visible, no summary", async ({ browser }) => {
    const ctx = await browser.newContext({ ...pixel7, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectAllContentVisible(page);
    await expect(page.locator("#rsvp-form")).toBeVisible();
    await expect(page.locator("#debug")).toBeHidden();
    await ctx.close();
  });

  test("a crashing init step does not stop the rest; ?debug=1 shows the error", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = Document.prototype.getElementById;
      Document.prototype.getElementById = function (id: string) {
        if (id === "tiara") throw new Error("test-krasch");
        return orig.call(this, id);
      };
    });
    await page.goto("/?debug=1");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveClass(/js-ready/);
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)js(\s|$)/);
    // Steg efter det trasiga körde ändå: pizzan och ljudknappen fungerar
    await page.locator("#btn-pizza").tap();
    await expect(page.locator("#pizza-label")).toHaveText("Mums!");
    expect(
      await page.$$eval("#btn-mute svg", (s) => s.filter((x) => getComputedStyle(x).display !== "none").length)
    ).toBe(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectAllContentVisible(page);
    await expect(page.locator("#debug")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("#debug")).toContainText("init:hero: test-krasch");
  });

  test("main script blocked: failsafe reveals everything within 4 s, debug explains", async ({ page }) => {
    await page.route(/\/assets\/index-.*\.js$/, (r) => r.abort());
    await page.goto("/?debug=1");
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)js(\s|$)/, { timeout: 5000 });
    await expectAllContentVisible(page);
    await expect(page.locator("#debug")).toContainText("Nödspärr", { timeout: 6000 });
  });

  test("debug panel stays hidden without ?debug=1", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(5000);
    await expect(page.locator("#debug")).toBeHidden();
  });
});
