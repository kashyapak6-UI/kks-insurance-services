# KKS v2 — design research (studied 15 Nov 2026, headless Chrome 1440×900)

Method: Playwright + headless Chrome, slow wheel-scroll through each homepage, a screenshot about every 1,000 px
(`research-shots/<site>-NN.png`, contact sheets in `research-shots/_sheet-<site>.jpg`), then computed
styles, fonts, colours, sticky/fixed elements, running Web Animations, canvas/video counts and loaded scripts
(raw dump: `research-raw.json`). All four are Next.js (Turbopack) builds. None exposes GSAP, Lottie, Lenis or
Three.js as a global: their motion is CSS keyframes, scroll-driven/`position: sticky` layouts, canvas and video.
Only the patterns are reused here, not their logos, copy, images or code.

## Mercury (mercury.com): premium dark banking
- **Layout:** full-bleed hero photo with a centred headline and two pill CTAs. Scrolling zooms into a **laptop showing
  the product dashboard**, which fills the screen on a sticky stage. Next comes a sticky "everything in one place" block:
  a list on the left, and the matching product panel on the right changes as you scroll.
- **Theme switching on scroll:** the background goes dark (#272735, then #171721) → warm off-white (#F6F5F2/#FBFCFD) for the
  feature-card grid → back to dark (#171721) for the press, CTA and footer. The nav stays dark the whole way.
- **Type:** custom grotesk "Arcadia Display/Text" (weights 360–480), with **Tiempos Headline (italic)** serif fonts loaded
  for editorial contrast. Light weights and lots of air.
- **Colour:** ink, lavender-grey text (#EDEDF3, #C3C3CC), and a single **periwinkle accent #5266EB** for primary buttons.
- **Motion:** CSS keyframes `translateUp`, `fadeIn`, `fadeOutBlur` and tab cross-fades; 5 `<video>` and 1 `<canvas>`
  (a particle/beam column visual); a logo row; press logos in dark tiles.

## Ramp (ramp.com): bold and punchy
- **Layout:** white hero with a huge two-line headline ("X. Y."), an email field joined to a **lime button**, and
  a **product-UI collage** beneath (cards, tables, a receipt). A customer logo grid follows, then sections that alternate
  between white and warm grey (#F4F3EF-ish), each with a 2-line headline whose second line is grey. Large sticky stages
  hold UI illustrations that assemble as you scroll ("Systems that never spoke" → "Now sing together"). The
  final CTA and the footer are **black**.
- **Type:** a single grotesk, **Lausanne, weight 400 only**, set big (64 px H1, 48 px H2) with tight tracking. Hierarchy
  comes from size and grey, not weight.
- **Colour:** near-black ink, white, warm grey, and a **lime accent** (lab(92 −20 85) ≈ #E4F222) on the CTAs and promo bar.
- **Motion:** ~5,500 transformed nodes; 9 canvases (UI and illustration animation); a ticker (`ticker-item`) marquee;
  a sticky full-height stage under the fixed nav; UI cards slide in and stack.

## Corgi (corgi.com): insurance, warm and product-led
- **Layout:** cream (#FFFAF7) page with a hairline vertical grid frame. A centred 2-line headline sits above an
  illustrated hero, then a **logo carousel** (`logo-scroll` keyframe), a **bento grid of product cards** with
  illustrated objects, a dark (#191918) "Built to serve at scale" stat block, and **"Claims From Start to Finish":
  a 3-step numbered product demo** (1. report → 2. coordinate → 3. resolve). Each step is a real-looking UI card:
  a form with a submit button, a chat input, and a timeline Reported → Reviewed → Approved → Paid. Last come a testimonial
  carousel, a press marquee (`pressScroll`), and a **giant brand wordmark in the footer**.
- **Type:** Geist (sans, 400/500) for UI and body, **F37 Bolton** (a warm grotesk) for headings.
- **Colour:** cream, warm greys (#F2ECE7, #E4DFDA), charcoal text (#272625), and a single **safety orange #FF5C00** for CTAs.
- **Motion:** gentle CSS marquees, sticky header, and a banner. Restrained: the demo cards do the storytelling.

## Oscar (hioscar.com): editorial warmth
- **Layout:** full-bleed photo hero with a **huge serif headline** (120 px). A CSS `hero-wordmark-out` / `hero-content-in`
  intro and a scroll-scrubbed sticky hero (`hero-scrub:sticky`) lead into a **cream paper (#F7F5EB)** page. Sections open
  with small mono labels ("Member benefits", "For Employers"), then a big serif H2 with an **italic accent word**
  ("for *Spanish speakers*", "You're *this* close"). A **numbered card gallery** follows, then pastel colour-block cards
  (butter #FFDF99, aqua #C6E8E8, lilac #B9BAFF, orange #FF9747). The testimonial wall is a staggered grid of tinted quote
  cards. The **footer is a solid electric blue (#4F50FF)** with a giant wordmark.
- **Type:** **Heldane Display** (serif, regular and italic) for headlines, Lettera Text (sans) for body, Akkurat Mono for labels.
- **Colour:** cream, a deep brown-black ink (#1F0D05), and **electric blue #4F50FF** as the brand and CTA colour.
- **Motion:** `nav-reveal`, the hero wordmark → content hand-off, a sticky scrub hero, and hand-drawn line illustrations.

## What KKS v2 takes (the blend)
| Pattern | Source | KKS v2 use |
|---|---|---|
| Dark ↔ cream theme switch driven by scroll | Mercury (+ Oscar cream) | `data-theme` on each section; body colours tween as sections cross the viewport centre |
| Serif-italic + grotesk headline contrast | Mercury (Tiempos), Oscar (Heldane) | **Instrument Serif** italic accents + **Geist** grotesk |
| Mono section labels and numbered cards | Oscar | **Geist Mono** labels, "01–04" numbered results and problem cards |
| Big punchy 2-line hero, lime CTA, black sections | Ramp | hero H1, lime primary button, black Services and footer bands |
| Product-UI mock assembling on a sticky stage | Mercury laptop zoom + Ramp collage | the hero pins and scales an "Ops Desk" dashboard mock up with live counters |
| Ticker / logo marquee | Ramp, Corgi | highlights ticker and carrier-portal marquee (2 rows, opposite directions) |
| 3-step animated product demo | Corgi "Claims start→finish" | pinned **Quote → COI → Renewal** workflow demo with typing, check marks and a timeline |
| Pastel quote-card wall | Oscar | review wall in tinted cards with prev/next and auto-scroll |
| Solid electric-blue CTA band and giant wordmark footer | Oscar, Corgi | blue CTA band and a giant "KKS" footer wordmark |
| Palette | all | ink #12121A, cream #F7F5EB, electric blue #4F50FF, lime #E4F222 |
