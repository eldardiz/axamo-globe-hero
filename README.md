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

1. **`footer_wrap`** → Position **Relative**. (No background needed — the spanning
   grid paints the dark `#101216` surface itself.) Do **NOT** set Overflow: Hidden —
   that would break the hero's scroll-pin.
2. Add an **Embed as the first child** of `footer_wrap` → paste
   [`grid-embed.html`](grid-embed.html) (the spanning grid).
3. `globe-cta` (hero) **and** `Footer` → Position **Relative**, **Z-index: 1** (so
   they sit above the grid).
4. In the `globe-cta` Embed, use the **bare** hero → paste
   [`embed-bare.html`](embed-bare.html) (transparent, no internal grid, so the shared
   grid shows through it).

Result: one grid behind hero + footer, **viewport-fixed** — the lines are glued to
the screen (no drift while scrolling; grid.js scroll-syncs a translate, contained to
the section), with a **radial mask**: brightest at the viewport centre (`--line`,
3.75% white) fading to 0 at the screen corners. The beams ride the same fixed layer.

## Footer parallax reveal (Osmo Supply effect, self-contained)

The Footer slides into place with a -25% lag while a dark layer fades out, scrubbed
by scroll. **Fully inline** — [`footer-parallax-embed.html`](footer-parallax-embed.html)
carries its own CSS + vanilla JS; nothing loads from the CDN and it does NOT use
GSAP. (The GSAP/ScrollTrigger original broke on the live site, which loads three
different GSAP versions incl. an old ScrollTrigger 3.11.3 that doesn't support
clamp() trigger positions — the dependency-free version is immune.) Setup:

1. In the Designer, add a **Div Block around ONLY the `Footer` component** (inside
   `footer_wrap`, below `globe-cta`). Never wrap the hero — that breaks its pin.
2. On that div: Custom attribute `data-footer-parallax` = `true`. No class needed —
   the inline CSS styles the attribute (relative, overflow hidden, z-1).
3. Drag an **Embed inside that div, below the Footer**, and paste
   [`footer-parallax-embed.html`](footer-parallax-embed.html) in full.

The script auto-tags the Footer as the moving inner (`data-footer-parallax-inner`)
and the pasted `data-footer-parallax-dark` div is the fading layer. Tune via the
`SHIFT` (-25) and `DIM` (0.5) consts at the top of the inline script — edits apply
on Publish, no tag/CDN involved. Motion spec: Osmo Supply (osmo.supply).

All snippets are ~1–3 KB (well under Webflow's 10k embed limit); the heavy code loads
from the CDN. Everything is independently scoped and won't conflict.

## Hosted files (jsDelivr, tag `@v10`)

| File | URL |
|---|---|
| `hero.css` | `…/gh/eldardiz/axamo-globe-hero@v10/hero.css` |
| `hero.js` | `…/gh/eldardiz/axamo-globe-hero@v10/hero.js` |
| `land-data.js` | `…/gh/eldardiz/axamo-globe-hero@v10/land-data.js` |
| `grid.css` | `…/gh/eldardiz/axamo-globe-hero@v10/grid.css` |
| `grid.js` | `…/gh/eldardiz/axamo-globe-hero@v10/grid.js` |
| font (auto) | `…@v10/fonts/SF-Pro-Display-Regular.otf` (referenced by hero.css) |

(The footer parallax is NOT on the CDN — it lives entirely inside
[`footer-parallax-embed.html`](footer-parallax-embed.html), pasted into Webflow.)

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
