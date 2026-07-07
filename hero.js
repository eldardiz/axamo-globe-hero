// Axamo Globe Hero — Webflow embed build.
// three.js network globe + animated grid beams + continuous scroll-bound rotation,
// merged into ONE module. Lenis is intentionally NOT used (it would hijack the whole
// page's scroll) — ScrollTrigger drives on native scroll and the globe's own frame
// lerp keeps the rotation smooth. Everything is scoped to the .axamo-gh wrapper.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'

/* ==================== network globe ==================== */
const DEG = Math.PI / 180
const LAND = new THREE.Color(0xffffff)
const OCEAN = new THREE.Color(0x8792a6)
const HOT = new THREE.Color(0xc84b30)
const OCEAN_B = 0.16
const LAND_B = 1.0
const LINE_OCEAN_B = 0.05
const LINE_LAND_B = 0.22

function latLngToVec3(lat, lng, r) {
  const la = lat * DEG
  const lo = lng * DEG
  return new THREE.Vector3(
    r * Math.cos(la) * Math.sin(lo),
    r * Math.sin(la),
    r * Math.cos(la) * Math.cos(lo),
  )
}

function dotTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.65)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

function initGlobe(canvas) {
  const R = 1
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  const localDirs = (window.AXAMO_LAND || [])
    .filter(([lat]) => lat > -84 && lat < 84)
    .map(([lat, lng]) => latLngToVec3(lat, lng, 1).normalize())
  const N = localDirs.length
  const LAND_COUNT = N

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  camera.position.set(0, 0, 4.4)

  const group = new THREE.Group()
  group.rotation.order = 'XYZ'
  scene.add(group)

  const positions = new Float32Array(N * 3)
  const colors = new Float32Array(N * 3)
  const landF = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    positions[i * 3] = localDirs[i].x * R
    positions[i * 3 + 1] = localDirs[i].y * R
    positions[i * 3 + 2] = localDirs[i].z * R
    landF[i] = i < LAND_COUNT ? 1 : 0
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const colorAttr = new THREE.BufferAttribute(colors, 3)
  geo.setAttribute('color', colorAttr)
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.03,
      map: dotTexture(),
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  )
  group.add(points)

  const K = 3
  const seen = new Set()
  const linePos = []
  const lineCol = []
  const lineB = (i) => LINE_OCEAN_B + (LINE_LAND_B - LINE_OCEAN_B) * landF[i]
  for (let i = 0; i < N; i++) {
    const a = localDirs[i]
    const nbr = []
    for (let j = 0; j < N; j++) {
      if (i === j) continue
      nbr.push([a.distanceToSquared(localDirs[j]), j])
    }
    nbr.sort((p, q) => p[0] - q[0])
    for (let n = 0; n < K; n++) {
      const [d2, j] = nbr[n]
      if (d2 > 0.018) continue
      const key = i < j ? i * N + j : j * N + i
      if (seen.has(key)) continue
      seen.add(key)
      linePos.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      linePos.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2])
      const bi = lineB(i)
      const bj = lineB(j)
      lineCol.push(bi * 0.92, bi * 0.96, bi, bj * 0.92, bj * 0.96, bj)
    }
  }
  const lgeo = new THREE.BufferGeometry()
  lgeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))
  lgeo.setAttribute('color', new THREE.Float32BufferAttribute(lineCol, 3))
  group.add(
    new THREE.LineSegments(
      lgeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }),
    ),
  )

  const GLOW = 0.95
  let targetRotX = 39 * DEG
  let targetRotY = 98 * DEG
  group.rotation.x = targetRotX
  group.rotation.y = targetRotY

  function setView(lat, lng) {
    targetRotX = lat * DEG
    targetRotY = -lng * DEG
  }

  function resize() {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  const c = new THREE.Color()
  const q = new THREE.Quaternion()
  const wd = new THREE.Vector3()
  let last = performance.now()

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const k = reduce ? 1 : Math.min(1, dt * 8)
    group.rotation.x += (targetRotX - group.rotation.x) * k
    group.rotation.y += (targetRotY - group.rotation.y) * k

    q.copy(group.quaternion)
    for (let i = 0; i < N; i++) {
      wd.copy(localDirs[i]).applyQuaternion(q)
      const front = Math.max(0, wd.z)
      const t = Math.min(1, GLOW * front * front)
      const lf = landF[i]
      c.copy(OCEAN).lerp(LAND, lf).lerp(HOT, t * 0.9)
      const b = OCEAN_B + (LAND_B - OCEAN_B) * lf + t * 0.5
      colors[i * 3] = c.r * b
      colors[i * 3 + 1] = c.g * b
      colors[i * 3 + 2] = c.b * b
    }
    colorAttr.needsUpdate = true
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)

  return { setView, resize }
}

/* ==================== grid beams ==================== */
function initBeams(grid) {
  const canvas = grid && grid.querySelector('.beams')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  const COLORS = ['#c84b30', '#c84b30', '#8ea2c0']
  const SPAWN_MIN = 2500
  const SPAWN_MAX = 4500
  const MAX_ALIVE = 3
  const TAIL_CELLS = 1.2
  const CORE = 1.5
  const GLOW = 9

  let cell = 64
  let W = 0, H = 0

  function resize() {
    cell = parseFloat(getComputedStyle(grid).getPropertyValue('--cell')) || 64
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    W = grid.clientWidth
    H = grid.clientHeight
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  function makePath() {
    const cols = Math.max(4, Math.floor(W / cell))
    const rows = Math.max(4, Math.floor(H / cell))
    let c = 1 + Math.floor(Math.random() * (cols - 2))
    let r = 1 + Math.floor(Math.random() * (rows - 2))
    if (c > cols * 0.33 && c < cols * 0.67 && r > rows * 0.33 && r < rows * 0.67) {
      c = 1 + Math.floor(Math.random() * (cols - 2))
    }
    const pts = [[c * cell, r * cell]]
    let horiz = Math.random() < 0.5
    let dir = Math.random() < 0.5 ? 1 : -1
    const leg = (n) => {
      const [x, y] = pts[pts.length - 1]
      pts.push(horiz ? [x + dir * n * cell, y] : [x, y + dir * n * cell])
    }
    leg(2 + Math.floor(Math.random() * 3))
    if (Math.random() < 0.6) {
      horiz = !horiz
      dir = Math.random() < 0.5 ? 1 : -1
      leg(1 + Math.floor(Math.random() * 3))
    }
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      total += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])
    }
    return { pts, total }
  }

  function at(pts, d) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1]
      const [bx, by] = pts[i]
      const seg = Math.abs(bx - ax) + Math.abs(by - ay)
      if (d <= seg || i === pts.length - 1) {
        const t = seg ? Math.min(1, d / seg) : 0
        return [ax + (bx - ax) * t, ay + (by - ay) * t]
      }
      d -= seg
    }
    return pts[pts.length - 1]
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  const beams = []
  let rafId = 0
  let visible = true

  function spawn(path) {
    if (beams.length >= MAX_ALIVE) return
    const p = path || makePath()
    beams.push({ ...p, t0: performance.now(), dur: 1800 + Math.random() * 1200, color: COLORS[Math.floor(Math.random() * COLORS.length)] })
    if (!rafId) rafId = requestAnimationFrame(draw)
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H)
    const tail = TAIL_CELLS * cell
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i]
      const p = (now - b.t0) / b.dur
      if (p >= 1) { beams.splice(i, 1); continue }
      const head = ease(p) * (b.total + tail)
      const from = Math.max(0, head - tail)
      const to = Math.min(b.total, head)
      if (to <= from) continue
      const fade = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1
      const [hx, hy] = at(b.pts, to)
      ctx.lineWidth = CORE
      ctx.lineCap = 'round'
      ctx.shadowColor = b.color
      ctx.shadowBlur = GLOW
      const STEPS = 14
      for (let s = 0; s < STEPS; s++) {
        const d0 = from + ((to - from) * s) / STEPS
        const d1 = from + ((to - from) * (s + 1)) / STEPS
        const a = ((d0 - (head - tail)) / tail) * fade
        if (a <= 0) continue
        const [x0, y0] = at(b.pts, d0)
        const [x1, y1] = at(b.pts, d1)
        ctx.strokeStyle = b.color
        ctx.globalAlpha = Math.min(1, a)
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      ctx.globalAlpha = fade
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(hx, hy, CORE, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.shadowBlur = 0
    rafId = beams.length ? requestAnimationFrame(draw) : 0
    if (!rafId) ctx.clearRect(0, 0, W, H)
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(grid)
  }
  function loop() {
    if (!reduce && visible && document.visibilityState === 'visible') spawn()
    setTimeout(loop, SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN))
  }
  if (!reduce) setTimeout(loop, 1200)
}

/* ==================== orchestration ==================== */
const root = document.querySelector('.axamo-gh')
if (root && window.gsap && window.ScrollTrigger) {
  const gsap = window.gsap
  const ScrollTrigger = window.ScrollTrigger
  gsap.registerPlugin(ScrollTrigger)

  const hero = root.querySelector('.hero')
  const globe = initGlobe(root.querySelector('.globe-canvas'))
  initBeams(root.querySelector('.grid'))

  const beats = [...root.querySelectorAll('.beat')]
  const SCROLL_PER_BEAT = 165 // % of viewport of scroll per beat (longer = slower turn)

  // rotation keyframes: scroll progress -> centred lat/lng (monotonic lng = one eastward turn)
  const KEYS = [
    { p: 0.0, lat: 39, lng: -98 },
    { p: 0.5, lat: 46, lng: 10 },
    { p: 1.0, lat: 39, lng: 262 },
  ]
  function viewAt(p) {
    p = Math.max(0, Math.min(1, p))
    let a = KEYS[0], b = KEYS[1]
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (p >= KEYS[i].p && p <= KEYS[i + 1].p) { a = KEYS[i]; b = KEYS[i + 1]; break }
    }
    const t = (p - a.p) / (b.p - a.p || 1)
    const s = t * t * (3 - 2 * t)
    return { lat: a.lat + (b.lat - a.lat) * s, lng: a.lng + (b.lng - a.lng) * s }
  }

  const FADE = [
    { in0: -1, in1: -1, out0: 0.18, out1: 0.32 },
    { in0: 0.24, in1: 0.40, out0: 0.72, out1: 0.84 },
    { in0: 0.78, in1: 0.94, out0: 2, out1: 2 },
  ]
  function opacityAt(p, f) {
    if (p <= f.in0 || p >= f.out1) return 0
    if (p < f.in1) return f.in1 > f.in0 ? (p - f.in0) / (f.in1 - f.in0) : 1
    if (p <= f.out0) return 1
    return f.out1 > f.out0 ? (f.out1 - p) / (f.out1 - f.out0) : 1
  }
  function phaseAt(p, f) {
    if (p <= f.in0) return 1
    if (p < f.in1) return 1 - (p - f.in0) / (f.in1 - f.in0)
    if (p <= f.out0) return 0
    if (p < f.out1) return -(p - f.out0) / (f.out1 - f.out0)
    return -1
  }

  const TRAVEL = 110
  const MAX_BLUR = 8
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  function render(p) {
    const v = viewAt(p)
    globe.setView(v.lat, v.lng)
    beats.forEach((b, i) => {
      const o = opacityAt(p, FADE[i])
      b.style.opacity = o
      b.style.pointerEvents = o > 0.6 ? 'auto' : 'none'
      if (reduceMotion) return
      const ph = phaseAt(p, FADE[i])
      const t = Math.abs(ph)
      const e = Math.sign(ph) * t * t * (3 - 2 * t)
      b.style.transform = `translateY(${(e * TRAVEL).toFixed(1)}px)`
      b.style.filter = o > 0 ? `blur(${(Math.abs(e) * MAX_BLUR).toFixed(2)}px)` : 'none'
    })
  }
  render(0)

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: '+=' + beats.length * SCROLL_PER_BEAT + '%',
    pin: hero,
    anticipatePin: 1,
    onUpdate: (self) => render(self.progress),
  })
  ScrollTrigger.addEventListener('refresh', () => globe.resize())

  // subtle grid parallax
  gsap.to(root.querySelector('.grid'), {
    yPercent: 5,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  })

  // magnetic CTA
  root.querySelectorAll('.cta').forEach((cta) => {
    cta.addEventListener('mousemove', (e) => {
      const r = cta.getBoundingClientRect()
      gsap.to(cta, {
        x: (e.clientX - (r.left + r.width / 2)) * 0.25,
        y: (e.clientY - (r.top + r.height / 2)) * 0.35,
        duration: 0.4,
        ease: 'power3.out',
      })
    })
    cta.addEventListener('mouseleave', () => gsap.to(cta, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }))
  })

  window.addEventListener('load', () => ScrollTrigger.refresh())
}
