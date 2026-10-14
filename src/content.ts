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
