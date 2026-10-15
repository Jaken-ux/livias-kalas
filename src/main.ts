import { content } from "./content";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import confetti from "canvas-confetti";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement>(sel: string) =>
  document.querySelector<T>(sel)!;
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ===== STORAGE KEYS =====
const STORAGE_KEY = "livias-kalas-rsvp";
const MUTE_KEY = "livias-kalas-mute";

// ===== GREETING =====
function initGreeting() {
  const params = new URLSearchParams(window.location.search);
  const g = params.get("g");
  if (g) {
    const safe = g.slice(0, 30).replace(/[<>&"'/]/g, "").trim();
    if (!safe) return;
    // "...och Emma är bjuden på" – och barnets namn förifylls i OSA
    const el = $("#invitee");
    if (el) el.textContent = safe;
    const nameField = $<HTMLInputElement>("#field-name");
    if (nameField) nameField.value = safe;
  }
}

// ===== STARS =====
function createStars() {
  const container = $("#stars");
  if (!container) return;
  const count = 60;
  const tweens: gsap.core.Tween[] = [];
  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    const size = 1.5 + Math.random() * 3;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    container.appendChild(star);

    if (!reducedMotion) {
      tweens.push(
        gsap.to(star, {
          opacity: 0.3 + Math.random() * 0.7,
          duration: 1 + Math.random() * 2,
          delay: Math.random() * 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })
      );
    } else {
      star.style.opacity = `${0.3 + Math.random() * 0.5}`;
    }
  }

  // Pausa glittret när introt är utom synhåll – sparar CPU under scroll
  if (tweens.length) {
    ScrollTrigger.create({
      trigger: "#intro",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) =>
        tweens.forEach((t) => (self.isActive ? t.resume() : t.pause())),
    });
  }
}

// ===== POPULATE CONTENT =====
function populateContent() {
  // Ticket
  const ticketDate = $("#ticket-date");
  if (ticketDate) ticketDate.textContent = content.party.dateText;
  const ticketTime = $("#ticket-time");
  if (ticketTime)
    ticketTime.textContent = `Kl ${content.party.start} – ${content.party.end}`;
  const ticketDress = $("#ticket-dresscode");
  if (ticketDress) {
    if (content.party.dresscode) {
      ticketDress.textContent = content.party.dresscode;
    } else {
      ticketDress.style.display = "none";
    }
  }

  // Countdown
  const countdownEl = $("#countdown");
  if (countdownEl) {
    const partyDate = new Date(content.party.dateISO + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (partyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > 0) {
      countdownEl.textContent = `${diff} dagar kvar!`;
    } else if (diff === 0) {
      countdownEl.textContent = "Kalaset är idag!";
    } else {
      countdownEl.textContent =
        "Kalaset har varit – tack för att ni kom!";
    }
  }

  // Address
  const street = $("#address-street");
  if (street) street.textContent = content.party.street;
  const postal = $("#address-postal");
  if (postal) postal.textContent = content.party.postal;

  const q = encodeURIComponent(content.party.mapsQuery);
  const googleBtn = $<HTMLAnchorElement>("#btn-google-maps");
  if (googleBtn)
    googleBtn.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const appleBtn = $<HTMLAnchorElement>("#btn-apple-maps");
  if (appleBtn) appleBtn.href = `https://maps.apple.com/?q=${q}`;

  // Program beats
  const beatPizza = $("#beat-pizza-text");
  if (beatPizza) beatPizza.textContent = content.party.program[0];
  const beatMovie = $("#beat-movie-text");
  if (beatMovie) beatMovie.textContent = content.party.program[1];
  const beatCake = $("#beat-cake-text");
  if (beatCake) beatCake.textContent = content.party.program[2];

  // Extra info
  const giftsLine = $("#gifts-line");
  if (giftsLine) {
    giftsLine.textContent = content.party.gifts ?? "";
  }
  const contactLine = $("#contact-line");
  if (contactLine) {
    contactLine.textContent = content.party.contact ?? "";
  }

  // RSVP
  const deadline = $("#rsvp-deadline");
  if (deadline) deadline.textContent = content.rsvp.deadlineText;
  const formSubject = $<HTMLInputElement>("#form-subject");
  if (formSubject) formSubject.value = content.rsvp.subject;

  // Outro
  const outroSeeYou = $("#outro-see-you");
  if (outroSeeYou) {
    const day = new Date(content.party.dateISO + "T00:00:00").getDate();
    outroSeeYou.textContent = `Vi ses den ${day}:e!`;
  }
}

// ===== ANIMATIONS =====
function initAnimations() {
  const fade = reducedMotion
    ? { opacity: 1, duration: 0.3 }
    : { opacity: 1, duration: 0.8, ease: "power2.out" };

  // Intro: moon
  gsap.to(".moon", {
    ...fade,
    delay: 0.3,
    ...(reducedMotion ? {} : { y: -10, duration: 1.2 }),
  });

  // Intro: hero frame
  gsap.to(".hero-frame", {
    ...fade,
    delay: 0.5,
    ...(reducedMotion ? {} : { scale: 1, duration: 1 }),
  });
  if (!reducedMotion) {
    gsap.set(".hero-frame", { scale: 0.8 });
  }

  // Intro: title
  gsap.to(".title", {
    ...fade,
    delay: 0.8,
    ...(reducedMotion ? {} : { y: 0, duration: 0.8 }),
  });
  if (!reducedMotion) {
    gsap.set(".title", { y: 30 });
  }

  // Intro: subtitle
  gsap.to(".subtitle", {
    ...fade,
    delay: 1.1,
  });

  // Scroll hint
  gsap.to(".scroll-hint", {
    ...fade,
    delay: 1.5,
  });
  if (!reducedMotion) {
    gsap.to(".scroll-hint svg", {
      y: 8,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2,
    });
  }

  // Ticket slide in
  ScrollTrigger.create({
    trigger: "#act-when",
    start: "top 80%",
    once: true,
    onEnter: () => {
      if (reducedMotion) {
        gsap.set(".ticket", { opacity: 1 });
        gsap.set(".countdown", { opacity: 1 });
      } else {
        gsap.fromTo(
          ".ticket",
          { opacity: 0, x: -60, rotation: -5 },
          { opacity: 1, x: 0, rotation: 0, duration: 0.9, ease: "back.out(1.7)" }
        );
        gsap.fromTo(
          ".countdown",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: "power2.out" }
        );
      }
    },
  });

  // Signpost
  ScrollTrigger.create({
    trigger: "#act-where",
    start: "top 80%",
    once: true,
    onEnter: () => {
      if (reducedMotion) {
        gsap.set(".signpost-wrapper", { opacity: 1 });
      } else {
        gsap.fromTo(
          ".signpost-wrapper",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
      }
    },
  });

  // Program beats
  const beats = document.querySelectorAll(".program-beat");
  beats.forEach((beat, i) => {
    const isLeft = beat.classList.contains("beat-left");
    ScrollTrigger.create({
      trigger: beat,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (reducedMotion) {
          gsap.set(beat, { opacity: 1 });
        } else {
          gsap.fromTo(
            beat,
            { opacity: 0, x: isLeft ? -50 : 50 },
            {
              opacity: 1,
              x: 0,
              duration: 0.7,
              delay: i * 0.15,
              ease: "power2.out",
            }
          );
        }
      },
    });
  });

  // Outro credits
  const creditsLines = document.querySelectorAll(".credits-line");
  creditsLines.forEach((line, i) => {
    ScrollTrigger.create({
      trigger: line,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(line, {
          opacity: 1,
          duration: reducedMotion ? 0.2 : 0.8,
          delay: i * 0.3,
        });
      },
    });
  });

  ScrollTrigger.create({
    trigger: ".outro-controls",
    start: "top 90%",
    once: true,
    onEnter: () => {
      gsap.to(".outro-controls", {
        opacity: 1,
        duration: reducedMotion ? 0.2 : 0.6,
      });
    },
  });
}

// ===== SIGNPOST INTERACTION =====
function initSignpost() {
  const wrapper = $("#signpost-wrapper");
  const card = $("#address-card");
  const signArm = document.getElementById("sign-arm");
  let isOpen = false;

  // Liten vagga på plattan var 4:e sekund tills skylten trycks första gången.
  // Körs bara när sektionen syns.
  let wobble: gsap.core.Timeline | null = null;
  if (signArm && !reducedMotion) {
    wobble = gsap
      .timeline({ paused: true, repeat: -1, repeatDelay: 3.4, delay: 1 })
      .to(signArm, { rotation: 2, duration: 0.15, ease: "sine.inOut" })
      .to(signArm, { rotation: -2, duration: 0.3, ease: "sine.inOut" })
      .to(signArm, { rotation: 0, duration: 0.15, ease: "sine.inOut" });
    ScrollTrigger.create({
      trigger: "#act-where",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        if (!wobble) return;
        if (self.isActive) wobble.resume();
        else wobble.pause();
      },
    });
  }

  const toggle = () => {
    if (wobble) {
      wobble.kill();
      wobble = null;
    }
    isOpen = !isOpen;
    card.classList.toggle("open", isOpen);

    if (signArm && !reducedMotion) {
      gsap.fromTo(
        signArm,
        { rotation: 0 },
        {
          rotation: isOpen ? 8 : -5,
          duration: 0.4,
          ease: "elastic.out(1, 0.5)",
          onComplete: () => {
            gsap.to(signArm, { rotation: 0, duration: 0.3 });
          },
        }
      );
    }
    playPop();
  };

  wrapper.addEventListener("click", toggle);
  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
}

// ===== SOUND =====
let audioCtx: AudioContext | null = null;
let isMuted = localStorage.getItem(MUTE_KEY) === "true";

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // iOS pausar kontexten (t.ex. efter appbyte) – väck den igen
  if (audioCtx.state !== "running") audioCtx.resume().catch(() => {});
  return audioCtx;
}

// iOS Safari: AudioContext måste skapas/resume():as inom en user gesture,
// annars förblir den suspended. Lås upp på varje tryck (billigt när den redan
// kör) så att även ljud som spelas senare – t.ex. fanfaren efter OSA-svaret,
// som kommer efter ett nätverksanrop – fungerar. Skapas aldrig vid sidladdning.
function initAudioUnlock() {
  const unlock = () => {
    if (audioCtx?.state === "running") return;
    try {
      const ctx = getAudioCtx();
      // Tyst buffer: äldre iOS låser upp ljudet först när något faktiskt spelas
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      // Ignore audio errors
    }
  };
  for (const type of ["touchend", "pointerup", "click", "keydown"]) {
    document.addEventListener(type, unlock, { capture: true, passive: true });
  }
}

function playPop() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio errors
  }
}

function playFanfare() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.15 + 0.4
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.45);
    });
  } catch {
    // Ignore audio errors
  }
}

function initMuteToggle() {
  const btn = $("#btn-mute");
  const iconOn = $("#icon-sound-on");
  const iconOff = $("#icon-sound-off");

  // SVG följer inte webbläsarens [hidden]-regel – attributet sätts här och
  // döljs via CSS (.btn-mute svg[hidden]). Högtalare = ljud på.
  const update = () => {
    iconOn.toggleAttribute("hidden", isMuted);
    iconOff.toggleAttribute("hidden", !isMuted);
    btn.setAttribute("aria-label", isMuted ? "Sätt på ljud" : "Stäng av ljud");
  };
  update();

  btn.addEventListener("click", () => {
    isMuted = !isMuted;
    localStorage.setItem(MUTE_KEY, String(isMuted));
    update();
    if (!isMuted) playPop();
  });
}

function tone(f0: number, f1: number, dur: number, vol = 0.12, at = 0) {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    // Ignore audio errors
  }
}

// "Mm-ums": två korta, mörka pop
function playMunch() {
  tone(320, 140, 0.09, 0.15);
  tone(260, 120, 0.1, 0.12, 0.11);
}

// "Fff": kort brus genom högpassfilter
function playBlow() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    const len = Math.floor(ctx.sampleRate * 0.4);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1500;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
  } catch {
    // Ignore audio errors
  }
}

function playPopcornCascade() {
  for (let i = 0; i < 7; i++) {
    tone(500 + Math.random() * 500, 200, 0.06, 0.1, i * 0.09 + Math.random() * 0.05);
  }
}

// ===== TAP INTERACTIONS (Vad händer) =====
const SVG_NS = "http://www.w3.org/2000/svg";
const rand = Math.random;

// Tuggor, i viewBox-koordinater (cx, cy, r): spetsen, längre upp, nästan allt
const BITES: [number, number, number][][] = [
  [[60, 20, 24]],
  [[46, 50, 19], [74, 50, 19]],
  [[36, 74, 22], [84, 74, 22], [60, 70, 25]],
];
const PIZZA_LABELS = ["Ta en tugga!", "Mums!", "En till?", "Bara kanten kvar…"];

// Cirkel med lätt taggig kant (tandavtryck)
function bitePath(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const rr = i % 2 ? r * 0.88 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

function initPizza() {
  const btn = $("#btn-pizza");
  const bites = document.getElementById("bites");
  const slice = document.getElementById("pizza-slice");
  const label = $("#pizza-label");
  if (!btn || !bites || !slice) return;
  gsap.set(slice, { svgOrigin: "60 60" });
  let n = 0;

  btn.addEventListener("click", () => {
    if (n < BITES.length) {
      for (const [cx, cy, r] of BITES[n]) {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", bitePath(cx, cy, r));
        bites.appendChild(p);
        if (!reducedMotion) {
          gsap.from(p, { scale: 0, svgOrigin: `${cx} ${cy}`, duration: 0.18, ease: "back.out(2)" });
        }
      }
      n++;
      if (!reducedMotion) {
        gsap.fromTo(
          slice,
          { rotation: n % 2 ? -8 : 8 },
          { rotation: 0, duration: 0.4, ease: "elastic.out(1, 0.4)", overwrite: true }
        );
      }
      playMunch();
    } else {
      // Fjärde trycket: ny bit
      bites.replaceChildren();
      n = 0;
      if (!reducedMotion) {
        gsap.fromTo(
          slice,
          { scale: 0.5, rotation: 0 },
          { scale: 1, duration: 0.35, ease: "back.out(2.5)", overwrite: true }
        );
      }
      playPop();
    }
    label.textContent = PIZZA_LABELS[n];
    btn.dataset.bites = String(n);
  });
}

function addSmoke(svg: SVGSVGElement, flame: SVGGElement, i: number) {
  const b = flame.getBBox();
  const x = b.x + b.width / 2;
  const y = b.y + b.height * 0.5;
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", `M${x} ${y}q-3 -4 0 -8q3 -4 0 -8`);
  p.setAttribute("class", "smoke");
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", "#CBD5E1");
  p.setAttribute("stroke-width", "1.5");
  p.setAttribute("stroke-linecap", "round");
  p.setAttribute("opacity", "0");
  svg.appendChild(p);
  gsap.fromTo(
    p,
    { opacity: 0.8, y: 0 },
    {
      opacity: 0,
      y: -16,
      x: i % 2 ? 3 : -3,
      duration: 1.1,
      delay: 0.15 + i * 0.05,
      ease: "power1.out",
      onComplete: () => p.remove(),
    }
  );
}

function initCake() {
  const btn = $("#btn-cake");
  const svg = document.getElementById("cake-svg") as SVGSVGElement | null;
  const label = $("#cake-label");
  if (!btn || !svg) return;
  const flames = gsap.utils.toArray<SVGGElement>("#btn-cake .flame");
  gsap.set(flames, { transformOrigin: "50% 100%" });
  let lit = true;

  btn.addEventListener("click", () => {
    lit = !lit;
    gsap.killTweensOf(flames);
    if (!lit) {
      label.textContent = `Grattis ${content.child.name}!`;
      btn.setAttribute("aria-label", "Tänd ljusen");
      playBlow();
      if (reducedMotion) {
        gsap.set(flames, { scale: 0, opacity: 0 });
      } else {
        gsap.to(flames, { scale: 0, opacity: 0, duration: 0.3, stagger: 0.04, ease: "power2.in" });
        flames.forEach((f, i) => addSmoke(svg, f, i));
        gsap.fromTo(label, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" });
      }
    } else {
      label.textContent = "";
      btn.setAttribute("aria-label", "Blås ut ljusen");
      if (reducedMotion) {
        gsap.set(flames, { scale: 1, opacity: 1 });
      } else {
        // Flammar upp i tur och ordning
        gsap.to(flames, { scale: 1, opacity: 1, duration: 0.35, stagger: 0.12, ease: "back.out(3)" });
      }
    }
    btn.dataset.lit = String(lit);
  });
}

const POPCORN_SVGS = [
  '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="7" cy="9" r="5" fill="#FEF3C7"/><circle cx="13" cy="8" r="5" fill="#FDE68A"/><circle cx="10" cy="13" r="5" fill="#FEF3C7"/></svg>',
  '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="6" cy="11" r="4" fill="#FDE68A"/><circle cx="11" cy="6" r="5" fill="#FEF3C7"/><circle cx="14" cy="12" r="4.5" fill="#FEF3C7"/><circle cx="9" cy="14" r="4" fill="#FDE68A"/></svg>',
  '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="8" cy="8" r="5.5" fill="#FEF3C7"/><circle cx="13" cy="12" r="5" fill="#FDE68A"/><circle cx="10" cy="11" r="1.6" fill="#F59E0B"/></svg>',
];

function initPopcorn() {
  const btn = $("#btn-popcorn");
  const bucket = document.getElementById("popcorn-bucket");
  if (!btn) return;
  let raining = false;

  const shake = () => {
    if (reducedMotion || !bucket) return;
    gsap.fromTo(
      bucket,
      { rotation: 0 },
      { keyframes: { rotation: [-8, 7, -5, 3, 0] }, duration: 0.45, svgOrigin: "102 95", overwrite: true }
    );
  };

  btn.addEventListener("click", () => {
    shake();
    // Max ett regn åt gången – under pågående regn blir det bara en extra skak
    if (raining) return;
    raining = true;
    btn.dataset.raining = "true";
    playPopcornCascade();

    const layer = document.createElement("div");
    layer.className = "popcorn-layer";
    layer.setAttribute("aria-hidden", "true");
    const count = 25 + Math.floor(rand() * 11);
    const items: HTMLElement[] = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "popcorn";
      el.innerHTML = POPCORN_SVGS[i % POPCORN_SVGS.length];
      layer.appendChild(el);
      items.push(el);
    }
    document.body.appendChild(layer);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const done = () => {
      layer.remove();
      raining = false;
      delete btn.dataset.raining;
    };

    if (reducedMotion) {
      // Slutresultat utan rörelse: popcorn ligger utspridda och tonar ut
      items.forEach((el) =>
        gsap.set(el, { x: rand() * (w - 20), y: rand() * (h - 20), rotation: rand() * 360, scale: 0.7 + rand() * 0.6 })
      );
      gsap.to(items, { opacity: 0, duration: 0.4, delay: 1.5, onComplete: done });
      return;
    }

    const all = gsap.timeline({ onComplete: done });
    items.forEach((el) => {
      const x = rand() * (w - 20);
      const mid = h * (0.35 + rand() * 0.3);
      gsap.set(el, { x, y: -40, rotation: rand() * 360, scale: 0.7 + rand() * 0.6 });
      const t = gsap
        .timeline({ onComplete: () => el.remove() })
        .to(el, { y: mid, x: x + (rand() - 0.5) * 40, rotation: "+=180", duration: 0.5 + rand() * 0.3, ease: "power2.in" })
        .to(el, { y: mid - 20 - rand() * 20, duration: 0.18, ease: "power1.out" }) // studs
        .to(el, { y: h + 60, rotation: "+=120", duration: 0.55 + rand() * 0.2, ease: "power2.in" });
      all.add(t, rand() * 0.6);
    });
  });
}

// ===== HERO: TIARA OCH NATTMÖSSA =====
function playGlitter() {
  [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, f * 1.02, 0.14, 0.05, i * 0.06));
}

const SPARK_SVG =
  '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M7 0l1.8 5.2L14 7l-5.2 1.8L7 14l-1.8-5.2L0 7l5.2-1.8Z" fill="#FDE68A"/></svg>';

// Små stjärnor som poppar runt tiaran (i % av ramen)
function popSparks(layer: HTMLElement) {
  const spots = [[24, 2], [74, 0], [16, 16], [82, 14], [50, -10]];
  spots.forEach(([x, y], i) => {
    const el = document.createElement("span");
    el.className = "hero-spark";
    el.innerHTML = SPARK_SVG;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    layer.appendChild(el);
    gsap.fromTo(
      el,
      { scale: 0, opacity: 1, rotation: 0 },
      {
        keyframes: [
          { scale: 1.2, rotation: 45, duration: 0.25, ease: "back.out(3)" },
          { scale: 0, opacity: 0, rotation: 90, y: -10, duration: 0.35, ease: "power1.in" },
        ],
        delay: i * 0.06,
        onComplete: () => el.remove(),
      }
    );
  });
}

function initHero() {
  const btn = $("#btn-hero");
  const tiara = document.getElementById("tiara");
  const cap = document.getElementById("nightcap");
  const tofs = document.getElementById("tofs");
  const layer = btn?.querySelector<HTMLElement>(".hero-accessories");
  if (!btn || !tiara || !cap || !tofs || !layer) return;
  gsap.set(tiara, { transformOrigin: "50% 100%" });
  gsap.set(cap, { transformOrigin: "30% 85%" });
  gsap.set(tofs, { svgOrigin: "112 34" });
  let state = 0;
  let swing: gsap.core.Tween | null = null;
  const CAP_TILT = 10;

  const stopSwing = () => {
    swing?.kill();
    swing = null;
    gsap.set(tofs, { rotation: 0 });
  };

  btn.addEventListener("click", () => {
    state = (state + 1) % 3;
    btn.dataset.state = String(state);
    gsap.killTweensOf([tiara, cap]);

    if (state === 1) {
      // Tiaran faller ner, studsar en gång och landar. Mössan nollställs
      // ifall den avbröts mitt i flygningen av ett snabbt tryck.
      gsap.set(cap, { autoAlpha: 0, y: 0, x: 0, rotation: 0 });
      playGlitter();
      if (reducedMotion) {
        gsap.set(tiara, { autoAlpha: 1, y: 0, rotation: 0 });
        return;
      }
      gsap
        .timeline()
        .fromTo(tiara, { autoAlpha: 1, y: -160, rotation: -12 }, { y: 0, rotation: 0, duration: 0.5, ease: "power2.in" })
        .to(tiara, { y: -16, rotation: 3, duration: 0.14, ease: "power1.out" })
        .to(tiara, { y: 0, rotation: 0, duration: 0.14, ease: "power1.in" })
        .add(() => popSparks(layer))
        .fromTo(tiara.querySelectorAll(".glint"), { opacity: 0.2 }, { opacity: 1, duration: 0.2, stagger: 0.08, repeat: 1, yoyo: true }, "<");
    } else if (state === 2) {
      // Tiaran hoppar upp, nattmössan dalar ner och sätter sig snett
      if (reducedMotion) {
        gsap.set(tiara, { autoAlpha: 0 });
        gsap.set(cap, { autoAlpha: 1, y: 0, x: 0, rotation: CAP_TILT });
        return;
      }
      gsap.to(tiara, { y: -50, autoAlpha: 0, duration: 0.3, ease: "power2.out" });
      gsap
        .timeline({ delay: 0.15 })
        .fromTo(cap, { autoAlpha: 1, y: -140, x: 0, rotation: -8 }, { y: 0, rotation: CAP_TILT + 4, duration: 0.8, ease: "sine.out" })
        .to(cap, { rotation: CAP_TILT, duration: 0.3, ease: "sine.inOut" });
      stopSwing();
      swing = gsap.fromTo(tofs, { rotation: -12 }, { rotation: 12, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true });
    } else {
      // Mössan flyger iväg uppåt ur bild
      stopSwing();
      gsap.set(tiara, { autoAlpha: 0 });
      if (reducedMotion) {
        gsap.set(cap, { autoAlpha: 0 });
        return;
      }
      gsap.to(cap, {
        y: -window.innerHeight,
        x: 60,
        rotation: 50,
        duration: 0.7,
        ease: "power2.in",
        onComplete: () => gsap.set(cap, { autoAlpha: 0, y: 0, x: 0, rotation: 0 }),
      });
    }
  });
}

// ===== CONFETTI =====
function fireConfettiBig() {
  if (reducedMotion) {
    confetti({
      particleCount: 20,
      spread: 60,
      origin: { y: 0.7 },
      disableForReducedMotion: false,
    });
    return;
  }
  const count = 3;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        startVelocity: 35,
        origin: { x: 0.2 + i * 0.3, y: 0.7 },
        colors: ["#F9A8D4", "#FBBF24", "#7C3AED", "#EF4444", "#22C55E"],
      });
    }, i * 400);
  }
}

function fireConfettiSmall() {
  confetti({
    particleCount: reducedMotion ? 5 : 15,
    spread: 40,
    origin: { y: 0.7 },
    colors: ["#94A3B8", "#C4B5FD"],
    gravity: 1.5,
    disableForReducedMotion: false,
  });
}

// ===== RSVP FORM =====
interface StoredRSVP {
  name: string;
  attending: string;
  diet: string;
  phone: string;
  message: string;
}

function initRSVP() {
  const form = $<HTMLFormElement>("#rsvp-form");
  const summary = $("#rsvp-summary");
  const summaryText = $("#summary-text");
  const btnChange = $("#btn-change");
  const fieldName = $<HTMLInputElement>("#field-name");
  const fieldAttending = $<HTMLInputElement>("#field-attending");
  const fieldDiet = $<HTMLTextAreaElement>("#field-diet");
  const fieldPhone = $<HTMLInputElement>("#field-phone");
  const fieldMessage = $<HTMLTextAreaElement>("#field-message");
  const fieldChanged = $<HTMLInputElement>("#form-changed");
  const errorName = $("#error-name");
  const errorAttending = $("#error-attending");
  const btnSubmit = $<HTMLButtonElement>("#btn-submit");
  const submitText = $("#submit-text");
  const spinner = $("#spinner");
  const formStatus = $("#form-status");
  const btnYes = $<HTMLButtonElement>("#btn-yes");
  const btnNo = $<HTMLButtonElement>("#btn-no");

  // Toggle attending buttons
  btnYes.addEventListener("click", () => {
    fieldAttending.value = "ja";
    btnYes.classList.add("active");
    btnNo.classList.remove("active");
    errorAttending.textContent = "";
    playPop();
  });

  btnNo.addEventListener("click", () => {
    fieldAttending.value = "nej";
    btnNo.classList.add("active");
    btnYes.classList.remove("active");
    errorAttending.textContent = "";
    playPop();
  });

  // Check stored answer
  const stored = localStorage.getItem(STORAGE_KEY);
  let isUpdate = false;

  if (stored) {
    try {
      const data: StoredRSVP = JSON.parse(stored);
      showSummary(data);
    } catch {
      // Invalid stored data, show form
    }
  }

  function showSummary(data: StoredRSVP) {
    const attendingText =
      data.attending === "ja" ? "ja" : "nej";
    let text = `Ni har svarat ${attendingText} för ${data.name}`;
    if (data.diet) text += ` \u00b7 ${data.diet}`;
    summaryText.textContent = text;
    summary.hidden = false;
    form.hidden = true;
  }

  btnChange.addEventListener("click", () => {
    summary.hidden = true;
    form.hidden = false;
    isUpdate = true;
    fieldChanged.value = "yes";

    // Prefill
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredRSVP = JSON.parse(stored);
        fieldName.value = data.name;
        fieldAttending.value = data.attending;
        fieldDiet.value = data.diet;
        fieldPhone.value = data.phone;
        fieldMessage.value = data.message;

        if (data.attending === "ja") {
          btnYes.classList.add("active");
          btnNo.classList.remove("active");
        } else if (data.attending === "nej") {
          btnNo.classList.add("active");
          btnYes.classList.remove("active");
        }
      } catch {
        // ignore
      }
    }
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate
    let valid = true;
    if (!fieldName.value.trim()) {
      errorName.textContent = "Skriv barnets namn";
      valid = false;
    } else {
      errorName.textContent = "";
    }

    if (!fieldAttending.value) {
      errorAttending.textContent = "Välj om ni kommer eller inte";
      valid = false;
    } else {
      errorAttending.textContent = "";
    }

    if (!valid) return;

    // Disable & spinner
    btnSubmit.disabled = true;
    submitText.textContent = "Skickar...";
    spinner.hidden = false;
    formStatus.textContent = "";
    formStatus.className = "form-status";

    try {
      const formData = new FormData(form);
      if (!isUpdate) {
        formData.delete("changed");
      }

      const res = await fetch(content.rsvp.endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        // Save to localStorage
        const rsvpData: StoredRSVP = {
          name: fieldName.value.trim(),
          attending: fieldAttending.value,
          diet: fieldDiet.value.trim(),
          phone: fieldPhone.value.trim(),
          message: fieldMessage.value.trim(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rsvpData));

        // Success state
        if (fieldAttending.value === "ja") {
          formStatus.textContent = "Hurra! Vi ses den 13:e!";
          formStatus.className = "form-status success";
          fireConfettiBig();
          playFanfare();
        } else {
          formStatus.textContent = "Synd, men tack för svaret!";
          formStatus.className = "form-status success";
          fireConfettiSmall();
        }

        // Show summary after a moment
        setTimeout(() => {
          showSummary(rsvpData);
        }, 3000);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      formStatus.textContent =
        "Något gick fel \u2013 testa igen om en stund";
      formStatus.className = "form-status error";
    } finally {
      btnSubmit.disabled = false;
      submitText.textContent = "Skicka svar";
      spinner.hidden = true;
    }
  });
}

// ===== INIT =====
function init() {
  initGreeting();
  createStars();
  populateContent();
  initAnimations();
  initSignpost();
  initHero();
  initPizza();
  initCake();
  initPopcorn();
  initMuteToggle();
  initAudioUnlock();
  initRSVP();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
