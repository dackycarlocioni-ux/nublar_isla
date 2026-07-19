// ============================================================
// CONFIGURAZIONE — modifica solo questa sezione
// ============================================================
const CONFIG = {
  honoreeName: "[NOME DELL'AMICO]",
  age: "[XX]",
  // Data e ora della festa, formato ISO: "YYYY-MM-DDTHH:MM:SS"
  partyDateISO: "2026-09-12T16:00:00",
  address: "[Nome del locale / indirizzo]",
  mapsUrl: "https://maps.google.com/?q=", // incolla qui il link di Google Maps
  rsvpUrl: "https://wa.me/393331234567?text=Ci%20sono!", // link WhatsApp, sms:, o mailto:
};

// ============================================================
// APPLICA LA CONFIGURAZIONE AL DOM
// ============================================================
document.getElementById("honoree").textContent = CONFIG.honoreeName;
document.getElementById("age").textContent = `${CONFIG.age} anni`;
document.getElementById("address").textContent = CONFIG.address;
document.getElementById("map-link").href = CONFIG.mapsUrl;
document.getElementById("rsvp-link").href = CONFIG.rsvpUrl;

// ============================================================
// SEQUENZA DI BOOT DEL TERMINALE
// ============================================================
const bootLines = [
  "INGEN SECURITY SYSTEM — TERMINALE DI ACCESSO",
  "connessione stabilita...",
  "verifica credenziali...",
  { text: "ACCESSO CONCESSO", cls: "amber" },
  `benvenuto/a. avvio protocollo festa per ${CONFIG.honoreeName}...`,
];

const bootScreen = document.getElementById("boot-screen");
const bootLog = document.getElementById("boot-log");
const site = document.getElementById("site");
const skipBtn = document.getElementById("skip-boot");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const alreadySeen = sessionStorage.getItem("jp_boot_seen");

function revealSite() {
  bootScreen.remove();
  site.hidden = false;
  startCountdown();
}

async function runBoot() {
  if (prefersReducedMotion || alreadySeen) {
    revealSite();
    return;
  }
  sessionStorage.setItem("jp_boot_seen", "1");

  for (const line of bootLines) {
    const text = typeof line === "string" ? line : line.text;
    const cls = typeof line === "string" ? null : line.cls;
    await typeLine(text, cls);
    await wait(220);
  }
  await wait(500);
  revealSite();
}

function typeLine(text, cls) {
  return new Promise((resolve) => {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    bootLog.appendChild(span);
    const caret = document.createElement("span");
    caret.className = "caret";
    bootLog.appendChild(caret);

    let i = 0;
    const speed = 18;
    const timer = setInterval(() => {
      span.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        caret.remove();
        bootLog.appendChild(document.createTextNode("\n"));
        resolve();
      }
    }, speed);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

skipBtn.addEventListener("click", () => {
  sessionStorage.setItem("jp_boot_seen", "1");
  revealSite();
});

runBoot();

// ============================================================
// COUNTDOWN
// ============================================================
function startCountdown() {
  const target = new Date(CONFIG.partyDateISO).getTime();
  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");
  const caption = document.getElementById("countdown-caption");

  if (Number.isNaN(target)) return;

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      caption.textContent = "il contenimento è fallito. la festa è iniziata.";
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minsEl.textContent = String(mins).padStart(2, "0");
    secsEl.textContent = String(secs).padStart(2, "0");

    requestAnimationFrame(() => setTimeout(tick, 1000));
  }
  tick();
}
