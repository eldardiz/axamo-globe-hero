# Axamo Globe Hero — Webflow embed

A self-contained, scroll-driven hero: a three.js network globe that rotates
continuously as you scroll (US → Europe → back to America) while the copy
cross-fades, over an Aceternity-style grid with animated beams and a top-left
spotlight. Served from jsDelivr, dropped into Webflow with one embed.

## How to add it in Webflow

1. In the Webflow Designer, drag an **Embed** element where you want the section
   (make its parent full-width; the section sizes itself to `100vh`).
2. Paste the entire contents of [`embed.html`](embed.html).
3. **Publish** (the globe needs the real published domain — the Designer canvas
   won't run the WebGL/scroll scripts).

That's it. The markup + `<link>`/`<script>` tags are ~3 KB, well under Webflow's
10,000-character embed limit; the heavy code loads from the CDN.

## What's hosted here (jsDelivr)

| File | URL |
|---|---|
| `hero.css` | `https://cdn.jsdelivr.net/gh/eldardiz/axamo-globe-hero@v1/hero.css` |
| `hero.js` | `https://cdn.jsdelivr.net/gh/eldardiz/axamo-globe-hero@v1/hero.js` |
| `land-data.js` | `https://cdn.jsdelivr.net/gh/eldardiz/axamo-globe-hero@v1/land-data.js` |
| font (auto) | `…@v1/fonts/SF-Pro-Display-Regular.otf` (referenced by hero.css) |

three.js, GSAP and ScrollTrigger load from public CDNs (three.js via an ESM
import inside `hero.js`; GSAP/ScrollTrigger via the two `<script>` tags).

## Design decisions baked in for Webflow

- **Scoped CSS.** Everything is under `.axamo-gh`, and keyframes are prefixed
  `axgh-`. It cannot restyle the rest of your Webflow page (no global `body`/`*`
  resets).
- **No Lenis.** The standalone prototype used Lenis smooth-scroll, which hijacks
  the *whole page's* scroll — bad for a single embedded section. This build drives
  on native scroll via ScrollTrigger; the globe's own frame-easing keeps it
  smooth. If you already run smooth-scroll site-wide, it just works with it.
- **Bundled font** renamed to `AxamoSFPro` so it can't clash with a font of the
  same name already in your Webflow project.

## Caveats

- The section **pins** for ~5 viewport heights of scroll. Don't place it inside a
  parent with `overflow: hidden` (that breaks ScrollTrigger pinning).
- Desktop-first; on ≤900px it stacks (globe on top, centred copy below).

## Editing / updating

- Copy is plain HTML in the embed — edit it right in Webflow.
- To change the globe path, colors, grid, spotlight, etc., edit the files here and
  **cut a new tag** (`v2`, `v3`, …), then bump the `@v1` in the embed. jsDelivr
  caches tags permanently, so a new tag = instant cache-bust. (Editing `@v1` in
  place won't show up for ~12 h due to CDN caching — always bump the tag.)

## Local preview

`npx serve` this folder and open `preview.html` (simulates a Webflow page with
content above/below the embed, using the local files).
