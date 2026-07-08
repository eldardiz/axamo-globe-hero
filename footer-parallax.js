// Footer Parallax Effect — Osmo Supply [https://osmo.supply/]
// Packaged for the Axamo Webflow embeds. GSAP + ScrollTrigger load globally via
// the hero embed. A small bootstrap adapts Webflow markup (auto-tags the footer
// as the moving inner and injects the dark layer when they aren't authored in
// the Designer); the effect itself is Osmo's code, unmodified.
(function () {
  'use strict'
  if (!window.gsap || !window.ScrollTrigger) return

  // ---- markup bootstrap (Webflow adaptation only — not part of the effect) ----
  function bootstrapMarkup() {
    document.querySelectorAll('[data-footer-parallax]').forEach(function (el) {
      // auto-tag the moving inner (the Footer) if it wasn't tagged in the Designer
      if (!el.querySelector('[data-footer-parallax-inner]')) {
        var inner = Array.prototype.find.call(el.children, function (c) {
          return (
            !c.hasAttribute('data-footer-parallax-dark') &&
            c.tagName !== 'SCRIPT' &&
            c.tagName !== 'LINK' &&
            c.tagName !== 'STYLE' &&
            !c.classList.contains('w-embed')
          )
        })
        if (inner) inner.setAttribute('data-footer-parallax-inner', '')
      }
      // inject the dark layer if it isn't in the markup
      if (!el.querySelector('[data-footer-parallax-dark]')) {
        var dark = document.createElement('div')
        dark.setAttribute('data-footer-parallax-dark', '')
        el.appendChild(dark)
      }
    })
  }

  // ---- Osmo Footer Parallax (verbatim) ----
  gsap.registerPlugin(ScrollTrigger)

  function initFooterParallax() {
    document.querySelectorAll('[data-footer-parallax]').forEach(el => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'clamp(top bottom)',
          end: 'clamp(top top)',
          scrub: true
        }
      })

      const inner = el.querySelector('[data-footer-parallax-inner]')
      const dark = el.querySelector('[data-footer-parallax-dark]')

      if (inner) {
        tl.from(inner, {
          yPercent: -25,
          ease: 'linear'
        })
      }

      if (dark) {
        tl.from(dark, {
          opacity: 0.5,
          ease: 'linear'
        }, '<')
      }
    })
  }

  // Initialize Footer with Parallax Effect
  function start() {
    bootstrapMarkup()
    initFooterParallax()
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()
