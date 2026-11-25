# Soniaa S. — a living tree

## Concept
This is a single-page interactive sketchbook representing Soniaa S., a Fractional CMO, as a living tree. Rather than presenting a conventional résumé or portfolio grid, the experience invites the visitor in as a butterfly drifting across a hand-drawn pencil sketch. Three branches and roots are open to explore—covering how she sees the whole picture, what she notices, and her foundational roots—while four buds remain closed as next experiments, and visitors can leave small leaf notes on any explored branch before summarizing or copying their reflections at the end.

## What was drawn by hand vs. what AI and code did
- **Drawn by hand:** The original pencil tree illustration—including the trunk, five branches, ground line, roots, seven diamond/circle tip markers, and the handwritten `"Crafting Brands"` caption (`assets/tree-original.jpeg`).
- **Image processing & code:** ImageMagick converted the pencil drawing into transparent-background WebP derivatives (`assets/tree-2000.webp` and `assets/tree-1000.webp`) recolored to warm charcoal-brown (`#3B2F2A`), while vanilla HTML, CSS, and JavaScript layer the paper texture, pollen motes, watercolor blooms, butterfly physics, accessible panels, and `sessionStorage` notes on top of the untouched drawing.
- **AI assistance:** Used during development for image luminance extraction commands, CSS/JS implementation, coordinate measurement, and Playwright verification.

## Key decisions and why
- **No backend:** Everything lives in static files so there are no servers to maintain, no external data collection, and zero runtime failure points.
- **`sessionStorage` with in-memory fallback:** Visitor notes ("leaves") and exploration progress persist across reloads within the current tab and disappear naturally when the tab closes, matching the ephemeral "Your visit" framing without cookies or tracking.
- **Vanilla HTML/CSS/JS:** With one focused canvas and three note panels, zero frameworks or bundlers keep the codebase small, readable for a live walkthrough, and directly runnable from `index.html`.
- **Percentage hotspots over a photograph:** Anchoring `<button>` elements by percentage inside an aspect-ratio-locked stage (`2272 / 1884`) ensures every blossom stays aligned with its hand-drawn branch tip across screen sizes without redrawing or vectorizing the sketch.

## What was deliberately cut
- **Engagement tracking & analytics:** Cut intentionally so the visit remains quiet and private.
- **Backend / database persistence:** Cut to avoid storing visitor notes server-side or adding API complexity.
- **The four bud sections:** Left intentionally closed (`"The Canopy"`, `"How she leads"`, `"How she solves things"`, `"What she cares about"`) so depth on three thoughtfully developed branches takes priority over filling every tip.

## What I'd build next
- Open the four remaining buds as additional short, grounded reflections once verified copy is ready.
- Set `CONTACT_EMAIL` in `content.js` if direct email replies from the ending screen are desired.
- Add optional subtle acoustic/paper foley muted by default.

## How to run it
Open `index.html` directly in any modern browser, or serve the folder with any static HTTP server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Add `?debug=1` to the URL to inspect hotspot outlines, drag tip positions, and copy updated coordinates JSON.

## AI usage log
- **Image extraction & tip detection:** Used Python and ImageMagick to measure the 7 drawn tips in `assets/tree-original.jpeg` and generate transparent `#3B2F2A` WebP variants (`tree-2000.webp`, `tree-1000.webp`).
- **Frontend implementation:** Used AI coding assistance to author `index.html`, `styles.css`, `content.js`, `app.js`, and `README.md` with strict copy fidelity, keyboard focus trapping, `prefers-reduced-motion` support, and debug overlay tooling.
- **Verification:** Used Playwright to capture desktop (`1440x900`) and mobile (`390x844`) screenshots (including `?debug=1` alignment), test keyboard-only navigation, reduced-motion mode, and verify zero console errors.
