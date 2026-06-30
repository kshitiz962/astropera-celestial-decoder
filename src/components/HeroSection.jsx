import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
// Palette matching ASTROPERA's cosmic identity
// ─────────────────────────────────────────────
const PALETTE = [
  [74, 240, 208],   // teal
  [123, 111, 255],  // violet
  [196, 245, 66],   // acid lime
  [160, 233, 255],  // ice blue
  [180, 140, 255],  // lavender
  [255, 160, 200],  // blush
];

const PARTICLE_COUNT = 3500;
const REPEL_RADIUS   = 140;
const REPEL_STRENGTH = 5.2;
const ATTRACT_RADIUS = 280;
const ATTRACT_STRENGTH = 0.16;
const FRICTION        = 0.87;
const RETURN_STRENGTH = 0.042;

class Particle {
  constructor(W, H) {
    this.W = W; this.H = H;
    this.spaceX = Math.random() * this.W;
    this.spaceY = Math.random() * this.H;
    this.x = this.spaceX;
    this.y = this.spaceY;
    
    this.textX = null;
    this.textY = null;
    
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 1.5 + 0.4;
    this.c1 = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    this.c2 = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    this.phase = Math.random() * Math.PI * 2;
    this.speed = 0.011 + Math.random() * 0.016;
    this.driftAmp = 0.3 + Math.random() * 0.5;
    this.driftFreq = 0.002 + Math.random() * 0.004;
    this.driftOff = Math.random() * Math.PI * 2;
    this.baseAlpha = 0.3 + Math.random() * 0.55;
    this.arcanaActive = false;
  }
  update(t, mx, my, shockwave, scrollProgress) {
    if (this.arcanaActive) {
      this.x += this.vx;
      this.y += this.vy;
      return;
    }
    // textWeight resolves from 1.0 (on load) to 0.0 (past scroll progress 0.12)
    let textWeight = 0;
    if (scrollProgress < 0.03) {
      textWeight = 1.0;
    } else if (scrollProgress < 0.12) {
      const ratio = (scrollProgress - 0.03) / 0.09;
      textWeight = 0.5 + Math.cos(ratio * Math.PI) * 0.5;
    }

    const dx = mx - this.x, dy = my - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (dist < REPEL_RADIUS) {
      const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
      this.vx -= (dx / dist) * force;
      this.vy -= (dy / dist) * force;
    } else if (dist < ATTRACT_RADIUS) {
      const force = (1 - dist / ATTRACT_RADIUS) * ATTRACT_STRENGTH * (1 - textWeight * 0.7);
      this.vx += (dx / dist) * force;
      this.vy += (dy / dist) * force;
    }

    if (shockwave && shockwave.active) {
      const sdx = this.x - shockwave.x;
      const sdy = this.y - shockwave.y;
      const sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
      const diff = sdist - shockwave.radius;
      if (diff > -25 && diff < 25) {
        const force = (1 - Math.abs(diff) / 25) * 8.5;
        this.vx += (sdx / sdist) * force;
        this.vy += (sdy / sdist) * force;
      }
    }

    const driftX = Math.cos(this.driftOff + t * 0.0007) * Math.sin(t * this.driftFreq + this.driftOff) * this.driftAmp;
    const driftY = Math.sin(this.driftOff + t * 0.0009) * Math.sin(t * this.driftFreq + this.driftOff) * this.driftAmp;
    
    let homeX = this.spaceX;
    let homeY = this.spaceY;
    if (this.textX !== null && this.textY !== null) {
      homeX = this.textX * textWeight + this.spaceX * (1 - textWeight);
      homeY = this.textY * textWeight + this.spaceY * (1 - textWeight);
    }

    const snapStrength = RETURN_STRENGTH * (1 + textWeight * 7.5);
    this.vx += (homeX + driftX - this.x) * snapStrength;
    this.vy += (homeY + driftY - this.y) * snapStrength;

    this.vx *= FRICTION; this.vy *= FRICTION;
    this.x += this.vx; this.y += this.vy;
    this.phase += this.speed;
  }
  draw(ctx) {
    const irid = Math.sin(this.phase) * 0.5 + 0.5;
    const [r1,g1,b1] = this.c1, [r2,g2,b2] = this.c2;
    const r = Math.round(r1 + (r2-r1)*irid);
    const g = Math.round(g1 + (g2-g1)*irid);
    const b = Math.round(b1 + (b2-b1)*irid);
    const speed = Math.sqrt(this.vx**2 + this.vy**2);
    const alpha = this.baseAlpha * Math.min(1, 0.65 + speed * 0.15);
    
    // Draw glowing radial gradients on fast exploding particles (speed > 5.5)
    if (speed > 5.5) {
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
      glow.addColorStop(0, `rgba(${r},${g},${b},${Math.min(0.28, speed * 0.04)})`);
      glow.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fill();
  }
}

// ─────────────────────────────────────────────────
// Magnetic Dust Canvas (full-screen background)
// ─────────────────────────────────────────────────
function DustCanvas({ headlineRef }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ particles: [], mouse: { x: -9999, y: -9999 }, t: 0, shockwave: { x: 0, y: 0, radius: 0, maxRadius: 320, speed: 9.5, active: false }, hasTriggeredArcana: false, arcanaStage: "idle", boomFlash: 0 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let W, H;
    let textTargets = [];

    function generateTextTargets(canvasWidth, canvasHeight) {
      const targets = [];
      const el = headlineRef.current;
      if (!el) return targets;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return targets;

      // Create an offscreen canvas to render text in the exact position
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;

      // Get styles of the actual headline element to match font size and spacing
      const style = window.getComputedStyle(el);
      tempCtx.font = `700 ${style.fontSize} ${style.fontFamily}`;
      tempCtx.fillStyle = "#ffffff";
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";

      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      tempCtx.fillText(el.innerText, x, y);

      // Sample pixels
      const imgData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imgData.data;
      
      const step = 3; // 🌟 Denser sampling for razor-sharp typography
      for (let yPos = 0; yPos < canvasHeight; yPos += step) {
        for (let xPos = 0; xPos < canvasWidth; xPos += step) {
          const idx = (yPos * canvasWidth + xPos) * 4;
          const a = data[idx + 3];

          if (a > 120) {
            targets.push({ x: xPos, y: yPos });
          }
        }
      }

      // Shuffle so particles disperse from random positions
      return targets.sort(() => Math.random() - 0.5);
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      
      textTargets = generateTextTargets(W, H);

      // Initialize particles and snap a subset to text targets
      stateRef.current.particles = Array.from({ length: PARTICLE_COUNT }, (_, idx) => {
        const p = new Particle(W, H);
        p.phase = Math.random() * Math.PI * 2 * 200;
        
        if (idx < textTargets.length) {
          const target = textTargets[idx];
          p.textX = target.x;
          p.textY = target.y;
          // snap initially
          p.x = p.textX;
          p.y = p.textY;
          
          // 🌟 Bold and Bright text particles to ensure clear readability
          p.size = Math.random() * 1.5 + 1.25;          // larger size (1.25px to 2.75px)
          p.baseAlpha = 0.48 + Math.random() * 0.32;    // softer alpha (48% to 80%)
          
          // Headline palette: bright ice blue / crystal white (lighter sky blue)
          p.c1 = [215, 245, 255];
          p.c2 = [255, 255, 255];
        } else {
          p.textX = null;
          p.textY = null;
        }
        return p;
      });
    }

    const onMouseMove = (e) => {
      stateRef.current.mouse = { x: e.clientX, y: e.clientY };
    };
    const onTouchMove = (e) => {
      if (e.touches[0]) {
        stateRef.current.mouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const triggerShockwave = (x, y) => {
      stateRef.current.shockwave = {
        x: x,
        y: y,
        radius: 0,
        maxRadius: 360,
        speed: 12.5,
        active: true
      };
    };

    const onClick = (e) => {
      triggerShockwave(e.clientX, e.clientY);
    };

    const onCelestialBoom = (e) => {
      const { x, y } = e.detail;
      triggerShockwave(x, y);
      
      const { particles } = stateRef.current;
      particles.forEach(p => {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 15 + 8.5; // HUGE explosion force!
        p.vx = Math.cos(angle) * force;
        p.vy = Math.sin(angle) * force;
      });
      stateRef.current.boomFlash = 0.85; // bright white cosmic flash
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("celestial-boom", onCelestialBoom);

    const trail = [];
    const TRAIL_LEN = 32;

    function loop() {
      const { particles, mouse, shockwave } = stateRef.current;
      stateRef.current.t++;
      const t = stateRef.current.t;
      ctx.clearRect(0, 0, W, H);

      // Re-measure targets if they are not generated yet
      if (textTargets.length === 0 && headlineRef.current) {
        textTargets = generateTextTargets(W, H);
        particles.forEach((p, idx) => {
          if (idx < textTargets.length) {
            const target = textTargets[idx];
            p.textX = target.x;
            p.textY = target.y;
            p.x = p.textX;
            p.y = p.textY;

            // 🌟 Bold and Bright text particles to ensure clear readability
            p.size = Math.random() * 1.5 + 1.25;          // larger size (1.25px to 2.75px)
            p.baseAlpha = 0.48 + Math.random() * 0.32;    // softer alpha (48% to 80%)

            p.c1 = [215, 245, 255];
            p.c2 = [255, 255, 255];
          }
        });
      }

      // Get scroll progress directly from scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;

      // Arcana Stage cosmic boom trigger sequence (Stage 3 is 0.41 - 0.55)
      if (scrollProgress >= 0.40 && scrollProgress < 0.56) {
        if (!stateRef.current.hasTriggeredArcana) {
          // 1. Gather all particles into a tight falling cluster
          particles.forEach(p => {
            p.arcanaActive = true;
            p.x = W * 0.5 + (Math.random() - 0.5) * 45;
            p.y = -50 - Math.random() * 120;
            p.vx = (Math.random() - 0.5) * 1.2;
            p.vy = Math.random() * 4 + 7.5; // fall rapidly
          });
          stateRef.current.hasTriggeredArcana = true;
          stateRef.current.arcanaStage = "drop";
          window.dispatchEvent(new CustomEvent('lock-scroll'));
        }
        
        // 2. Check if the cluster has reached the center of the viewport (y >= H * 0.42)
        if (stateRef.current.arcanaStage === "drop") {
          const sample = particles[0];
          if (sample && sample.y >= H * 0.42) {
            // BOOM! Trigger radial explosion
            particles.forEach(p => {
              p.arcanaActive = false; // resume normal physics
              const angle = Math.random() * Math.PI * 2;
              const force = Math.random() * 11 + 6.5; // explosive force
              p.vx = Math.cos(angle) * force;
              p.vy = Math.sin(angle) * force;
            });
            // Trigger shockwave rings in 2D
            shockwave.x = W * 0.5;
            shockwave.y = H * 0.42;
            shockwave.radius = 0;
            shockwave.maxRadius = 380;
            shockwave.speed = 13.5;
            shockwave.active = true;
            
            // Full screen cosmic boom flash
            stateRef.current.boomFlash = 0.72;
            stateRef.current.arcanaStage = "boom";
            window.dispatchEvent(new CustomEvent('unlock-scroll'));
          }
        }
      } else if (scrollProgress < 0.35 || scrollProgress > 0.60) {
        if (stateRef.current.hasTriggeredArcana) {
          stateRef.current.hasTriggeredArcana = false;
          stateRef.current.arcanaStage = "idle";
          window.dispatchEvent(new CustomEvent('unlock-scroll'));
        }
      }



      // Nebula radial bg
      const nb = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.58);
      nb.addColorStop(0, "rgba(10,22,60,0.22)");
      nb.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nb;
      ctx.fillRect(0, 0, W, H);

      // Black void mask at cursor (fades hovered area to black)
      if (mouse.x > -9999) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        const voidGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, REPEL_RADIUS * 1.2);
        voidGrad.addColorStop(0, "rgba(5, 8, 22, 1.0)");      // fully black
        voidGrad.addColorStop(0.5, "rgba(5, 8, 22, 0.85)");   // soft fade
        voidGrad.addColorStop(1, "rgba(5, 8, 22, 0)");         // transparent transition
        ctx.fillStyle = voidGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, REPEL_RADIUS * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update shockwave radius
      if (shockwave && shockwave.active) {
        shockwave.radius += shockwave.speed;
        if (shockwave.radius > shockwave.maxRadius) {
          shockwave.active = false;
        }
      }

      // Cursor trail
      trail.push({ ...mouse });
      if (trail.length > TRAIL_LEN) trail.shift();
      if (trail.length > 2) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        const grad = ctx.createLinearGradient(trail[0].x, trail[0].y, mouse.x, mouse.y);
        grad.addColorStop(0, "rgba(123, 111, 255, 0.02)");  // violet tail
        grad.addColorStop(0.5, "rgba(74, 240, 208, 0.12)"); // teal middle
        grad.addColorStop(1, "rgba(196, 245, 66, 0.35)");    // acid lime head
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      particles.forEach(p => { 
        p.update(t, mouse.x, mouse.y, shockwave, scrollProgress); 
        p.draw(ctx); 
      });

      // Draw full screen boom flash if active
      if (stateRef.current.boomFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${stateRef.current.boomFlash})`;
        ctx.fillRect(0, 0, W, H);
        stateRef.current.boomFlash -= 0.045; // fade out over 16 frames
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    loop();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("celestial-boom", onCelestialBoom);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}
    />
  );
}


// ─────────────────────────────────────────────────
// Orbital Ring (CSS only)
// ─────────────────────────────────────────────────
const orbitalStyle = {
  position: "absolute",
  borderRadius: "50%",
  border: "1px solid transparent",
  background: `
    linear-gradient(#050c18, #050c18) padding-box,
    conic-gradient(from 0deg, #4af0d0, #7b6fff, #c4f542, #4af0d0) border-box
  `,
  opacity: 0.4,
  animation: "spin 18s linear infinite",
  pointerEvents: "none",
};

// ─────────────────────────────────────────────────
// Hero Content
// ─────────────────────────────────────────────────
export default function HeroSection({ cosmicMode, onConsultDeck, onReadChart }) {
  const [hovered, setHovered] = useState(false);
  const headlineRef = useRef(null);

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Inter:wght@300;400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spinRev { to { transform: rotate(-360deg); } }
        @keyframes floatOrb { 0%,100% { transform: translate(-50%,-52%); } 50% { transform: translate(-50%,-48%); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.45; transform:scale(.7); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}</style>

      {/* Fullscreen dust canvas - only in interactive mode */}
      {cosmicMode === 'interactive' && <DustCanvas headlineRef={headlineRef} />}

      {/* Hero wrapper */}
      <section style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        overflow: "hidden",
        background: "transparent",
        fontFamily: "'Inter', sans-serif",
        color: "#d6f0ff",
      }}>

        {/* ── Content ── */}
        <div style={{
          position: "relative",
          textAlign: "center",
          maxWidth: 760,
          paddingTop: "90px",
          animation: "fadeUp 1.3s cubic-bezier(.22,1,.36,1) both",
        }}>

          {/* Eyebrow */}
          <p className="hero-eyebrow" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "#4af0d0",
            textTransform: "uppercase",
            marginBottom: 20,
            opacity: 0.85,
          }}>
            [ CELESTIAL_TELEMETRY // INTERACTIVE_ENGINE ]
          </p>

          {/* Main headline */}
          <h1 ref={headlineRef} className="hero-headline" style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            lineHeight: 1.12,
            letterSpacing: "0.08em",
            margin: "0 0 12px",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}>
            QUANTUM STARDUST
          </h1>

          {/* Sub-headline */}
          <p className="hero-subtitle" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "clamp(1.1rem, 2.4vw, 1.5rem)",
            color: "rgba(180,220,255,.7)",
            letterSpacing: "0.06em",
            marginBottom: 20,
          }}>
            Play as you wish.
          </p>

          {/* Body copy */}
          <p className="hero-description-container" style={{
            fontSize: "clamp(.9rem, 1.6vw, 1.02rem)",
            lineHeight: 1.8,
            color: "rgba(180,220,255,.6)",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            maxWidth: 580,
            margin: "0 auto 36px",
          }}>
            Navigate the playing area to make asteroids in star ways, or click the screen to ignite suns and stardust shockwaves.
          </p>

          {/* Scroll hint */}
          <div style={{
            marginTop: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: 0.4,
          }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.3em",
              color: "#4af0d0", textTransform: "uppercase" }}>Scroll</span>
            <div style={{ width: 1, height: 40,
              background: "linear-gradient(180deg, #4af0d0, transparent)" }} />
          </div>
        </div>

      </section>
    </>
  );
}
