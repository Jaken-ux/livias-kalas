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
    const safe = g.slice(0, 30).replace(/[<>&"'/]/g, "");
    const el = $("#greeting");
    if (el) el.textContent = `Hej ${safe}!`;
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
        "Kalaset har varit – tack för att du kom!";
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

  const toggle = () => {
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
  return audioCtx;
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

  const update = () => {
    iconOn.hidden = isMuted;
    iconOff.hidden = !isMuted;
  };
  update();

  btn.addEventListener("click", () => {
    isMuted = !isMuted;
    localStorage.setItem(MUTE_KEY, String(isMuted));
    update();
    if (!isMuted) playPop();
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
    let text = `Du har svarat ${attendingText} för ${data.name}`;
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
      errorAttending.textContent = "Välj om du kommer eller inte";
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
  initMuteToggle();
  initRSVP();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
