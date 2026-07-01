import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from './components/Header';
import SpaceScene from './components/SpaceScene';
import ChartGenerator from './components/ChartGenerator';
import FeedbackConsole from './components/FeedbackConsole';
import HeroSection from './components/HeroSection';
import CelestialDrawingBoard from './components/CelestialDrawingBoard';
import Lenis from 'lenis';

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const stageSubtitles = [
  "AI-Powered Astrology Observatory",
  "Decoding Natal Placements // Birth Chart Grid",
  "Consulting Stellar Oracle // Major Arcana",
  "Analyzing Cosmic Transits // Planetary Influence",
  "Calculating Lunar Position // Manifestation Align",
  "Hyperspace Singularity // Portal Active"
];

const GUIDANCE_PROMPTS = [
  "SCROLL DOWN TO ENTER OBSERVED TELEMETRY",
  "CONJURATION STATE // HOVER FLOATING CARDS TO REVEAL KEY ALIGNMENTS",
  "ALIGNMENT ACTIVE // DRAG CHART GRAPH TO ALIGN RADIAL COORDINATES",
  "STELLAR ORACLE SYNC // CONSULT REVEALED ZODIAC CARDS",
  "PLANETARY INFLUENCE ACTIVE // SELECT PLANETS TO CALIBRATE CYCLES",
  "HYPERSPACE TRANSIT ACTIVE // CLICK DESCENT TO LAUNCH SYNCHRONIZATION"
];

const PLANET_CORE = {
  Sun: { icon: "☀️", name: "Sun", action: "shines a bright light on your", focus: "who you are and what you want to create" },
  Moon: { icon: "🌙", name: "Moon", action: "stirs up deep emotions inside your", focus: "instincts, habits, and inner security" },
  Mercury: { icon: "💬", name: "Mercury", action: "speeds up thoughts and conversations in your", focus: "ideas, emails, and local travels" },
  Venus: { icon: "❤️", name: "Venus", action: "brings love, beauty, and harmony to your", focus: "relationships and your sense of self-worth" },
  Mars: { icon: "🔥", name: "Mars", action: "pumps raw energy and motivation into your", focus: "goals, ambitions, and physical drive" },
  Jupiter: { icon: "✨", name: "Jupiter", action: "expands luck, abundance, and wisdom in your", focus: "learning, belief systems, and growth opportunities" },
  Saturn: { icon: "🪐", name: "Saturn", action: "asks for patience, discipline, and boundaries in your", focus: "long-term duties and life lessons" },
  Uranus: { icon: "⚡", name: "Uranus", action: "sparks sudden changes and breakthroughs in your", focus: "unconventional thoughts and freedom" },
  Neptune: { icon: "🌊", name: "Neptune", action: "brings dreamy intuition and creative imagination to your", focus: "dreams, artistic flow, and spiritual path" },
  Pluto: { icon: "💀", name: "Pluto", action: "drives deep personal transformation and rebirth in your", focus: "inner strength and lets go of old habits" }
};

const SIGN_HOUSE = {
  Aries: { area: "First House of Self", effect: "helping you feel bold, physically energized, and ready to lead with raw momentum" },
  Taurus: { area: "Second House of values and money", effect: "helping you secure your savings, enjoy comfort, and value what you own" },
  Gemini: { area: "Third House of mind and communication", effect: "making you curious, quick-witted, and ready to share ideas with your friends" },
  Cancer: { area: "Fourth House of home and family", effect: "making you feel protective, cozy, and closely connected to your roots" },
  Leo: { area: "Fifth House of passion and creativity", effect: "letting you express yourself dramatically, fall in love, and enjoy playtime" },
  Virgo: { area: "Sixth House of health and daily routines", effect: "helping you tidy up your space, focus on wellness, and analyze details" },
  Libra: { area: "Seventh House of partnerships", effect: "helping you find peace, balance, and compromise in your close relationships" },
  Scorpio: { area: "Eighth House of transformation and trust", effect: "guiding you to build deeper trust, manage shared finances, and shed old baggage" },
  Sagittarius: { area: "Ninth House of travel and beliefs", effect: "pushing you to explore new horizons, learn something exciting, and expand your mind" },
  Capricorn: { area: "Tenth House of career and status", effect: "solidifying your professional reputation, focus, and long-term milestones" },
  Aquarius: { area: "Eleventh House of friendships and dreams", effect: "activating your teamwork skills, humanitarian goals, and group circles" },
  Pisces: { area: "Twelfth House of soul and dreams", effect: "unlocking deep empathy, artistic solitude, and peaceful inner surrender" }
};

function getPlanetInfluence(planet, signName) {
  if (!planet || !signName) return "";
  const p = PLANET_CORE[planet];
  const s = SIGN_HOUSE[signName];
  if (!p || !s) return "";
  return `${p.icon} The ${p.name} transit is currently active in your ${s.area}! This ${p.action} ${p.focus}, while ${s.effect}. It's a perfect time to align with this energy.`;
}

function getPlanetGlyph(planet) {
  const glyphs = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
    Uranus: "⛢",
    Neptune: "♆",
    Pluto: "♇"
  };
  return glyphs[planet] || "";
}

const PLANET_COLORS = {
  Sun: "#EF4444",
  Moon: "#94A3B8",
  Mercury: "#60A5FA",
  Venus: "#F472B6",
  Mars: "#DC2626",
  Jupiter: "#FBBF24",
  Saturn: "#F59E0B",
  Uranus: "#34D399",
  Neptune: "#818CF8",
  Pluto: "#A78BFA"
};

export default function App() {
  const containerRef = useRef(null);
  const flashRef = useRef(null);
  const vignetteRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const hudRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const lastPageRef = useRef(null);
  const prevStageIndex = useRef(0);
  const lenisRef = useRef(null);

  // Shared refs to feed R3F Canvas
  const scrollProgress = useRef(0.0);
  const portalOpenVal = useRef(0.0);
  const rippleOrigin = useRef(new THREE.Vector3(0, 0, 0));
  const rippleProgress = useRef(0.0);

  // React states

  const [isAudioActive, setIsAudioActive] = useState(false);
  const [subtitleText, setSubtitleText] = useState(stageSubtitles[0]);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [cosmicMode, setCosmicMode] = useState('3d'); // 'interactive' or '3d'
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [userSign, setUserSign] = useState(() => {
    const savedChart = localStorage.getItem("astropera_chart");
    if (savedChart) {
      try {
        const parsed = JSON.parse(savedChart);
        if (parsed?.chartDetails?.sun?.sign) {
          return parsed.chartDetails.sun.sign;
        }
      } catch (e) {
        console.error("Error parsing saved profile:", e);
      }
    }
    return "Libra"; // Default guest user to Libra instead of null to bypass the gate
  });
  const [showSignDropdown, setShowSignDropdown] = useState(false);
  const [decoderSynced, setDecoderSynced] = useState(false);
  const [syncedPlanets, setSyncedPlanets] = useState([]);
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  const decoderSyncedRef = useRef(false);
  const syncedPlanetsRef = useRef([]);
  const selectedPlanetRef = useRef(null);

  useEffect(() => {
    decoderSyncedRef.current = decoderSynced;
  }, [decoderSynced]);

  useEffect(() => {
    syncedPlanetsRef.current = syncedPlanets;
  }, [syncedPlanets]);

  useEffect(() => {
    selectedPlanetRef.current = selectedPlanet;
  }, [selectedPlanet]);

  useEffect(() => {
    setDecoderSynced(false);
    setSyncedPlanets([]);
  }, [userSign]);

  const handleToggleCosmicMode = (targetMode) => {
    if (typeof targetMode === 'string') {
      setCosmicMode(targetMode);
    } else {
      setCosmicMode(prev => prev === 'interactive' ? '3d' : 'interactive');
    }
  };

  useEffect(() => {
    const handleOpen = () => setShowGenerator(true);
    window.addEventListener('open-generator', handleOpen);
    return () => window.removeEventListener('open-generator', handleOpen);
  }, []);

  useEffect(() => {
    const handleFeedback = () => setShowFeedback(true);
    window.addEventListener('open-feedback', handleFeedback);
    return () => window.removeEventListener('open-feedback', handleFeedback);
  }, []);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // HUD variables for rolling metrics
  const [raVal, setRaVal] = useState(45.18);
  const [decVal, setDecVal] = useState(24.05);
  const [velVal, setVelVal] = useState(32.4);

  // Disable scroll restoration on mount to guarantee fresh load at top (0,0)
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Initialize Lenis smooth scroll and connect to GSAP ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
      infinite: false,
    });

      lenisRef.current = lenis;

      // Force scroll to top immediately to prevent browser scroll restoration glitches
      lenis.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      lenis.on('scroll', () => {
        ScrollTrigger.update();
      });

      // Scroll locking / force-stopping listeners (for drop/blast transition)
      const handleLock = () => {
        document.body.style.overflow = 'hidden'; // strict browser scroll stopper
        setIsScrollLocked(true);
        if (lenisRef.current) {
          lenisRef.current.stop();
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          // Smoothly pull viewport to exactly 41.5% where particle drop takes place
          lenisRef.current.scrollTo(maxScroll * 0.415, { immediate: false, duration: 1.2 });
        }
      };
      const handleUnlock = () => {
        document.body.style.overflow = ''; // restore browser scroll
        setIsScrollLocked(false);
        if (lenisRef.current) {
          lenisRef.current.start();
        }
      };

      const handleScrollTo = (e) => {
        const { target, duration } = e.detail;
        if (lenisRef.current) {
          lenisRef.current.scrollTo(target, { immediate: false, duration: duration || 1.5 });
        } else {
          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      };

      window.addEventListener('lock-scroll', handleLock);
      window.addEventListener('unlock-scroll', handleUnlock);
      window.addEventListener('lenis-scroll-to', handleScrollTo);

      return () => {
        lenis.destroy();
        lenisRef.current = null;
        window.removeEventListener('lock-scroll', handleLock);
        window.removeEventListener('unlock-scroll', handleUnlock);
        window.removeEventListener('lenis-scroll-to', handleScrollTo);
      };
    }, []);

  // Fast Rolling Metrics Engine (runs continuously, simulating cosmic telemetry)
  useEffect(() => {
    let frameId;
    const updateTicker = () => {
      // Subtle micro-decimal roll for RA and DEC
      setRaVal(prev => {
        const next = prev + (Math.random() - 0.5) * 0.08;
        return next < 0 ? 59.9 : next > 59.9 ? 0 : parseFloat(next.toFixed(2));
      });
      setDecVal(prev => {
        const next = prev + (Math.random() - 0.5) * 0.06;
        return next < 0 ? 59.9 : next > 59.9 ? 0 : parseFloat(next.toFixed(2));
      });
      // Velocity pulses based on scroll depth
      setVelVal(() => {
        const baseSpeed = 28.4 + (scrollProgress.current * 140.0); // accelerates during portal warp!
        const jitter = (Math.random() - 0.5) * 0.4;
        return parseFloat((baseSpeed + jitter).toFixed(1));
      });

      frameId = requestAnimationFrame(updateTicker);
    };

    frameId = requestAnimationFrame(updateTicker);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // One-shot entrance animation on mount
  useEffect(() => {
    gsap.timeline()
      .fromTo(".navbar",
        { y: -25, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
      )
      .fromTo(".hero-main-title", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 0.3, duration: 1.8, ease: "power4.out" },
        "-=0.9"
      )
      .fromTo(".hero-eyebrow",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1.0, duration: 1.0, ease: "power3.out" },
        "<0.2"
      )
      .fromTo(".hero-headline",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1.0, duration: 1.2, ease: "power3.out" },
        "<0.2"
      )
      .fromTo(".hero-subtitle",
        { opacity: 0, scale: 0.95 },
        { opacity: 1.0, scale: 1.0, duration: 1.0, ease: "power3.out" },
        "<0.3"
      )
      .fromTo(".hero-description-container",
        { opacity: 0, y: 20 },
        { opacity: 1.0, y: 0, duration: 1.0, ease: "power2.out" },
        "<0.3"
      )
      .fromTo(".hero-celestial-seal-console",
        { opacity: 0, y: 15, pointerEvents: "none" },
        { opacity: 1.0, y: 0, pointerEvents: "auto", duration: 1.0, ease: "power2.out" },
        "<0.4"
      )
      .fromTo(".hud-metrics, .scroll-indicator",
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: "power2.out" },
        "-=0.6"
      );
  }, []);

  // GSAP ScrollTrigger setup
  useEffect(() => {
    // 1. Setup ScrollTrigger to track progress and sync to window global
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const progress = self.progress;
        window.cosmicScrollProgress = progress; // Directly write progress to global
        const percent = Math.floor(progress * 100);

        // Update progress bar and text directly in DOM for performance (avoiding React state re-renders)
        const fillEl = document.querySelector('.scroll-line-fill');
        if (fillEl) fillEl.style.width = `${percent}%`;

        const textEl = document.querySelector('.descent-profile-text');
        if (textEl) textEl.textContent = `DESCENT PROFILE ${percent}%`;

        const titleOverlay = document.querySelector('.title-overlay');
        if (titleOverlay) {
          titleOverlay.style.opacity = Math.max(0, Math.min(1, 1 - (percent / 10)));
          titleOverlay.style.pointerEvents = percent < 8 ? 'auto' : 'none';
          titleOverlay.style.transform = `translate(-50%, calc(-50% - ${percent * 1.8}px))`;
        }

          // A. Calculate Stage Index based on the redesigned scroll sequence
          // Stage 0: 0.0 - 0.15 (Hero)
          // Stage 1: 0.15 - 0.25 (Orb cracks)
          // Stage 2: 0.25 - 0.40 (Birth Chart)
          // Stage 3: 0.40 - 0.55 (Tarot)
          // Stage 4: 0.55 - 0.70 (Transits)
          // Stage 5: > 0.70 (Portal jump)
          let currentStage = 0;
          if (progress >= 0.70) {
            currentStage = 5;
          } else if (progress >= 0.55) {
            currentStage = 4;
          } else if (progress >= 0.40) {
            currentStage = 3;
          } else if (progress >= 0.25) {
            currentStage = 2;
          } else if (progress >= 0.15) {
            currentStage = 1;
          } else {
            currentStage = 0;
          }

          setCurrentStage(prev => {
            if (prev !== currentStage) {
              return currentStage;
            }
            return prev;
          });

          // B. Calculate scroll-bound flash opacity at stage boundaries (subtle cosmic glow)
          const boundaries = [0.15, 0.25, 0.40, 0.55, 0.70];
          let flashOpacity = 0;
          boundaries.forEach((b, idx) => {
            const dist = Math.abs(progress - b);
            const width = idx === 4 ? 0.06 : 0.025; // narrower width for more immediate, subtler transition
            if (dist < width) {
              const intensity = 1.0 - (dist / width);
              const eased = Math.pow(intensity, 4); // sharp peak
              const maxOp = idx === 4 ? 0.45 : 0.18; // significantly reduced peak opacity
              flashOpacity = Math.max(flashOpacity, eased * maxOp);
            }
          });

          if (flashRef.current) {
            flashRef.current.style.opacity = flashOpacity;
          }

          // C. Fade out HUD overlays and activate final Zodiac page at the end of the scroll timeline (when entering portal)
          const fadeStart = 0.92;
          const fadeEnd = 0.96;
          if (progress > fadeStart) {
            const factor = Math.min(1.0, (progress - fadeStart) / (fadeEnd - fadeStart)); // 0.0 -> 1.0
            const opacity = 1.0 - factor;
            
            if (hudRef.current) {
              hudRef.current.style.opacity = opacity;
              hudRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
            }
            if (scrollIndicatorRef.current) {
              scrollIndicatorRef.current.style.opacity = opacity;
              scrollIndicatorRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
            }
          } else {
            if (hudRef.current) {
              const isCurrentlyTracingPlanet = selectedPlanetRef.current && !syncedPlanetsRef.current.includes(selectedPlanetRef.current);
              const isHudAllowed = (currentStage === 1 || currentStage === 2) || 
                                   (currentStage === 4 && decoderSyncedRef.current && !isCurrentlyTracingPlanet);
              hudRef.current.style.opacity = isHudAllowed ? 1.0 : 0.0;
              hudRef.current.style.pointerEvents = isHudAllowed ? 'auto' : 'none';
            }
            if (scrollIndicatorRef.current) {
              scrollIndicatorRef.current.style.opacity = 1.0;
              scrollIndicatorRef.current.style.pointerEvents = 'auto';
            }
          }

          // D. Subtitle text morphs smoothly in both scroll directions on stage changes
          if (currentStage !== prevStageIndex.current) {
            setSubtitleText(stageSubtitles[currentStage]);
            prevStageIndex.current = currentStage;
          }

          // E. Deepen Vignette Overlay during Portal Warp Stage (scroll > 0.70)
          if (vignetteRef.current) {
            if (progress > 0.70) {
              const warpFactor = (progress - 0.70) / 0.30; // 0.0 -> 1.0
              vignetteRef.current.style.opacity = 0.5 + warpFactor * 0.45; // deepens edge shadow
            } else {
              vignetteRef.current.style.opacity = 0.5;
            }
          }

          // If scrolled past hero section, force hover to false to prevent ghost interactions
          if (progress >= 0.15) {
            setIsCtaHovered(false);
          }
        }
      });




    // 3. Fade out introductory notice on scroll
    gsap.to(".introduction-overlay", {
      opacity: 0,
      y: -20,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "10% top",
        scrub: 0.5
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [cosmicMode]);

  const handlePrimaryCtaClick = () => {
    setShowGenerator(true);
  };

  const handleSecondaryCtaClick = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: maxScroll * 0.16,
      behavior: 'smooth'
    });
  };

  const activePlanet = hoveredPlanet || selectedPlanet || "Saturn";
  const [subLeft, subRight] = subtitleText.includes(' // ') ? subtitleText.split(' // ') : [subtitleText, ''];

  return (
    <div ref={containerRef} className={`app-container cosmic-mode-${cosmicMode}`} style={{ position: 'relative' }}>
      
      <SpaceScene 
        wrapperRef={canvasWrapperRef}
        scrollProgress={scrollProgress} 
        portalOpenVal={portalOpenVal}
        rippleOrigin={rippleOrigin}
        rippleProgress={rippleProgress}
        onToggleAudioActive={setIsAudioActive}
        lastPageRef={lastPageRef}
        isCtaHovered={isCtaHovered}
        selectedPlanet={activePlanet}
        cosmicMode={cosmicMode}
        decoderSynced={decoderSynced}
      />

      {/* Dynamic Overlay & HTML Layer */}
      <div className="ui-layer">
        
        {/* Premium Atmospheric Overlay & Noise */}
        <div className="noise-overlay" />
        <div className="cosmic-aurora-container">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>

        {/* Ambient Film Grain Layer */}
        <div className="film-grain" />

        {/* Edge Vignette overlay */}
        <div ref={vignetteRef} className="vignette-overlay" />

        {/* Hyperspace Jump Cut flash container */}
        <div ref={flashRef} className="hyperspace-flash" />

        {/* Dynamic Instructional Guidance HUD Bar */}
        {cosmicMode === '3d' && (
          <div className="dynamic-guidance-hud">
            <span className="guidance-prefix">// SEC_GUIDE: </span>
            <span className="guidance-text">{GUIDANCE_PROMPTS[currentStage]}</span>
          </div>
        )}

        {/* Planetary Selector HUD overlay for Interactive Space */}
        {cosmicMode === 'interactive' && userSign && (
          <div ref={hudRef} className={`planetary-influence-hud ${((currentStage === 1 || currentStage === 2) || (currentStage === 4 && decoderSynced && !(selectedPlanet && !syncedPlanets.includes(selectedPlanet)))) ? 'active' : ''}`}>
            <div className="hud-title-row" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="hud-label-tiny">TRANSIT_CALIBRATION // INTERACTIVE</span>
                <button 
                  style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em', outline: 'none', textTransform: 'uppercase' }}
                  onClick={() => setShowSignDropdown(!showSignDropdown)}
                >
                  {userSign ? `${userSign} ▾` : "SELECT SIGN ▾"}
                </button>
              </div>
              <h3 className="hud-main-title">PLANETARY DECODER</h3>
              
              {showSignDropdown && (
                <div className="hud-sign-dropdown">
                  {[
                    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
                  ].map(sign => (
                    <div 
                      key={sign}
                      className={`dropdown-item ${userSign === sign ? 'active' : ''}`}
                      onClick={() => {
                        setUserSign(sign);
                        setShowSignDropdown(false);
                      }}
                    >
                      {sign.toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="planet-selector-buttons">
              {[
                { id: "Sun", label: "☉ SUN", desc: "Identity" },
                { id: "Moon", label: "☽ MOON", desc: "Emotion" },
                { id: "Mercury", label: "☿ MERCURY", desc: "Mind" },
                { id: "Venus", label: "♀ VENUS", desc: "Harmony" },
                { id: "Mars", label: "♂ MARS", desc: "Drive" },
                { id: "Jupiter", label: "♃ JUPITER", desc: "Growth" },
                { id: "Saturn", label: "♄ SATURN", desc: "Structure" },
                { id: "Uranus", label: "⛢ URANUS", desc: "Innovation" },
                { id: "Neptune", label: "♆ NEPTUNE", desc: "Dreams" },
                { id: "Pluto", label: "♇ PLUTO", desc: "Rebirth" }
              ].map(planet => {
                const isBtnActive = selectedPlanet === planet.id || hoveredPlanet === planet.id;
                const isDecoderSec = currentStage === 4;
                const isSynced = !isDecoderSec || syncedPlanets.includes(planet.id);
                return (
                  <button 
                    key={planet.id}
                    className={`planet-hud-btn ${isBtnActive ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredPlanet(planet.id)}
                    onMouseLeave={() => setHoveredPlanet(null)}
                    onClick={() => setSelectedPlanet(planet.id)}
                  >
                    <div className="planet-btn-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{planet.label}</span>
                      {isDecoderSec && (
                        isSynced ? (
                          <span style={{ color: '#4af0d0', fontSize: '9px', textShadow: '0 0 6px #4af0d0' }}>●</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '8px' }}>🔒</span>
                        )
                      )}
                    </div>
                    <div className="planet-btn-desc">{planet.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Holographic Center Transit Influence Popup */}
        {cosmicMode === 'interactive' && hoveredPlanet && userSign && 
          ((currentStage === 1 || currentStage === 2) || 
           (currentStage === 4 && decoderSynced)) && (
          <div 
            className="center-transit-popup"
            style={{
              '--planet-color': PLANET_COLORS[hoveredPlanet] || '#f59e0b',
              '--planet-color-glow': `${PLANET_COLORS[hoveredPlanet] || '#f59e0b'}3d`
            }}
          >
            <div className="corner-bracket cb-tl"></div>
            <div className="corner-bracket cb-br"></div>
            <div className="popup-header">
              <span className="popup-glyph">{getPlanetGlyph(hoveredPlanet)}</span>
              <h2 className="popup-title">{hoveredPlanet.toUpperCase()} TRANSIT REPORT</h2>
            </div>
            <div className="popup-divider">
              <span className="popup-node"></span>
              <span className="popup-line"></span>
              <span className="popup-node"></span>
            </div>
            <p className="popup-paragraph">
              {getPlanetInfluence(hoveredPlanet, userSign)}
            </p>
            <div className="popup-footer">
              <span>TELEMETRY_INDEX // CALIBRATED_FOR_{userSign.toUpperCase()}</span>
            </div>
          </div>
        )}
        {/* Zodiac Sign Drawing Guide / Trace Minigame */}
        <CelestialDrawingBoard 
          activeTarget={userSign}
          isPlanet={false}
          isActive={cosmicMode === 'interactive' && currentStage === 4 && !decoderSynced}
          availablePool={[userSign, "Aries", "Taurus", "Leo", "Libra", "Scorpio"].filter((v, idx, arr) => v && arr.indexOf(v) === idx).slice(0, 6)}
          onChangeTarget={setUserSign}
          onComplete={() => {
            setDecoderSynced(true);
            setTimeout(() => {
              setSelectedPlanet("Sun");
            }, 1200);
            window.dispatchEvent(new CustomEvent('celestial-boom', { 
              detail: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 } 
            }));
          }}
        />

        {/* Planet Glyph Drawing Guide / Subsequent Tracing Target */}
        <CelestialDrawingBoard 
          activeTarget={selectedPlanet}
          isPlanet={true}
          isActive={
            cosmicMode === 'interactive' && 
            currentStage === 4 && 
            decoderSynced && 
            selectedPlanet && 
            !syncedPlanets.includes(selectedPlanet)
          }
          availablePool={["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].filter(p => !syncedPlanets.includes(p)).slice(0, 6)}
          onChangeTarget={setSelectedPlanet}
          onComplete={() => {
            setSyncedPlanets(prev => {
              const nextSynced = [...prev, selectedPlanet];
              const planetsList = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
              const nextPlanet = planetsList.find(p => !nextSynced.includes(p));
              if (nextPlanet) {
                setTimeout(() => {
                  setSelectedPlanet(nextPlanet);
                }, 1200);
              }
              return nextSynced;
            });
            window.dispatchEvent(new CustomEvent('celestial-boom', { 
              detail: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 } 
            }));
          }}
        />
        {/* Luxury Header */}
        <Header cosmicMode={cosmicMode} onToggleCosmicMode={handleToggleCosmicMode} />

        {/* Introduction / Instruction Overlay */}
        {cosmicMode === '3d' && (
          <div className="introduction-overlay">
            <div className="intro-line intro-line-1">Welcome to the sanctuary.</div>
            <div className="intro-line intro-line-2">
              {isTouchDevice ? "Tap star nodes to map connections." : "Hover star nodes to map connections."}
            </div>
            <div className="intro-line intro-line-3">
              {isTouchDevice ? "Sync ambient audio & drag to descend." : "Sync ambient audio & scroll to descend."}
            </div>
          </div>
        )}

        {cosmicMode === 'interactive' ? (
          <HeroSection 
            cosmicMode={cosmicMode}
            onConsultDeck={() => setShowGenerator(true)}
            onReadChart={handleSecondaryCtaClick}
          />
        ) : (
          /* Title Overlay: Anchored in 3D center depth */
          <div 
            className="title-overlay"
            style={{
              opacity: 1,
              pointerEvents: 'auto',
              transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Background majestic watermark title */}
            <h1 className="hero-main-title">ASTROPERA</h1>

            {/* Foreground high-clarity content layout */}
            <div className="hero-content-block">
              <h2 className="hero-headline">YOUR COSMIC ALIGNMENT, DECODED.</h2>

              <div className="hero-subtitle">
                <span className="subtitle-left">{subLeft}</span>
                {subRight && <span className="subtitle-divider">|</span>}
                {subRight && <span className="subtitle-right">{subRight}</span>}
                <span className="blinking-cursor">_</span>
              </div>

              <div className="hero-description-container">
                <p className="hero-explanation">
                  Birth Charts • Tarot • Planetary Forecasts
                </p>
                <p className="hero-subexplanation">
                  Powered by AI
                </p>
              </div>

              {/* Features Checklist / Tertiary Nodes */}
              <div className="hero-features-checklist">
                <div className="hero-feature-item">
                  <span className="feature-bullet">✦</span>
                  <span className="feature-name">Birth Charts</span>
                </div>
                <div className="hero-feature-item">
                  <span className="feature-bullet">✦</span>
                  <span className="feature-name">Tarot Readings</span>
                </div>
                <div className="hero-feature-item">
                  <span className="feature-bullet">✦</span>
                  <span className="feature-name">Planetary Transits</span>
                </div>
                <div className="hero-feature-item">
                  <span className="feature-bullet">✦</span>
                  <span className="feature-name">Zodiac Insights</span>
                </div>
              </div>

              {/* Awwwards-level Celestial Console CTA System */}
              <div className="hero-celestial-seal-console">
                {/* Primary CTA: Circular holographic astrolabe seal */}
                <div 
                  className="celestial-seal-widget" 
                  onClick={handlePrimaryCtaClick}
                  onMouseEnter={() => {
                    if (scrollProgress.current < 0.15) {
                      setIsCtaHovered(true);
                    }
                  }}
                  onMouseLeave={() => setIsCtaHovered(false)}
                >
                  <div className="seal-orbit seal-orbit-outer">
                    <div className="seal-node node-outer-1"></div>
                    <div className="seal-node node-outer-2"></div>
                  </div>
                  <div className="seal-orbit seal-orbit-inner">
                    <div className="seal-node node-inner-1"></div>
                  </div>
                  
                  {/* SVG details: degrees ticks, crosshairs */}
                  <svg viewBox="0 0 160 160" className="seal-ticks-svg">
                    <circle cx="80" cy="80" r="72" stroke="rgba(167, 139, 250, 0.18)" strokeWidth="0.8" fill="none" strokeDasharray="3,3" />
                    <circle cx="80" cy="80" r="58" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="0.8" fill="none" />
                    <line x1="80" y1="5" x2="80" y2="155" stroke="rgba(167, 139, 250, 0.15)" strokeWidth="0.5" strokeDasharray="4,4" />
                    <line x1="5" y1="80" x2="155" y2="80" stroke="rgba(167, 139, 250, 0.15)" strokeWidth="0.5" strokeDasharray="4,4" />
                    {/* Outer ticks */}
                    <path d="M80 5 L80 12 M80 148 L80 155 M5 80 L12 80 M148 80 L155 80" stroke="rgba(255, 215, 0, 0.4)" strokeWidth="1" />
                  </svg>

                  {/* Center glass capsule button text */}
                  <div className="seal-capsule">
                    <span className="seal-glow-core"></span>
                    <span className="seal-text-top">GENERATE</span>
                    <span className="seal-text-center">COSMIC PROFILE</span>
                    <span className="seal-text-bottom">SYS_SYNC_01</span>
                  </div>
                </div>

                {/* Secondary CTA: Diagnostic Descent Link */}
                <div className="descent-diag-anchor" onClick={handleSecondaryCtaClick}>
                  <span className="diag-bracket">[</span>
                  <span className="diag-text">SEEK_OBSERVATORY_DESCENT // 01.16</span>
                  <span className="diag-bracket">]</span>
                  <div className="diag-scan-sweep"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Spatial HUD Metrics (Left Bottom) */}
        <div ref={hudRef} className="hud-metrics">
          <div className="hud-line">
            <span className="hud-prompt">&gt;</span>
            <span className="hud-label">OBS:</span>
            <span className="hud-value">ASTROPERA_V1.0</span>
          </div>
          <div className="hud-line">
            <span className="hud-prompt">&gt;</span>
            <span className="hud-label">RA:</span>
            <span className="hud-value">12h 45m {raVal.toFixed(2)}s</span>
          </div>
          <div className="hud-line">
            <span className="hud-prompt">&gt;</span>
            <span className="hud-label">DEC:</span>
            <span className="hud-value">-11° 24' {decVal.toFixed(2)}"</span>
          </div>
          <div className="hud-line">
            <span className="hud-prompt">&gt;</span>
            <span className="hud-label">VEL:</span>
            <span className="hud-value">{velVal.toFixed(1)} km/s</span>
          </div>
          <div className="hud-line" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
            <span className="hud-prompt">&gt;</span>
            <span className="hud-label">VOICE:</span>
            <span className="hud-value" style={{ color: isAudioActive ? '#00FFCC' : '#94A3B8' }}>
              {isAudioActive ? "SYNCHRONIZED" : "MUTED"}
            </span>
          </div>
        </div>

        {/* Scroll Progress Metric HUD (Right Bottom) */}
        <div ref={scrollIndicatorRef} className="scroll-indicator">
          <div className="scroll-line-bg">
            <div 
              className="scroll-line-fill" 
              style={{ width: '0%' }}
            />
          </div>
          <span className="descent-profile-text">DESCENT PROFILE 0%</span>
        </div>



        {/* Scroll Sections spacing to generate viewport trigger limits */}
        <div className="scroll-sections">
          <div className="scroll-sec"></div> {/* Stage 1: Entrance */}
          <div className="scroll-sec"></div> {/* Stage 2: Reveal Title */}
          <div className="scroll-sec"></div> {/* Stage 3: Dynamic Align */}
          <div className="scroll-sec"></div> {/* Stage 4: Portal Gate */}
          <div className="scroll-sec"></div> {/* Stage 5: Transition */}
        </div>

        {/* Last Page Overlay: Zodiac Selector & Contacts */}
        {currentStage === 5 && (
          <LastPageSection 
            ref={lastPageRef} 
            rippleOrigin={rippleOrigin}
            rippleProgress={rippleProgress}
            onToggleAudioActive={setIsAudioActive}
          />
        )}

        {showGenerator && (
          <ChartGenerator onClose={() => setShowGenerator(false)} />
        )}

        {showFeedback && (
          <FeedbackConsole onClose={() => setShowFeedback(false)} />
        )}

        {isScrollLocked && (
          <div className="scroll-lock-notice">
            <div className="warning-scanner-line" />
            <div className="warning-diag-stripes" />
            
            <div className="warning-header-row">
              <span className="warning-icon-blink">⚠️</span>
              <span className="warning-title-text">GRAVITY_LOCK_ACTIVE</span>
              <span className="warning-icon-blink">⚠️</span>
            </div>
            
            <div className="warning-body-content">
              <p className="warning-main-msg">
                OH, U TRYNNA SCROLL DOWN? MUHEHE IT WON'T MOVE 😂
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Constellations data with viewport offset positions (cx, cy) and nodes that form the glyph outlines
const constellations = [
  {
    name: "ARIES",
    nature: "THE PIONEER",
    glyph: "♈",
    ra: "02h 38m",
    dec: "+20° 48'",
    cx: 0.12,
    cy: 0.50,
    hoverProgress: 0.0,
    nodes: [
      [0.0, 0.12],      // Bottom
      [0.0, 0.0],       // Middle
      [0.0, -0.06],     // Split top
      [-0.06, -0.12],   // Left peak
      [-0.12, -0.06],   // Left end
      [0.06, -0.12],    // Right peak
      [0.12, -0.06]     // Right end
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]]
  },
  {
    name: "TAURUS",
    nature: "THE ANCHOR",
    glyph: "♉",
    ra: "04h 42m",
    dec: "+19° 12'",
    cx: 0.17,
    cy: 0.68,
    hoverProgress: 0.0,
    nodes: [
      [0.0, 0.1],       // Circle bottom
      [-0.08, 0.04],    // Circle left
      [0.08, 0.04],     // Circle right
      [-0.05, -0.03],   // Left horn base
      [0.05, -0.03],    // Right horn base
      [-0.12, -0.14],   // Left horn tip
      [0.12, -0.14]     // Right horn tip
    ],
    lines: [[0, 1], [1, 3], [3, 4], [4, 2], [2, 0], [3, 5], [4, 6]]
  },
  {
    name: "GEMINI",
    nature: "THE MESSENGER",
    glyph: "♊",
    ra: "07h 12m",
    dec: "+22° 08'",
    cx: 0.31,
    cy: 0.81,
    hoverProgress: 0.0,
    nodes: [
      [-0.1, -0.12],    // Top left
      [0.1, -0.12],     // Top right
      [-0.1, 0.12],     // Bottom left
      [0.1, 0.12],      // Bottom right
      [-0.06, -0.09],   // Pillar 1 top
      [-0.06, 0.09],    // Pillar 1 bottom
      [0.06, -0.09],    // Pillar 2 top
      [0.06, 0.09],     // Pillar 2 bottom
      [-0.06, 0.0],     // Pillar 1 mid
      [0.06, 0.0]       // Pillar 2 mid
    ],
    lines: [[0, 1], [2, 3], [4, 8], [8, 5], [6, 9], [9, 7]]
  },
  {
    name: "CANCER",
    nature: "THE PROTECTOR",
    glyph: "♋",
    ra: "08h 43m",
    dec: "+18° 09'",
    cx: 0.50,
    cy: 0.86,
    hoverProgress: 0.0,
    nodes: [
      [-0.1, -0.04],    // Top tail left
      [0.04, -0.04],    // Top tail right
      [0.08, -0.01],    // Top loop outer
      [0.06, 0.03],     // Top loop bottom
      [0.0, 0.02],      // Top loop inner
      [0.1, 0.04],      // Bottom tail right
      [-0.04, 0.04],    // Bottom tail left
      [-0.08, 0.01],    // Bottom loop outer
      [-0.06, -0.03],   // Bottom loop top
      [0.0, -0.02]      // Bottom loop inner
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1], [5, 6], [6, 7], [7, 8], [8, 9], [9, 6]]
  },
  {
    name: "LEO",
    nature: "THE SOVEREIGN",
    glyph: "♌",
    ra: "10h 30m",
    dec: "+12° 18'",
    cx: 0.69,
    cy: 0.81,
    hoverProgress: 0.0,
    nodes: [
      [-0.1, 0.06],     // Circle left
      [-0.06, 0.11],    // Circle bottom
      [-0.02, 0.06],    // Circle right
      [-0.06, 0.01],    // Circle top
      [0.02, 0.02],     // Tail start
      [0.08, -0.08],    // Tail top
      [0.13, -0.03],    // Tail right
      [0.15, 0.09]      // Tail end
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6], [6, 7]]
  },
  {
    name: "VIRGO",
    nature: "THE VIRGIN",
    glyph: "♍",
    ra: "13h 25m",
    dec: "-04° 12'",
    cx: 0.83,
    cy: 0.68,
    hoverProgress: 0.0,
    nodes: [
      [-0.1, -0.08],    // Pillar 1 top
      [-0.1, 0.08],     // Pillar 1 bottom
      [-0.02, -0.08],   // Pillar 2 top
      [-0.02, 0.08],    // Pillar 2 bottom
      [0.06, -0.08],    // Pillar 3 top
      [0.06, 0.03],     // Pillar 3 bottom
      [0.1, 0.08],      // Loop bottom
      [0.14, 0.0],      // Loop top
      [0.08, -0.05]     // Loop end
    ],
    lines: [[0, 1], [0, 2], [2, 3], [2, 4], [4, 5], [5, 6], [6, 7], [7, 8]]
  },
  {
    name: "LIBRA",
    nature: "THE BALANCE",
    glyph: "♎",
    ra: "15h 18m",
    dec: "-15° 32'",
    cx: 0.88,
    cy: 0.50,
    hoverProgress: 0.0,
    nodes: [
      [-0.12, 0.1],     // Bottom left
      [0.12, 0.1],      // Bottom right
      [-0.1, 0.0],      // Arch left
      [-0.05, -0.06],   // Arch left peak
      [0.0, -0.09],     // Arch center
      [0.05, -0.06],    // Arch right peak
      [0.1, 0.0]        // Arch right
    ],
    lines: [[0, 1], [2, 3], [3, 4], [4, 5], [5, 6]]
  },
  {
    name: "SCORPIO",
    nature: "THE ALCHEMIST",
    glyph: "♏",
    ra: "16h 29m",
    dec: "-26° 18'",
    cx: 0.83,
    cy: 0.32,
    hoverProgress: 0.0,
    nodes: [
      [-0.1, -0.08],    // Pillar 1 top
      [-0.1, 0.08],     // Pillar 1 bottom
      [-0.02, -0.08],   // Pillar 2 top
      [-0.02, 0.08],    // Pillar 2 bottom
      [0.06, -0.08],    // Pillar 3 top
      [0.06, 0.04],     // Pillar 3 bottom
      [0.11, 0.09],     // Tail curve
      [0.14, 0.0],      // Tail tip
      [0.09, 0.02]      // Barb
    ],
    lines: [[0, 1], [0, 2], [2, 3], [2, 4], [4, 5], [5, 6], [6, 7], [7, 8]]
  },
  {
    name: "SAGITTARIUS",
    nature: "THE ARCHER",
    glyph: "♐",
    ra: "19h 05m",
    dec: "-25° 45'",
    cx: 0.69,
    cy: 0.19,
    hoverProgress: 0.0,
    nodes: [
      [-0.1, 0.1],      // Shaft bottom
      [0.12, -0.12],    // Shaft top
      [0.04, -0.11],    // Barb left
      [0.11, -0.04],    // Barb bottom
      [-0.06, -0.02],   // Cross left
      [0.02, 0.06]      // Cross right
    ],
    lines: [[0, 1], [1, 2], [1, 3], [4, 5]]
  },
  {
    name: "CAPRICORN",
    nature: "THE ACHIEVER",
    glyph: "♑",
    ra: "21h 02m",
    dec: "-18° 01'",
    cx: 0.50,
    cy: 0.14,
    hoverProgress: 0.0,
    nodes: [
      [-0.08, 0.08],    // Bottom left start
      [-0.08, -0.04],   // Left peak
      [-0.04, -0.08],   // Top curve
      [0.0, -0.04],     // Down stroke
      [0.0, 0.04],      // Valley
      [0.04, 0.08],     // Right loop bottom
      [0.08, 0.04],     // Right loop right
      [0.06, -0.02],    // Right loop top
      [0.01, 0.0]       // Loop cross-under
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]]
  },
  {
    name: "AQUARIUS",
    nature: "THE VISIONARY",
    glyph: "♒",
    ra: "22h 20m",
    dec: "-10° 15'",
    cx: 0.31,
    cy: 0.19,
    hoverProgress: 0.0,
    nodes: [
      [-0.12, -0.06],   // Top wave start
      [-0.06, -0.10],   // Top wave trough
      [0.0, -0.06],     // Top wave peak
      [0.06, -0.10],    // Top wave trough 2
      [0.12, -0.06],    // Top wave end
      [-0.12, 0.02],    // Bottom wave start
      [-0.06, -0.02],   // Bottom wave trough
      [0.0, 0.02],      // Bottom wave peak
      [0.06, -0.02],    // Bottom wave trough 2
      [0.12, 0.02]      // Bottom wave end
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [8, 9]]
  },
  {
    name: "PISCES",
    nature: "THE DREAMER",
    glyph: "♓",
    ra: "00h 28m",
    dec: "+08° 42'",
    cx: 0.17,
    cy: 0.32,
    hoverProgress: 0.0,
    nodes: [
      [-0.08, -0.10],   // Left curve top
      [-0.06, 0.0],     // Left curve mid
      [-0.08, 0.10],    // Left curve bottom
      [0.08, -0.10],    // Right curve top
      [0.06, 0.0],      // Right curve mid
      [0.08, 0.10]      // Right curve bottom
    ],
    lines: [[0, 1], [1, 2], [3, 4], [4, 5], [1, 4]]
  }
];

// Custom taglines for the details box to enrich the user experience
const CONSTELLATION_TAGLINES = {
  ARIES: "Ignite the path forward with fearless courage and relentless drive.",
  TAURUS: "Ground your ambitions in enduring strength and sensual beauty.",
  GEMINI: "Bridge worlds and ideas with infinite curiosity and wit.",
  CANCER: "Guard the sacred sanctuary of the heart with deep emotional intuition.",
  LEO: "Radiate majestic warmth and lead with a noble, generous spirit.",
  VIRGO: "Harvest clarity and precision to perfect the world's design.",
  LIBRA: "Harmonize opposing forces to create timeless elegance and justice.",
  SCORPIO: "Plunge into the depths of mystery to transmute shadow into light.",
  SAGITTARIUS: "Aim for the stars in search of truth, wisdom, and liberation.",
  CAPRICORN: "Ascend the mountain of mastery through discipline and vision.",
  AQUARIUS: "Challenge the boundaries of today to design the collective tomorrow.",
  PISCES: "Dissolve into the cosmic ocean of dreams, art, and empathy."
};

// Animated Interactive Starfield Canvas (Swirling Nebula Particles Pulling into Constellations)
const StarfieldCanvas = ({ onHoverChange, sectionRef }) => {
  const canvasRef = useRef(null);
  const onHoverChangeRef = useRef(onHoverChange);

  useEffect(() => {
    onHoverChangeRef.current = onHoverChange;
  }, [onHoverChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let bgStars = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let currentHoveredName = null;

    // Reset hover states on mount
    constellations.forEach(c => {
      c.hoverProgress = 0.0;
    });

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      initStars();
    };

    const initStars = () => {
      // 1. Initialize background stars (dense starfield)
      bgStars = [];
      for (let i = 0; i < 250; i++) {
        bgStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          radius: 0.4 + Math.random() * 1.1,
          baseOpacity: 0.15 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2
        });
      }

      // 2. Initialize orbital drift and spiral nebula particles for each constellation
      constellations.forEach(constel => {
        const numParticles = 65; // ~520 particles total across 8 signs (in the 500s!)
        constel.particles = [];
        
        for (let i = 0; i < numParticles; i++) {
          const nodeIdx = i % constel.nodes.length;
          // Random base radius relative to scale (spread out from center)
          const baseR = 0.04 + 0.16 * Math.random();
          // Spiral arm configuration
          const arm = i % 2;
          const baseAngle = arm * Math.PI + baseR * 7.5 + (Math.random() - 0.5) * 0.25;
          const speed = 0.008 + Math.random() * 0.012;
          const colorType = Math.random() < 0.25 ? 'gold' : (Math.random() < 0.55 ? 'purple' : 'white');
          
          constel.particles.push({
            nodeIdx,
            baseR,
            angle: baseAngle,
            speed,
            size: 0.5 + Math.random() * 1.1,
            phase: Math.random() * Math.PI * 2,
            colorType
          });
        }
      });
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        
        const scale = Math.min(canvas.width, canvas.height) * 0.78;
        let touchedAny = false;
        
        for (const constel of constellations) {
          const ccx = constel.cx * canvas.width;
          const ccy = constel.cy * canvas.height;
          const dist = Math.hypot(tx - ccx, ty - ccy);
          if (dist < scale * 0.12) {
            mouseX = ccx;
            mouseY = ccy;
            touchedAny = true;
            break;
          }
        }
        
        if (!touchedAny) {
          mouseX = -9999;
          mouseY = -9999;
        }
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        
        const scale = Math.min(canvas.width, canvas.height) * 0.78;
        let touchedAny = false;
        
        for (const constel of constellations) {
          const ccx = constel.cx * canvas.width;
          const ccy = constel.cy * canvas.height;
          const dist = Math.hypot(tx - ccx, ty - ccy);
          if (dist < scale * 0.12) {
            mouseX = ccx;
            mouseY = ccy;
            touchedAny = true;
            break;
          }
        }
        
        if (!touchedAny) {
          mouseX = tx;
          mouseY = ty;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();

    let lastTime = performance.now();

    const render = (now) => {
      const timestamp = now || performance.now();
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isActive = sectionRef?.current?.classList.contains('active');

      if (!isActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrameId = setTimeout(() => {
          animationFrameId = requestAnimationFrame(render);
        }, 200);
        return;
      }

      const scale = Math.min(canvas.width, canvas.height) * 0.78;

      // 1. Draw background drifting stars
      bgStars.forEach(star => {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        const twinkle = 0.4 + 0.6 * Math.sin(timestamp * 0.0015 + star.phase);
        ctx.fillStyle = `rgba(226, 232, 240, ${star.baseOpacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw each constellation (Nebula Core, Spiral Particles, Node Connections, Labels)
      let hoveredName = null;
      let minDist = Infinity;

      constellations.forEach(constel => {
        const ccx = constel.cx * canvas.width;
        const ccy = constel.cy * canvas.height;

        // Hover detection: cursor near the center of the nebula
        const distToCenter = Math.hypot(mouseX - ccx, mouseY - ccy);
        const isNear = distToCenter < (scale * 0.12);

        if (isNear) {
          constel.hoverProgress = Math.min(1.0, constel.hoverProgress + 0.06);
          if (distToCenter < minDist) {
            minDist = distToCenter;
            hoveredName = constel.name;
          }
        } else {
          constel.hoverProgress = Math.max(0.0, constel.hoverProgress - 0.04);
        }

        const hp = constel.hoverProgress;
        const twinkle = 0.8 + 0.2 * Math.sin(timestamp * 0.004);

        // A. Draw Gaseous Nebula Center Glow (fades as constellation condenses)
        if (hp < 0.98) {
          const coreGlow = ctx.createRadialGradient(ccx, ccy, 2, ccx, ccy, scale * 0.25);
          coreGlow.addColorStop(0, `rgba(167, 139, 250, ${0.18 * (1.0 - hp)})`);
          coreGlow.addColorStop(0.5, `rgba(139, 92, 246, ${0.06 * (1.0 - hp)})`);
          coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = coreGlow;
          ctx.beginPath();
          ctx.arc(ccx, ccy, scale * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

        // B. Calculate all particle coordinates (Swirl + Radial Pulse -> Pull to Node)
        const positions = constel.particles.map(p => {
          // Update spiral angle
          p.angle += p.speed;
          
          // Radial pulsing wave (makes particles look "thrown" out dynamically)
          const radialPulse = Math.sin(timestamp * 0.0018 + p.phase) * 14 * (1.0 - hp);
          const r = p.baseR * scale + radialPulse;

          // Swirling spiral coordinates
          const spiralX = ccx + Math.cos(p.angle) * r;
          const spiralY = ccy + Math.sin(p.angle) * r;

          // Target node coordinates
          const node = constel.nodes[p.nodeIdx] || [0, 0];
          const nodeX = ccx + node[0] * scale;
          const nodeY = ccy + node[1] * scale;

          // Lerp position based on hoverProgress
          const x = spiralX + (nodeX - spiralX) * hp;
          const y = spiralY + (nodeY - spiralY) * hp;

          return { x, y, size: p.size, phase: p.phase, colorType: p.colorType };
        });

        // C. Gaseous Particle Webbing (Faint proximity lines between particles as they pull together)
        if (hp > 0.01) {
          ctx.strokeStyle = `rgba(167, 139, 250, ${0.12 * hp})`;
          ctx.lineWidth = 0.5;
          for (let i = 0; i < positions.length; i += 2) { // step by 2 for performance
            const p1 = positions[i];
            for (let j = i + 1; j < positions.length; j += 3) {
              const p2 = positions[j];
              const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
              if (d < 26) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }
        }

        // D. Draw Constellation Star Nodes (where particles group together)
        positions.forEach(pos => {
          const pTwinkle = 0.5 + 0.5 * Math.sin(timestamp * 0.002 + pos.phase);
          const alpha = (0.35 + hp * 0.55) * pTwinkle;

          let colorStr = `rgba(226, 232, 240, ${alpha})`; // white
          if (pos.colorType === 'gold') {
            colorStr = `rgba(255, 215, 0, ${alpha})`;
          } else if (pos.colorType === 'purple') {
            colorStr = `rgba(167, 139, 250, ${alpha})`;
          }

          // Glow layer for active constellation nodes
          if (hp > 0.1 && pos.colorType === 'gold') {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.08 * hp * pTwinkle})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, (pos.size + hp * 0.6) * 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = colorStr;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pos.size + hp * 0.6, 0, Math.PI * 2);
          ctx.fill();
        });

        // E. Draw Zodiac Glyph Outline Connections
        if (hp > 0.05) {
          constel.lines.forEach(line => {
            // Target node endpoints
            const n1 = constel.nodes[line[0]];
            const n2 = constel.nodes[line[1]];
            if (n1 && n2) {
              const p1X = ccx + n1[0] * scale;
              const p1Y = ccy + n1[1] * scale;
              const p2X = ccx + n2[0] * scale;
              const p2Y = ccy + n2[1] * scale;

              // Color interpolates from purple to gold as constellation condenses
              const r = Math.round(139 + 116 * hp);
              const g = Math.round(92 + 123 * hp);
              const b = Math.round(246 * (1.0 - hp));

              ctx.beginPath();
              ctx.moveTo(p1X, p1Y);
              ctx.lineTo(p2X, p2Y);
              ctx.lineWidth = 0.8 + hp * 0.8;
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.35 * hp * twinkle})`;
              ctx.stroke();
            }
          });
        }

        // F. Draw Label Details (Glyph, Name, Nature)
        if (hp > 0.02) {
          const textY = ccy - scale * 0.22;

          ctx.textAlign = 'center';
          
          // Glyph
          ctx.font = 'normal 44px "Segoe UI Symbol", "Cinzel", sans-serif';
          ctx.fillStyle = `rgba(255, 215, 0, ${hp * 0.9})`;
          ctx.fillText(constel.glyph, ccx, textY - 32);

          // Name
          ctx.font = 'bold 18px "Cinzel", serif';
          ctx.fillStyle = `rgba(241, 245, 249, ${hp})`;
          if ('letterSpacing' in ctx) {
            ctx.letterSpacing = '1px';
          }
          ctx.fillText(constel.name, ccx, textY - 10);

          // Nature description
          ctx.font = '500 8.5px "Inter", sans-serif';
          ctx.fillStyle = `rgba(185, 200, 220, ${hp * 0.65})`;
          if ('letterSpacing' in ctx) {
            ctx.letterSpacing = '2px';
          }
          ctx.fillText(constel.nature, ccx, textY + 5);
          if ('letterSpacing' in ctx) {
            ctx.letterSpacing = '0px';
          }
        }
      });

      if (hoveredName !== currentHoveredName) {
        currentHoveredName = hoveredName;
        if (onHoverChangeRef.current) {
          onHoverChangeRef.current(hoveredName);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
};

const LastPageSection = React.forwardRef(({ rippleOrigin, rippleProgress, onToggleAudioActive }, ref) => {
  const [activeCards, setActiveCards] = useState([]); // Array of { name, state }
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  const timeoutsRef = useRef({});

  const handleHoverChange = (name) => {
    if (name) {
      // Clear timeout for the entering card if it was exiting
      if (timeoutsRef.current[name]) {
        clearTimeout(timeoutsRef.current[name]);
        delete timeoutsRef.current[name];
      }

      setActiveCards(prev => {
        // Mark all other cards as 'tear'
        const updated = prev.map(c => {
          if (c.name === name) {
            return { ...c, state: 'drop' };
          } else {
            // Schedule removal for cards transitioning to 'tear'
            if (c.state !== 'tear') {
              const otherName = c.name;
              if (timeoutsRef.current[otherName]) clearTimeout(timeoutsRef.current[otherName]);
              timeoutsRef.current[otherName] = setTimeout(() => {
                setActiveCards(curr => curr.filter(x => x.name !== otherName));
                delete timeoutsRef.current[otherName];
              }, 500);
            }
            return { ...c, state: 'tear' };
          }
        });

        // Add the new card if not present
        if (!updated.some(c => c.name === name)) {
          updated.push({ name, state: 'drop' });
        }
        return updated;
      });
    } else {
      // If hover is completely lost, set all active cards to 'tear'
      setActiveCards(prev => {
        return prev.map(c => {
          if (c.state !== 'tear') {
            const nameToTear = c.name;
            if (timeoutsRef.current[nameToTear]) clearTimeout(timeoutsRef.current[nameToTear]);
            timeoutsRef.current[nameToTear] = setTimeout(() => {
              setActiveCards(curr => curr.filter(x => x.name !== nameToTear));
              delete timeoutsRef.current[nameToTear];
            }, 500);
          }
          return { ...c, state: 'tear' };
        });
      });
    }
  };

  useEffect(() => {
    const el = ref?.current;
    let observer;

    if (el) {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isActive = el.classList.contains('active');
            if (!isActive) {
              setActiveCards([]);
              Object.values(timeoutsRef.current).forEach(clearTimeout);
              timeoutsRef.current = {};
            }
          }
        });
      });
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      if (observer) observer.disconnect();
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, [ref]);

  const hasActiveCards = activeCards.length > 0;

  const handleCtaClick = () => {
    if (rippleOrigin && rippleProgress) {
      rippleOrigin.current.set(0, 0, 0);
      rippleProgress.current = 0.01;
    }
    if (onToggleAudioActive) {
      onToggleAudioActive(true);
    }
    setShowGenerator(true);
  };

  const renderCardContent = (sign) => {
    return (
      <div className="details-card-content">
        <div className="hud-astrolabe-bg">
          <svg viewBox="0 0 200 200" className="hud-astrolabe-svg">
            <circle cx="100" cy="100" r="95" stroke="rgba(167, 139, 250, 0.08)" strokeWidth="0.8" fill="none" />
            <circle cx="100" cy="100" r="75" stroke="rgba(167, 139, 250, 0.12)" strokeWidth="0.8" strokeDasharray="4,4" fill="none" />
            <circle cx="100" cy="100" r="55" stroke="rgba(255, 215, 0, 0.08)" strokeWidth="0.6" fill="none" />
            <circle cx="100" cy="100" r="35" stroke="rgba(167, 139, 250, 0.06)" strokeWidth="0.6" strokeDasharray="1,6" fill="none" />
            <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(167, 139, 250, 0.06)" strokeWidth="0.5" />
            <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(167, 139, 250, 0.06)" strokeWidth="0.5" />
            <path d="M100 5 L100 15 M100 185 L100 195 M5 100 L15 100 M185 100 L195 100" stroke="rgba(167, 139, 250, 0.18)" strokeWidth="0.8" />
          </svg>
        </div>
        <div className="hud-card-body">
          <div className="hud-col-left">
            <div className="hud-glyph-wrapper">
              <div className="hud-glyph-ring-1"></div>
              <div className="hud-glyph-ring-2"></div>
              <div className="hud-glyph-scanner"></div>
              <div className="hud-glyph">{sign.glyph}</div>
            </div>
            <div className="hud-tech-coords">
              <span className="hud-label-tiny">LOC_X_Y</span>
              <span className="hud-val-tiny">{(sign.cx * 100).toFixed(0)} : {(sign.cy * 100).toFixed(0)}</span>
            </div>
          </div>
          <div className="hud-col-right">
            <div className="hud-header-group">
              <div className="hud-title-row">
                <h2 className="hud-title">{sign.name}</h2>
                <div className="hud-nature-badge">{sign.nature}</div>
              </div>
              <div className="hud-meta-block">
                <div>
                  <span className="hud-meta-label">RA: </span>
                  <span className="hud-meta-val">{sign.ra}</span>
                </div>
                <div>
                  <span className="hud-meta-label">DEC: </span>
                  <span className="hud-meta-val">{sign.dec}</span>
                </div>
              </div>
            </div>
            <div className="hud-divider">
              <span className="hud-node node-left"></span>
              <span className="hud-line"></span>
              <span className="hud-node node-right"></span>
            </div>
            <p className="hud-description">{CONSTELLATION_TAGLINES[sign.name]}</p>
            <div className="hud-footer">
              <span className="hud-status-log">SYS.LOG // TARGET_ACQUIRED</span>
              <span className="hud-status-val">INTEGRITY_100%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section 
      ref={ref} 
      className="last-page-section"
    >
      <StarfieldCanvas onHoverChange={handleHoverChange} sectionRef={ref} />
      
      {/* Center Cosmic CTA */}
      <div className={`cosmic-cta-container ${hasActiveCards ? 'hidden' : ''}`}>
        <button 
          className="cosmic-cta-btn" 
          onClick={() => {
            if (onToggleAudioActive) {
              onToggleAudioActive(true);
            }
            window.dispatchEvent(new CustomEvent('open-generator'));
          }}
        >
          <span className="cosmic-cta-prefix">&gt;_</span>
          <span className="cosmic-cta-text">Decrypt My Cosmic Chart</span>
        </button>
        <span className="cosmic-cta-subtext">
          {isTouchDevice ? "or tap a sign to align coordinates" : "or hover a sign to align coordinates"}
        </span>
      </div>

      {activeCards.map(card => {
        const sign = constellations.find(c => c.name === card.name);
        if (!sign) return null;
        return (
          <div key={card.name} className={`details-box-wrapper ${card.state}`}>
            <div className="details-card-half split-top">
              {renderCardContent(sign)}
            </div>
            <div className="details-card-half split-bottom">
              {renderCardContent(sign)}
            </div>
          </div>
        );
      })}
    </section>
  );
});
