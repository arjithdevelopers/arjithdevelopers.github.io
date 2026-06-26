# Arjith Property Developers — Site Modernization Plan

## 1. Context & goal
The current site (`/legacy`, © 2013) is a table/jQuery-era PHP brochure: tiny images, broken
links, plagiarised placeholder testimonials, PHP forms that **cannot run on GitHub Pages**, and a
visual style that undercuts a premium real-estate brand. We are rebuilding it as a single, modern,
**static `index.html`** whose job is to make a prospective buyer feel **trust and confidence** and
then **enquire** about a project — primarily the flagship **Arjith Allure**. We will also instrument
the site so the owner can see traffic and **which projects attract the most interest**.

## 2. Success metrics
- **Trust signals above the fold:** Since 1999, engineer-led, clear title, DTCP/Municipal approved, on-time delivery.
- **Conversion:** every project and the hero offer a 1-tap **WhatsApp / Call / Enquire** path.
- **Insight:** GA4 reports per-project interest (views, gallery opens, enquiry/WhatsApp/call clicks).
- **Quality bar:** Lighthouse ≥ 90 across Performance / SEO / Best-Practices / Accessibility; mobile-first; WCAG AA contrast.

## 3. Decisions locked (from kickoff Q&A)
| Topic | Decision |
|---|---|
| Lead capture | **WhatsApp + Call buttons + an email-backed enquiry form** (Web3Forms → `arjithproperty@gmail.com`) |
| Project data | **Qualitative only** — name, location, unit type, highlights, status. **No prices/possession dates** until client verifies. CTA = "Enquire for price". |
| Analytics | **GA4** with a **placeholder Measurement ID** + custom **per-project interest events** |
| Design tone | **Luxury & bold** — dark, high-contrast, gold accents, cinematic imagery |
| Hosting | Static, GitHub Pages, single `index.html` (legacy kept as archive) |

## 4. Open items — needed from client before go-live
These are **placeholders** in the build; the site must not publish unverified facts.
1. **Current contact** — legacy says *AA-32, Tennur*; listing portals say *C-38, 7th Cross, Thillai Nagar, Trichy-18, Ph 0431-2741771*. Which is current?
2. **WhatsApp number** (for `wa.me` link) and primary **call number** (legacy: 90471 86510 / 98424 76510).
3. **Email** — confirm `arjithproperty@gmail.com` (decoded from the legacy site's obfuscated markup).
4. **Arjith Allure facts** — exact location (portals: *Edamalaipatti Pudur, near airport*), unit types/sizes, current status, RERA/DTCP number, approvals, and whether any price may be shown.
5. **Per completed project** — location, completion year, 1-line description (Villa, Aishwaryam, Elita, Ambience, Aristocrat, Apex, Akshayam, Arunodhaya).
6. **High-resolution photography & renders** — legacy images are thumbnails (190px–800px), too small for a luxury full-bleed layout. Also a **high-res logo** and a **brand color** if one exists.
7. **GA4 Measurement ID** (`G-XXXXXXXXXX`) — or I leave the placeholder for the owner to paste.
8. **Web3Forms access key** (free; tied to `arjithproperty@gmail.com`) for the enquiry form backend.
9. **Real testimonials** (the legacy "Ashiana…" quotes are copied from another company and **will not be reused**).
10. **Google Maps** location / embed for the office or site.

## 5. Information architecture — single-page `index.html`
Sticky transparent→solid nav. Anchored sections, in order:
1. **Hero** — cinematic full-bleed image, brand line ("Homes engineered to be lived in, and trusted."), primary CTAs (Enquire / WhatsApp), subtle scroll cue.
2. **Trust band** — animated stat row: *Est. 1999 · 25+ years · 9 projects delivered · Engineer-led · Clear title*.
3. **Flagship: Arjith Allure** — large showcase: gallery/lightbox (elevation, floor plan, key plan), location, highlights, amenities chips, **per-project Enquire/WhatsApp**.
4. **Completed projects** — filterable grid (location filter), modern lightbox replacing fancybox; each card has its own Enquire.
5. **Why Arjith** — clear-title, 100% Vaastu, engineer-supervised, best materials, on-time delivery.
6. **About / Founder** — Er. V. Gouthaman (B.E., Anna University; structural consultant) + architect S. Subramanian; credibility-forward.
7. **Testimonials** — real quotes (placeholder structure until supplied).
8. **Contact / Enquire** — WhatsApp + Call + form + address + map.
9. **Footer** — nav, contact, RERA/approvals line, copyright, privacy.

## 6. Content plan
- Reuse the **verified** legacy copy: founding story (1999, Gouthaman), positioning (clear title, ethical, Vaastu, on-time), team.
- Project entries use the **qualitative model**: `Name · Status badge (Ongoing/Completed) · Location · Unit type · Amenities · "Enquire for price"`. No numeric price/date until item #4/#5 confirmed.
- Research is used only to *prompt* client confirmation, never published as fact unverified.
- Remove plagiarised testimonials; gate the section on real ones.

## 7. Design system — "Luxury & bold" (built with `ui-ux-pro-max` + `impeccable`)
**Palette (dark, high-contrast, gold):**
- Background `#0E0E10`, Surface `#1A1A1F`, Hairline `#2A2A30`
- Accent (champagne gold) `#C9A24B`, gold-bright `#E3C271`
- Text ivory `#F4F1EA`, muted `#A9A39B` (gold-on-bg ≈ 7:1, AA-pass for text)

**Typography:**
- Display/headings: high-contrast serif — **Playfair Display** (or Cormorant Garamond).
- Body/UI: clean grotesque — **Inter** (or Manrope). Letter-spaced small-caps for labels.

**Language & motion (via `impeccable`):** full-bleed imagery with gradient scrims, gold hairline
dividers, large stat numerals, asymmetric editorial grid, image hover-zoom, scroll-reveal
(IntersectionObserver, `prefers-reduced-motion` respected), sticky mobile CTA bar, modern
accessible lightbox (keyboard + focus-trap) replacing fancybox.

> During build, `ui-ux-pro-max` supplies the finalized palette/font-pairing/UX checklist and
> `impeccable` drives production-grade craft, motion, and polish.

## 8. Lead capture & CTAs
- **WhatsApp:** `https://wa.me/<number>?text=` pre-filled per project (e.g. "Hi, I'm interested in Arjith Allure").
- **Call:** `tel:+91…`.
- **Enquiry form:** **Web3Forms** (no dashboard, just an access key; emails each lead). Fields mirror the legacy form: Name, Email, Phone, **Project of interest** (select), Message. Hidden `project` auto-filled when "Enquire" is clicked on a card. Inline validation, honeypot spam trap, success/error states, no page reload (fetch).
- Sticky mobile bottom bar: **WhatsApp · Call · Enquire**.

## 9. Google Analytics (GA4) plan
- GA4 via `gtag.js` with **placeholder `G-XXXXXXXXXX`** (owner swaps in, or pastes now).
- Enable **Enhanced Measurement** (scroll, outbound clicks).
- **Custom events for project interest:**
  | Event | Params | Fires when |
  |---|---|---|
  | `view_project` | `project_name`, `project_status` | card scrolls into view (IntersectionObserver) |
  | `open_gallery` | `project_name` | lightbox opened |
  | `cta_whatsapp_click` | `project_name`, `location` | WhatsApp tapped |
  | `cta_call_click` | `project_name`, `location` | Call tapped |
  | `enquiry_form_start` | `project_name` | first field focused |
  | `enquiry_submit` | `project_name` | form submitted |
- Register `project_name` / `project_status` as **custom dimensions** so reports break down interest by project. Doc a one-page "how to read it" note for the owner.

## 10. Technical architecture
- **Stack:** hand-built static HTML/CSS/vanilla-JS. **No jQuery** (drop the 4 legacy libs). Progressive enhancement; works without JS for content.
- **Structure:**
  ```
  index.html
  assets/css/styles.css
  assets/js/main.js          (nav, lightbox, scroll-reveal, form, GA events)
  assets/img/…               (optimized WebP + JPG fallback, responsive srcset)
  favicon, assets/img/og-cover.jpg
  robots.txt, sitemap.xml
  legacy/…                   (kept as archive)
  ```
- **Performance:** optimize/convert images (WebP, sized variants, `loading="lazy"`, width/height to avoid CLS), preconnect fonts, defer JS, system-font fallback.
- **SEO:** title/meta description, Open Graph + Twitter cards, `LocalBusiness`/`RealEstateAgent` JSON-LD (name, address, phone, geo), canonical, semantic headings.
- **Accessibility:** landmarks, alt text, keyboard nav, focus-visible, AA contrast, reduced-motion, labelled form fields.
- **Responsive:** mobile-first 360 → 1440px.
- **Repo hygiene / deploy:** add `.gitignore` (`.claude/`, `skills-lock.json`); add `.nojekyll` (or `_config.yml`) so asset folders serve cleanly and `legacy/` isn't Jekyll-processed; if the brand keeps `arjithdevelopers.com`, add a `CNAME`.

## 11. Asset migration
- **Keep & optimize** the best legacy images (elevations/floor plans for Allure, Akshayam, Apex; project façades). Catalogue them to project entries.
- **Flag for replacement:** anything < ~800px wide won't hold up full-bleed — request high-res (item #6). Interim: tasteful framed/contained treatment rather than stretched full-bleed.
- **Drop:** sprite/jQuery/fancybox assets, "send your enquiry" GIF, helpline/home/mail PNG chrome.

## 12. Build phases
- **P0 — Confirm open items (§4).** Scaffold with placeholders where answers pending.
- **P1 — Foundation:** tokens (CSS vars), fonts, reset, sticky nav, footer, section skeleton.
- **P2 — Hero + trust band + Why/About** (verified copy).
- **P3 — Flagship Allure showcase + accessible lightbox.**
- **P4 — Completed-projects grid + filter.**
- **P5 — Lead capture:** WhatsApp/call, Web3Forms form, per-card Enquire wiring, sticky mobile bar.
- **P6 — GA4 + event instrumentation** (§9).
- **P7 — SEO/meta/OG/JSON-LD/sitemap/favicon; a11y pass; image optimization; responsive QA.**
- **P8 — Verification & deploy** (§13), `.gitignore`/`.nojekyll`/`CNAME`.

`ui-ux-pro-max` and `impeccable` are used across P1–P5.

## 13. Verification
- **Local preview** the page; visual QA at 360 / 768 / 1024 / 1440.
- **Lighthouse** (target ≥ 90 each); fix CLS/LCP regressions.
- **Lead paths:** WhatsApp + Call links open correctly on a phone; submit the form and confirm the email lands in the inbox; verify per-project pre-fill.
- **GA4 DebugView:** confirm `view_project`, `open_gallery`, CTA, and `enquiry_submit` events fire with correct `project_name`.
- **A11y:** keyboard-only nav + lightbox focus-trap; contrast; reduced-motion; HTML validation; all links/images resolve (case-sensitive).

## 14. Risks & mitigations
- **Unverified facts** → qualitative content + client sign-off (handles RERA/trust risk).
- **Low-res imagery** → request high-res; contained treatment as interim; never upscale-blur a hero.
- **Plagiarised testimonials** → removed; section gated on real quotes.
- **Form spam** → honeypot + Web3Forms filtering.
- **Wrong contact info** → blocked on item #1–#3 confirmation before launch.

## 15. Out of scope (future)
Multi-page project detail pages, CMS, blog, dynamic listings, multilingual (Tamil), automated lead CRM —
revisit after the static launch proves interest via GA4.
