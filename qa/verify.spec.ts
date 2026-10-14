import { test, expect } from "@playwright/test";
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

  test("greeting with ?g=Emma shows 'Hej Emma!'", async ({ page }) => {
    await page.goto("/?g=Emma");
    await page.waitForLoadState("networkidle");
    const greeting = await page.locator("#greeting").textContent();
    expect(greeting).toBe("Hej Emma!");
  });

  test("greeting with ?g=<script> renders as text", async ({ page }) => {
    await page.goto("/?g=<script>alert(1)</script>");
    await page.waitForLoadState("networkidle");
    const greeting = await page.locator("#greeting").textContent();
    expect(greeting).toContain("Hej");
    // Should not contain HTML tags
    const html = await page.locator("#greeting").innerHTML();
    expect(html).not.toContain("<script>");
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

  test("mute toggle persists", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to outro
    await page.locator("#act-outro").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Click mute
    await page.locator("#btn-mute").click();
    await page.waitForTimeout(200);

    // Check localStorage
    const muted = await page.evaluate(() =>
      localStorage.getItem("livias-kalas-mute")
    );
    expect(muted).toBe("true");

    // Reload and check
    await page.reload();
    await page.waitForLoadState("networkidle");
    const mutedAfterReload = await page.evaluate(() =>
      localStorage.getItem("livias-kalas-mute")
    );
    expect(mutedAfterReload).toBe("true");

    // Sound off icon should be visible (hidden attribute removed by JS)
    await page.waitForTimeout(500);
    const soundOffHidden = await page.locator("#icon-sound-off").evaluate(
      (el) => (el as HTMLElement).hidden
    );
    expect(soundOffHidden).toBe(false);
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
