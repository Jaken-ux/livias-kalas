export const content = {
  child: { name: "Livia", age: 8 },
  party: {
    kind: "Pyjamas- och filmmyskalas",
    dateISO: "2026-11-13",
    dateText: "Fredag 13 november",
    start: "17:00",
    end: "19:30",
    where: "Hemma hos oss",
    street: "Kardemummagränd 20",
    postal: "135 36 Tyresö",
    mapsQuery: "Kardemummagränd 20, 135 36 Tyresö",
    program: ["Pizza till middag", "Filmmys i pyjamas", "Tårta"],
    dresscode: "Kom i pyjamas!" as string | null,
    gifts: null as string | null,
    contact:
      "Frågor? Ring eller sms:a Jacob, 070-355 35 29" as string | null,
  },
  rsvp: {
    deadlineISO: "2026-11-10",
    deadlineText: "Svara senast tisdag 10 november",
    endpoint: "https://formspree.io/f/xaeqprpb",
    subject: "Livias kalas – OSA",
  },
  site: {
    title: "Livia fyller 8 – du är bjuden!",
    repoName: "livias-kalas",
  },
};

// Texter och länkar som ska synas även utan JS. En enda källa: vite.config.ts
// fyller i dem i index.html vid bygget, och populateContent() i main.ts sätter
// samma värden i webbläsaren. Nyckel = element-id i index.html.
export function staticText(c = content): Record<string, string> {
  const p = c.party;
  return {
    "ticket-date": p.dateText,
    "ticket-time": `Kl ${p.start} – ${p.end}`,
    "ticket-dresscode": p.dresscode ?? "",
    "address-street": p.street,
    "address-postal": p.postal,
    "beat-pizza-text": p.program[0],
    "beat-movie-text": p.program[1],
    "beat-cake-text": p.program[2],
    "gifts-line": p.gifts ?? "",
    "contact-line": p.contact ?? "",
    "rsvp-deadline": c.rsvp.deadlineText,
    "outro-see-you": `Vi ses den ${Number(p.dateISO.slice(8, 10))}:e!`,
  };
}

export function staticHref(c = content): Record<string, string> {
  const q = encodeURIComponent(c.party.mapsQuery);
  return {
    "btn-google-maps": `https://www.google.com/maps/search/?api=1&query=${q}`,
    "btn-apple-maps": `https://maps.apple.com/?q=${q}`,
  };
}
