# Nexia Virtual Desk — MSME & GeM Registration Data Collection

A production-ready, mobile-first **static web application** for collecting customer
data for **MSME Registration** and **GeM Registration** services operated by
**Nexia Virtual Desk, Olarikkara, Thrissur**.

Built with pure **HTML5, CSS3 and Vanilla JavaScript** — no frameworks, no build
step, no backend. Designed to be deployed directly on **Vercel** from a
**GitHub** repository.

---

## Project structure

```text
/
├── index.html          # Page markup (semantic, accessible)
├── css/
│   └── style.css       # Complete design system (tokens, glassmorphism, responsive)
├── js/
│   └── app.js          # App logic (validation, localStorage, TXT download, WhatsApp)
├── assets/             # (optional) static assets
└── README.md
```

## Features

- **Service selection** — MSME only, GeM only, or Both (MSME + GeM), with animated
  selectable cards.
- **Bilingual labels** — Every field uses the `English (മലയാളം)` format.
- **Automatic browser save** — All data is saved to `localStorage` under the key
  `nexia_registration_form_v1` and restored automatically on refresh.
  A status chip shows **“Ready to collect details”** or **“✓ Saved in this browser”**.
  Data never leaves the browser; no server, database, analytics or tracking is used.
- **Smart inputs** — Live formatting for Aadhaar (12 digits), PAN (auto uppercase),
  IFSC (auto uppercase), mobile (10 digits), PIN (6 digits), GSTIN (15 chars).
  Employee total is calculated instantly (Male + Female, negatives blocked).
- **Conditional GSTIN** — Shown only when “Yes” is selected.
- **Inline validation** — Required fields and pattern checks with friendly messages;
  smooth scroll to the first invalid field. No browser alerts.
- **Download Details** — Generates a clean `.txt` summary with section headings and a
  filename like `MSME_GeM_CustomerName_20-06-2026.txt`.
- **Send via WhatsApp** — Opens a professionally formatted, URL-encoded message to
  **+91 9961850698** (`wa.me`) only after the user taps the button.
- **Reset Form** — Custom confirmation dialog (no `alert()` / `confirm()`), clears all
  inputs, selections and the saved localStorage data.
- **Nexia promotional card** — “16 Years of Experience” branded card at the bottom
  with a WhatsApp CTA to the same number.
- **Accessibility** — Semantic HTML, `label for`/`id` pairing, keyboard-friendly
  custom radio/checkbox controls, visible focus states, `aria-live` status regions,
  `autocomplete` and correct `inputmode` attributes.
- **Fully responsive** — Tested layouts from 320 px phones up to desktop, with no
  horizontal scrolling.

## Deploying to Vercel (GitHub + Vercel)

1. Create a GitHub repository and push this project:

   ```bash
   git init
   git add .
   git commit -m "Nexia Virtual Desk MSME & GeM data collection app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com), sign in, and click **Add New → Project**.
3. Import your GitHub repository.
4. Framework Preset: **Other**. Build Command: leave empty. Output Directory: leave
   empty. Click **Deploy**.

The site is a fully static site — no build or environment variables are required.

## Local testing

No tooling is required. Simply open `index.html` in a browser, or serve the folder:

```bash
# any static server works, e.g.
npx serve .
```

## Data storage note

Form data is stored **only in this browser** via `localStorage` and is used solely to
restore the form after a refresh. It is not encrypted, not sent anywhere, and is
permanently removed when the user taps **Reset Form** and confirms.

## Contact

**Nexia Virtual Desk**
Olarikkara, Thrissur
Online Applications | CV Creation | Document Processing | Printing & Scanning
Since 2009 · WhatsApp: +91 9961850698
