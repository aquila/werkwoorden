# Werkwoorden 📚

Een kleine **PWA** (Progressive Web App) om de verleden tijden van Nederlandse
sterke en zwakke werkwoorden te oefenen. Ontworpen voor mobiel — werkt uitstekend
op een iPhone en kan als app op je beginscherm worden geplaatst.

## Wat doet het?

1. Kies hoeveel werkwoorden en wat je wil oefenen (o.v.t., voltooid deelwoord, of beide).
2. De app toont telkens een infinitief; typ de gevraagde verleden tijd(en).
3. Bij een fout krijg je **één extra poging**. Bij de tweede fout toont de app het juiste antwoord.
4. Op het einde krijg je een **overzicht van je fouten** en een **toffe score** met commentaar.

## 🇫🇷 Franse werkwoorden

Er is ook een aparte pagina om de vervoeging (présent) van de meest courante
onregelmatige Franse werkwoorden te oefenen — open [`frans.html`](./frans.html)
of gebruik de link op de startpagina.

- Je krijgt een Nederlands werkwoord (bv. *willen*), de Franse infinitief
  (*vouloir*) en een persoon (bv. *tu* — 2e persoon enkelvoud) te zien en typt
  de juiste vervoeging (*veux*).
- De vragen dekken alle zes personen (je / tu / il‑elle / nous / vous / ils‑elles).
- Dezelfde regels: **twee pogingen**, en bij een fout krijg je meteen de
  **volledige vervoegingstabel** te zien.
- De lijst staat in [`frans.json`](./frans.json) — elk werkwoord bevat de
  Nederlandse betekenis, de Franse infinitief en alle zes vormen van de présent.

## Lokaal draaien

Omdat de app `fetch` en een service worker gebruikt, moet je hem via een
webserver openen (niet als `file://`).

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Op een iPhone installeren

1. Open de app in **Safari**.
2. Tik op het deelicoon → **Zet op beginscherm**.
3. Start de app vanaf je beginscherm — hij draait fullscreen en werkt offline.

## Werkwoorden aanpassen

De lijst staat in [`werkwoorden.json`](./werkwoorden.json). Elk werkwoord heeft:

```json
{ "infinitief": "lopen", "type": "sterk", "ovt_ev": "liep", "ovt_mv": "liepen", "vd": "gelopen" }
```

Meerdere geldige antwoorden mogen gescheiden worden met `/` of `,`
(bijv. `"vd": "gewild/gewenst"`).

## Bestanden

| Bestand | Rol |
|---|---|
| `index.html` | UI Nederlandse werkwoorden (start, quiz, resultaat) |
| `frans.html` | UI Franse werkwoorden (start, quiz, resultaat) |
| `style.css` | Mobile-first styling (gedeeld) |
| `app.js` | Quiz-logica NL (2 pogingen, score, fouten) |
| `frans.js` | Quiz-logica FR (2 pogingen, volledige vervoegingstabel bij fout) |
| `werkwoorden.json` | Lijst met Nederlandse werkwoorden |
| `frans.json` | Lijst met Franse onregelmatige werkwoorden + présent-vervoeging |
| `manifest.webmanifest` | PWA-manifest |
| `sw.js` | Service worker (offline gebruik) |
| `icons/` | App-iconen (192, 512, maskable) |