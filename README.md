# Axamo Globe Hero — Webflow embeds

Two drop-in Webflow embeds served from jsDelivr:

1. **Globe hero** ([`embed.html`](embed.html)) — the full scroll-driven section: a
   three.js network globe that rotates continuously as you scroll (US → Europe →
   back to America) while the copy cross-fades, over the grid + spotlight.
2. **Grid background** ([`grid-embed.html`](grid-embed.html)) — just the animated
   blueprint grid + travelling "beam" lines, as a reusable background layer for a
   footer or any other dark section.

## How to add them in Webflow

**Globe hero:** drag an **Embed** element where you want the section (parent
full-width; it sizes itself to `100vh`), paste [`embed.html`](embed.html), and
**Publish** (WebGL/scroll won't run on the Designer canvas).

**Grid background (e.g. footer):** two quick settings so it sits behind content —
1. the section → **Position: Relative**, **Overflow: Hidden**
2. that section's content wrapper → **Position: Relative**, **Z-index: 1**

then drop an Embed into the section and paste [`grid-embed.html`](grid-embed.html).
Best over a **dark** background (the lines/beams are light).

Both snippets are ~1–3 KB (well under Webflow's 10k embed limit); the heavy code
loads from the CDN. You can use both on the same page — they're independently
scoped and won't conflict.

## Hosted files (jsDelivr, tag `@v4`)

| File | URL |
|---|---|
| `hero.css` | `…/gh/eldardiz/axamo-globe-hero@v4/hero.css` |
| `hero.js` | `…/gh/eldardiz/axamo-globe-hero@v4/hero.js` |
| `land-data.js` | `…/gh/eldardiz/axamo-globe-hero@v4/land-data.js` |
| `grid.css` | `…/gh/eldardiz/axamo-globe-hero@v4/grid.css` |
| `grid.js` | `…/gh/eldardiz/axamo-globe-hero@v4/grid.js` |
| font (auto) | `…@v4/fonts/SF-Pro-Display-Regular.otf` (referenced by hero.css) |

(base = `https://cdn.jsdelivr.net`). three.js, GSAP and ScrollTrigger load from
public CDNs. The **grid background needs no GSAP** — `grid.js` is a plain script.

## Baked-in for Webflow

- **Scoped CSS.** Hero → `.axamo-gh`, grid → `.axamo-grid`, keyframes prefixed
  `axgh-`. Neither can restyle the rest of your Webflow page.
- **No Lenis.** The prototype used Lenis smooth-scroll, which hijacks the *whole
  page's* scroll — dropped. ScrollTrigger drives on native scroll; the globe's own
  easing keeps it smooth.
- **No custom cursor.** (Removed per request.)
- **Bundled font** renamed `AxamoSFPro` so it can't clash with a same-named font
  already in your project.

## Caveats

- The hero **pins** for ~5 viewport heights — don't put it inside a parent with
  `overflow: hidden` (breaks ScrollTrigger pinning). The grid background is the
  opposite: its parent *should* be `overflow: hidden`.
- Desktop-first; on ≤900px the hero stacks (globe on top, centred copy below).

## Editing / updating

- Copy is plain HTML in the hero embed — edit it right in Webflow.
- To change visuals, edit the files here and **cut a new tag** (`v3`, …), then bump
  the `@v2` in the snippets. jsDelivr caches tags permanently, so a new tag = an
  instant cache-bust (editing a tag in place won't show for ~12 h).

## Local preview

`npx serve` this folder and open `preview.html` — it simulates a Webflow page
(light body, content above, a dark footer using the grid background) with the
local files, so you can confirm scoping + both embeds before publishing.
