# Werkwoorden 📚

Een kleine **PWA** (Progressive Web App) om de verleden tijden van Nederlandse
sterke en zwakke werkwoorden te oefenen. Ontworpen voor mobiel — werkt uitstekend
op een iPhone en kan als app op je beginscherm worden geplaatst.

## Wat doet het?

1. Kies hoeveel werkwoorden en wat je wil oefenen (o.v.t., voltooid deelwoord, of beide).
2. De app toont telkens een infinitief; typ de gevraagde verleden tijd(en).
3. Bij een fout krijg je **één extra poging**. Bij de tweede fout toont de app het juiste antwoord.
4. Op het einde krijg je een **overzicht van je fouten** en een **toffe score** met commentaar.

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
| `index.html` | UI (start, quiz, resultaat) |
| `style.css` | Mobile-first styling |
| `app.js` | Quiz-logica (2 pogingen, score, fouten) |
| `werkwoorden.json` | Lijst met werkwoorden |
| `manifest.webmanifest` | PWA-manifest |
| `sw.js` | Service worker (offline gebruik) |
| `icons/` | App-iconen (192, 512, maskable) |