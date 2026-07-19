/**
 * Cloudflare Pages Function — gate d'accesso per l'intero sito.
 *
 * Come funziona:
 * 1. Il link nel QR code è tipo:  https://tuosito.pages.dev/?key=IL_TUO_TOKEN
 * 2. Se il parametro "key" combacia con il secret PARTY_TOKEN, viene creato un
 *    cookie firmato (HMAC-SHA256) e l'utente viene rimandato all'URL pulito
 *    (senza il token in giro nella barra degli indirizzi/cronologia).
 * 3. Le richieste successive (pagina, css, js, immagini) passano perché il
 *    cookie firmato è valido — niente bisogno di reinserire il token.
 * 4. Chi arriva senza token valido e senza cookie riceve una 404 generica:
 *    il sito sembra "non esistere" invece di mostrare un blocco sospetto.
 *
 * Variabili da impostare come SECRET nel progetto Cloudflare Pages
 * (Settings → Environment variables → Add secret), sia per Production
 * che per Preview:
 *   - PARTY_TOKEN     -> la stringa segreta che metti nel link/QR code
 *   - SESSION_SECRET   -> un'altra stringa segreta, lunga e casuale,
 *                          usata solo per firmare il cookie
 *
 * Generale entrambe con qualcosa tipo:
 *   openssl rand -hex 24
 */

const COOKIE_NAME = "jp_access";
const COOKIE_MAX_AGE_DAYS = 30;

export const onRequest = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (!env.PARTY_TOKEN || !env.SESSION_SECRET) {
    return new Response(
      "Configurazione mancante: imposta i secret PARTY_TOKEN e SESSION_SECRET nel progetto Cloudflare Pages.",
      { status: 500 }
    );
  }

  // 1. Cookie di sessione già valido? Lascia passare.
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const existingSession = cookies[COOKIE_NAME];
  if (existingSession && (await isValidSession(existingSession, env.SESSION_SECRET))) {
    return next();
  }

  // 2. Token nel link corretto? Crea la sessione e ripulisci l'URL.
  const providedKey = url.searchParams.get("key");
  if (providedKey && timingSafeEqual(providedKey, env.PARTY_TOKEN)) {
    const expiresAt = Date.now() + COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const sessionValue = await createSession(expiresAt, env.SESSION_SECRET);

    url.searchParams.delete("key");
    const response = new Response(null, {
      status: 302,
      headers: { Location: url.toString() },
    });
    response.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${
        COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
      }`
    );
    return response;
  }

  // 3. Nessun accesso valido: risposta 404 generica, il sito resta "invisibile".
  return new Response(NOT_FOUND_HTML, {
    status: 404,
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
};

// ---------- helpers ----------

function parseCookies(header) {
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = value;
  });
  return out;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmac(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return base64url(new Uint8Array(sig));
}

function base64url(bytes) {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createSession(expiresAt, secret) {
  const payload = String(expiresAt);
  const signature = await hmac(secret, payload);
  return `${payload}.${signature}`;
}

async function isValidSession(cookieValue, secret) {
  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return false;

  const expected = await hmac(secret, payload);
  if (!timingSafeEqual(signature, expected)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

const NOT_FOUND_HTML = `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><title>404</title></head>
<body style="background:#0b0e08;color:#8a8a7a;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>404 — pagina non trovata</p>
</body>
</html>`;
