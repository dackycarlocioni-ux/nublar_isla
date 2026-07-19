# Sito compleanno — Parco Giurassico

Sito statico (HTML/CSS/JS puri) protetto da un token nel link, pensato per
essere raggiunto solo tramite QR code. Il controllo accessi è fatto da una
Cloudflare Pages Function (`functions/_middleware.js`) — niente backend,
niente database.

```
jurassic-party/
├── public/                 <- il sito vero e proprio
│   ├── index.html
│   ├── style.css
│   └── script.js
├── functions/
│   └── _middleware.js       <- gate d'accesso (gira su ogni richiesta)
└── wrangler.toml
```

## 1. Personalizza i contenuti

Tutto quello da modificare è in cima a **`public/script.js`**, nell'oggetto
`CONFIG`:

```js
const CONFIG = {
  honoreeName: "...",
  age: "...",
  partyDateISO: "2026-09-12T16:00:00",
  address: "...",
  mapsUrl: "...",
  rsvpUrl: "...",
};
```

Il resto dei testi (orari del "Log del Ranger", regole del parco, ecc.) è
scritto direttamente in **`public/index.html`** — cerca i commenti
`MODIFICA QUI` e le scritte tra parentesi quadre `[...]`.

## 2. Deploy su Cloudflare Pages

**Opzione dashboard (più semplice, nessun tool da installare):**

1. Crea un repo Git (GitHub/GitLab) con questi file e fai push.
2. Su [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
   → **Create** → **Pages** → **Connect to Git**, seleziona il repo.
3. Build settings:
   - Framework preset: `None`
   - Build command: *(vuoto)*
   - Build output directory: `public`
4. Deploy. Cloudflare rileva automaticamente `functions/_middleware.js`.

**Opzione CLI (wrangler):**

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy public --project-name=jurassic-party
```

## 3. Imposta i due secret (obbligatorio)

Senza questi due valori il sito risponde sempre con errore 500 — è
voluto, per non lasciare mai il gate "aperto per sbaglio".

```bash
openssl rand -hex 24   # esegui due volte, uno per ciascun secret
```

Poi, dalla dashboard del progetto Pages → **Settings → Environment
variables**, aggiungi come **secret** (non variabile normale), sia per
Production che per Preview:

- `PARTY_TOKEN` → il primo valore generato (questo va nel link/QR code)
- `SESSION_SECRET` → il secondo valore (resta sempre segreto, non va condiviso)

Oppure via CLI:

```bash
wrangler pages secret put PARTY_TOKEN --project-name=jurassic-party
wrangler pages secret put SESSION_SECRET --project-name=jurassic-party
```

## 4. Genera il link e il QR code

Il link da mettere nel QR code è:

```
https://jurassic-party.pages.dev/?key=IL_VALORE_DI_PARTY_TOKEN
```

(sostituisci il dominio con quello reale assegnato da Cloudflare, o il tuo
dominio custom se lo colleghi).

Per generare il QR code, la via più rapida è un generatore online (es.
cerca "QR code generator" e incolla il link) oppure, se hai Python:

```bash
pip install qrcode[pil]
python3 -c "import qrcode; qrcode.make('https://jurassic-party.pages.dev/?key=IL_TUO_TOKEN').save('invito.png')"
```

Chi inquadra il QR code entra, riceve un cookie firmato valido 30 giorni
(modificabile in `COOKIE_MAX_AGE_DAYS` dentro `_middleware.js`) e da quel
momento può tornare sul sito senza reinserire il token. Chi prova ad
accedere senza il token vede semplicemente una pagina 404.

## 5. Test in locale (opzionale)

```bash
wrangler pages dev public
```

Ricorda che in locale devi comunque passare `PARTY_TOKEN` e
`SESSION_SECRET` come variabili d'ambiente, es.:

```bash
wrangler pages dev public --binding PARTY_TOKEN=test123 --binding SESSION_SECRET=abc456
```

## Note

- Il sito non usa librerie esterne oltre ai font Google (Oswald, Space
  Mono) caricati via `<link>` in `index.html` — se vuoi zero dipendenze
  esterne, scarica i font e servili da `public/assets/`.
- Nessun dato personale viene salvato da nessuna parte: il cookie contiene
  solo una scadenza firmata, non identifica la persona.
- Per revocare l'accesso a tutti prima della festa, basta rigenerare
  `SESSION_SECRET`: tutti i cookie già emessi diventano invalidi e serve
  di nuovo il link con il token.
