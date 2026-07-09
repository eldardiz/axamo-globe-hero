// Axamo grid background — standalone beams engine. No dependencies (plain script).
// Finds every .axamo-grid on the page and animates travelling "beam" lines along
// its grid. The grid is VIEWPORT-FIXED: grid.js keeps the layers glued to the
// screen by scroll-syncing the --vp-y translate (see grid.css); the canvas and
// beam coordinates are viewport-sized, so beams stay locked to the fixed lines.
(function () {
  'use strict'

  function initBeams(grid) {
    var canvas = grid.querySelector('.beams')
    if (!canvas || canvas.dataset.axgridInit) return
    canvas.dataset.axgridInit = '1'
    var ctx = canvas.getContext('2d')
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    // ---- tunables ----
    var COLORS = ['#c84b30', '#c84b30', '#8ea2c0'] // mostly terracotta, ~1-in-3 steel blue
    var SPAWN_MIN = 2500, SPAWN_MAX = 4500 // ms between spawns
    var MAX_ALIVE = 3
    var TAIL_CELLS = 1.2, CORE = 1.5, GLOW = 9

    var cell = 64, W = 0, H = 0

    function resize() {
      cell = parseFloat(getComputedStyle(grid).getPropertyValue('--cell')) || 64
      var dpr = Math.min(2, window.devicePixelRatio || 1)
      // viewport-sized: the canvas is a screen-glued layer (grid.css translates it)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // ---- viewport glue: keep the line layer + canvas fixed to the screen ----
    // --vp-y = how far the section has scrolled past the viewport top, clamped
    // so the layers never slide beyond the section's own bounds.
    var syncQueued = false
    function syncViewport() {
      syncQueued = false
      var top = grid.getBoundingClientRect().top
      var y = Math.max(0, Math.min(-top, grid.offsetHeight - window.innerHeight))
      grid.style.setProperty('--vp-y', y.toFixed(1) + 'px')
    }
    function queueSync() {
      if (!syncQueued) { syncQueued = true; requestAnimationFrame(syncViewport) }
    }
    window.addEventListener('scroll', queueSync, { passive: true })
    window.addEventListener('resize', queueSync)
    window.addEventListener('load', queueSync) // section height settles after fonts/images
    syncViewport()

    function makePath() {
      var cols = Math.max(4, Math.floor(W / cell))
      var rows = Math.max(4, Math.floor(H / cell))
      var c = 1 + Math.floor(Math.random() * (cols - 2))
      var r = 1 + Math.floor(Math.random() * (rows - 2))
      var pts = [[c * cell, r * cell]]
      var horiz = Math.random() < 0.5
      var dir = Math.random() < 0.5 ? 1 : -1
      function leg(n) {
        var p = pts[pts.length - 1]
        pts.push(horiz ? [p[0] + dir * n * cell, p[1]] : [p[0], p[1] + dir * n * cell])
      }
      leg(2 + Math.floor(Math.random() * 3)) // 2-4 cells
      if (Math.random() < 0.6) { // ~60% turn one corner (the L)
        horiz = !horiz
        dir = Math.random() < 0.5 ? 1 : -1
        leg(1 + Math.floor(Math.random() * 3)) // 1-3 cells
      }
      var total = 0
      for (var i = 1; i < pts.length; i++) total += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])
      return { pts: pts, total: total }
    }

    function at(pts, d) {
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i]
        var seg = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])
        if (d <= seg || i === pts.length - 1) {
          var t = seg ? Math.min(1, d / seg) : 0
          return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
        }
        d -= seg
      }
      return pts[pts.length - 1]
    }

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }

    var beams = [], rafId = 0, visible = true

    function spawn() {
      if (beams.length >= MAX_ALIVE) return
      var p = makePath()
      beams.push({ pts: p.pts, total: p.total, t0: performance.now(), dur: 1800 + Math.random() * 1200, color: COLORS[Math.floor(Math.random() * COLORS.length)] })
      if (!rafId) rafId = requestAnimationFrame(draw)
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H)
      var tail = TAIL_CELLS * cell
      for (var i = beams.length - 1; i >= 0; i--) {
        var b = beams[i]
        var p = (now - b.t0) / b.dur
        if (p >= 1) { beams.splice(i, 1); continue }
        var head = ease(p) * (b.total + tail)
        var from = Math.max(0, head - tail)
        var to = Math.min(b.total, head)
        if (to <= from) continue
        var fade = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1
        var h = at(b.pts, to)
        ctx.lineWidth = CORE
        ctx.lineCap = 'round'
        ctx.shadowColor = b.color
        ctx.shadowBlur = GLOW
        var STEPS = 14
        for (var s = 0; s < STEPS; s++) {
          var d0 = from + ((to - from) * s) / STEPS
          var d1 = from + ((to - from) * (s + 1)) / STEPS
          var a = ((d0 - (head - tail)) / tail) * fade
          if (a <= 0) continue
          var q0 = at(b.pts, d0), q1 = at(b.pts, d1)
          ctx.strokeStyle = b.color
          ctx.globalAlpha = Math.min(1, a)
          ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke()
        }
        ctx.globalAlpha = fade
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(h[0], h[1], CORE, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.shadowBlur = 0
      rafId = beams.length ? requestAnimationFrame(draw) : 0
      if (!rafId) ctx.clearRect(0, 0, W, H)
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting }).observe(grid)
    }
    function loop() {
      if (!reduce && visible && document.visibilityState === 'visible') spawn()
      setTimeout(loop, SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN))
    }
    if (!reduce) setTimeout(loop, 1200)
  }

  function initAll() {
    var grids = document.querySelectorAll('.axamo-grid')
    for (var i = 0; i < grids.length; i++) initBeams(grids[i])
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll)
  else initAll()
})()
