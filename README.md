# Axamo Globe Hero — Webflow embeds

Drop-in Webflow embeds served from jsDelivr. Two ways to use them:

- **Standalone hero** ([`embed.html`](embed.html)) — the full scroll-driven section
  (globe + grid + spotlight) with its own built-in grid. Drop it anywhere.
- **Shared grid across hero + footer (recommended when they're adjacent)** — one
  continuous grid behind BOTH the hero and the footer, so there's no seam between
  them. Uses the **bare hero** ([`embed-bare.html`](embed-bare.html), transparent +
  grid-less) plus the **spanning grid** ([`grid-embed.html`](grid-embed.html)).

## Standalone hero

Drag an **Embed** where you want the section (parent full-width; it sizes itself to
`100vh`), paste [`embed.html`](embed.html), and **Publish** (WebGL/scroll won't run
on the Designer canvas).

## Shared grid across hero + footer (one continuous background)

Your `footer_wrap` already contains the hero embed (`globe-cta`) and the `Footer`.
Put ONE grid behind the whole wrapper:

1. **`footer_wrap`** → Position **Relative**, Background **`#101216`** (the dark bg
   now comes from here, not the hero). Do **NOT** set Overflow: Hidden — that would
   break the hero's scroll-pin.
2. Add an **Embed as the first child** of `footer_wrap` → paste
   [`grid-embed.html`](grid-embed.html) (the spanning grid).
3. `globe-cta` (hero) **and** `Footer` → Position **Relative**, **Z-index: 1** (so
   they sit above the grid).
4. In the `globe-cta` Embed, use the **bare** hero → paste
   [`embed-bare.html`](embed-bare.html) (transparent, no internal grid, so the shared
   grid shows through it).

Result: the grid runs unbroken from the top of the hero down through the footer,
dissolving softly at the very top and bottom edges. The grid is uniform, so it looks
static even while the globe is pinned over it.

All snippets are ~1–3 KB (well under Webflow's 10k embed limit); the heavy code loads
from the CDN. Everything is independently scoped and won't conflict.

## Hosted files (jsDelivr, tag `@v5`)

| File | URL |
|---|---|
| `hero.css` | `…/gh/eldardiz/axamo-globe-hero@v5/hero.css` |
| `hero.js` | `…/gh/eldardiz/axamo-globe-hero@v5/hero.js` |
| `land-data.js` | `…/gh/eldardiz/axamo-globe-hero@v5/land-data.js` |
| `grid.css` | `…/gh/eldardiz/axamo-globe-hero@v5/grid.css` |
| `grid.js` | `…/gh/eldardiz/axamo-globe-hero@v5/grid.js` |
| font (auto) | `…@v5/fonts/SF-Pro-Display-Regular.otf` (referenced by hero.css) |

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
