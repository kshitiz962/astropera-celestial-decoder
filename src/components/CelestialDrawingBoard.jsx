import React, { useRef, useState, useEffect } from 'react';

// Combined registry of checkpoints for zodiac signs and planet glyphs (200x200 canvas space)
const CELESTIAL_CHECKPOINTS = {
  // Zodiac Signs
  Aries: [{ x: 30, y: 80 }, { x: 70, y: 40 }, { x: 100, y: 80 }, { x: 100, y: 160 }, { x: 130, y: 40 }, { x: 170, y: 80 }],
  Taurus: [{ x: 40, y: 45 }, { x: 70, y: 70 }, { x: 100, y: 85 }, { x: 100, y: 165 }, { x: 130, y: 70 }, { x: 160, y: 45 }],
  Gemini: [{ x: 50, y: 40 }, { x: 150, y: 40 }, { x: 75, y: 100 }, { x: 75, y: 160 }, { x: 125, y: 100 }, { x: 125, y: 160 }],
  Cancer: [{ x: 150, y: 60 }, { x: 120, y: 85 }, { x: 60, y: 110 }, { x: 90, y: 85 }],
  Leo: [{ x: 70, y: 140 }, { x: 90, y: 100 }, { x: 130, y: 40 }, { x: 150, y: 75 }, { x: 170, y: 150 }],
  Virgo: [{ x: 40, y: 60 }, { x: 65, y: 130 }, { x: 90, y: 60 }, { x: 115, y: 130 }, { x: 125, y: 160 }],
  Libra: [{ x: 40, y: 135 }, { x: 160, y: 135 }, { x: 40, y: 110 }, { x: 100, y: 85 }, { x: 160, y: 110 }],
  Scorpio: [{ x: 40, y: 60 }, { x: 65, y: 130 }, { x: 90, y: 60 }, { x: 115, y: 130 }, { x: 135, y: 145 }],
  Sagittarius: [{ x: 50, y: 150 }, { x: 100, y: 100 }, { x: 150, y: 50 }, { x: 150, y: 90 }, { x: 70, y: 70 }],
  Capricorn: [{ x: 45, y: 60 }, { x: 45, y: 130 }, { x: 70, y: 120 }, { x: 100, y: 120 }, { x: 115, y: 95 }],
  Aquarius: [{ x: 40, y: 75 }, { x: 90, y: 60 }, { x: 160, y: 75 }, { x: 40, y: 115 }, { x: 90, y: 100 }, { x: 160, y: 115 }],
  Pisces: [{ x: 60, y: 40 }, { x: 60, y: 160 }, { x: 140, y: 40 }, { x: 140, y: 160 }, { x: 100, y: 100 }],
  // Planets
  Saturn: [{ x: 100, y: 50 }, { x: 100, y: 150 }, { x: 70, y: 80 }, { x: 130, y: 80 }, { x: 115, y: 120 }],
  Sun: [{ x: 100, y: 60 }, { x: 140, y: 100 }, { x: 100, y: 140 }, { x: 60, y: 100 }, { x: 100, y: 100 }],
  Moon: [{ x: 70, y: 50 }, { x: 40, y: 100 }, { x: 70, y: 150 }, { x: 55, y: 100 }],
  Mars: [{ x: 85, y: 115 }, { x: 55, y: 115 }, { x: 106, y: 94 }, { x: 140, y: 60 }, { x: 115, y: 60 }, { x: 140, y: 85 }],
  Venus: [{ x: 100, y: 45 }, { x: 70, y: 75 }, { x: 130, y: 75 }, { x: 100, y: 105 }, { x: 100, y: 165 }, { x: 75, y: 135 }, { x: 125, y: 135 }],
  Mercury: [{ x: 75, y: 40 }, { x: 100, y: 70 }, { x: 75, y: 95 }, { x: 125, y: 95 }, { x: 100, y: 120 }, { x: 100, y: 170 }, { x: 80, y: 145 }],
  Jupiter: [{ x: 65, y: 95 }, { x: 95, y: 95 }, { x: 95, y: 155 }, { x: 95, y: 125 }, { x: 135, y: 125 }],
  Uranus: [{ x: 100, y: 135 }, { x: 100, y: 120 }, { x: 75, y: 45 }, { x: 75, y: 115 }, { x: 125, y: 45 }, { x: 125, y: 115 }, { x: 75, y: 80 }],
  Neptune: [{ x: 70, y: 55 }, { x: 70, y: 115 }, { x: 100, y: 125 }, { x: 130, y: 115 }, { x: 130, y: 55 }, { x: 100, y: 55 }, { x: 100, y: 165 }],
  Pluto: [{ x: 75, y: 60 }, { x: 125, y: 60 }, { x: 100, y: 90 }, { x: 100, y: 130 }, { x: 100, y: 170 }, { x: 80, y: 150 }]
};

// Combined registry of SVG paths for zodiac signs and planet glyphs
const CELESTIAL_SVG_PATHS = {
  // Zodiac Signs
  Aries: 'M 30,80 Q 70,40 100,80 L 100,160 M 170,80 Q 130,40 100,80',
  Taurus: 'M 40,45 C 40,85 160,85 160,45 M 100,85 A 45,45 0 1,1 99,85',
  Gemini: 'M 50,40 L 150,40 M 50,160 L 150,160 M 75,40 L 75,160 M 125,40 L 125,160',
  Cancer: 'M 150,60 A 25,25 0 1,0 120,85 C 100,100 60,70 60,110 A 25,25 0 1,0 90,85 C 110,70 150,100 150,60',
  Leo: 'M 70,140 A 20,20 0 1,1 80,110 C 100,90 100,40 130,40 A 25,25 0 1,1 150,75 C 140,95 140,140 170,150',
  Virgo: 'M 40,60 L 40,130 C 40,150 60,150 65,130 L 65,60 L 65,130 C 65,150 85,150 90,130 L 90,60 L 90,130 C 90,150 110,150 115,130 L 115,80 C 115,120 135,140 125,160',
  Libra: 'M 40,135 L 160,135 M 40,110 L 75,110 A 25,25 0 1,1 125,110 L 160,110',
  Scorpio: 'M 40,60 L 40,130 C 40,150 60,150 65,130 L 65,60 L 65,130 C 65,150 85,150 90,130 L 90,60 L 90,130 C 90,150 110,150 115,130 L 115,80 L 115,130 C 115,145 135,145 135,130 L 135,145 L 142,137',
  Sagittarius: 'M 50,150 L 150,50 M 110,50 L 150,50 L 150,90 M 70,70 L 130,130',
  Capricorn: 'M 45,60 L 45,130 C 45,150 65,150 70,130 L 70,60 L 70,120 C 70,145 100,145 100,120 C 100,105 85,90 100,75 A 15,15 0 1,1 115,90',
  Aquarius: 'M 40,75 L 65,55 L 90,75 L 115,55 L 140,75 L 165,55 M 40,115 L 65,95 L 90,115 L 115,95 L 140,115 L 165,95',
  Pisces: 'M 60,40 C 100,80 100,120 60,160 M 140,40 C 100,80 100,120 140,160 M 50,100 L 150,100',
  // Planets
  Saturn: 'M 100,50 L 100,150 M 70,80 L 130,80 M 100,120 C 130,120 130,150 100,150 C 70,150 70,120 100,120',
  Sun: 'M 100,60 A 40,40 0 1,1 99.9,60 M 100,100 A 3,3 0 1,1 99.9,100',
  Moon: 'M 70,50 A 50,50 0 0,0 70,150 A 40,40 0 0,1 70,50',
  Mars: 'M 85,115 A 30,30 0 1,1 84.9,115 M 106,94 L 140,60 M 115,60 L 140,60 L 140,85',
  Venus: 'M 100,45 A 30,30 0 1,1 99.9,45 M 100,105 L 100,165 M 75,135 L 125,135',
  Mercury: 'M 75,40 Q 100,65 125,40 M 100,70 A 25,25 0 1,1 99.9,70 M 100,120 L 100,170 M 80,145 L 120,145',
  Jupiter: 'M 65,95 C 65,65 95,65 95,95 L 95,155 M 95,125 L 135,125 M 65,95 L 65,115 L 95,115',
  Uranus: 'M 100,135 A 15,15 0 1,1 99.9,135 M 100,120 L 100,45 M 75,45 L 75,115 M 125,45 L 125,115 M 75,80 L 125,80 M 100,45 L 100,55',
  Neptune: 'M 70,55 L 70,115 C 70,135 130,135 130,115 L 130,55 M 100,55 L 100,165 M 85,145 L 115,145',
  Pluto: 'M 75,60 C 75,95 125,95 125,60 M 100,90 A 20,20 0 1,1 99.9,90 M 100,130 L 100,170 M 80,150 L 120,150'
};

const getPlanetGlyph = (planet) => {
  const glyphs = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", 
    Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "⛢", 
    Neptune: "♆", Pluto: "♇"
  };
  return glyphs[planet] || "✦";
};

const getZodiacGlyph = (sign) => {
  const glyphs = {
    Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
    Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
    Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
  };
  return glyphs[sign] || "✦";
};

export default function CelestialDrawingBoard({ activeTarget, isPlanet, isActive, availablePool, onChangeTarget, onComplete }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [checkpoints, setCheckpoints] = useState([]);
  const [completed, setCompleted] = useState(false);

  // Calculate bounding box offsets to center any shape dynamically
  const [offsets, setOffsets] = useState({ x: 0, y: 0 });

  // Initialize checkpoints when activeTarget changes
  useEffect(() => {
    if (!activeTarget) return;
    const list = CELESTIAL_CHECKPOINTS[activeTarget] || [];
    
    // Find bounding box center
    let ox = 0;
    let oy = 0;
    if (list.length > 0) {
      const xs = list.map(cp => cp.x);
      const ys = list.map(cp => cp.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      ox = 100 - (minX + maxX) / 2;
      oy = 100 - (minY + maxY) / 2;
    }
    
    setOffsets({ x: ox, y: oy });
    setCheckpoints(list.map((cp, idx) => ({ 
      x: cp.x + ox, 
      y: cp.y + oy, 
      id: idx, 
      passed: false 
    })));
    setCompleted(false);
    clearCanvas();
  }, [activeTarget]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support touch and mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (completed) return;
    setIsDrawing(true);
    
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMove = (e) => {
    if (!isDrawing || completed) return;
    e.preventDefault();
    
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Draw glowing cyan trace line
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#00FFCC';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00FFCC';
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    // Check checkpoints distance
    let updated = false;
    const nextCheckpoints = checkpoints.map(cp => {
      if (!cp.passed) {
        const dist = Math.hypot(pos.x - cp.x, pos.y - cp.y);
        if (dist < 22) { // hit radius
          updated = true;
          return { ...cp, passed: true };
        }
      }
      return cp;
    });

    if (updated) {
      setCheckpoints(nextCheckpoints);
      
      // Check if all are passed
      const allPassed = nextCheckpoints.every(cp => cp.passed);
      if (allPassed) {
        setCompleted(true);
        setIsDrawing(false);
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleReset = () => {
    const list = CELESTIAL_CHECKPOINTS[activeTarget] || [];
    setCheckpoints(list.map((cp, idx) => ({ 
      x: cp.x + offsets.x, 
      y: cp.y + offsets.y, 
      id: idx, 
      passed: false 
    })));
    setCompleted(false);
    clearCanvas();
  };

  if (!isActive || !activeTarget) return null;

  const activePath = CELESTIAL_SVG_PATHS[activeTarget] || '';

  return (
    <div className={`celestial-drawing-container ${completed ? 'completed' : ''}`} style={{
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 15,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      pointerEvents: 'none',
      width: '580px',
      height: '100vh',
      animation: 'celestialFadeUp 1s ease both',
    }}>
      <style>{`
        @keyframes celestialFadeUp {
          from { 
            opacity: 0; 
            transform: translate(-50%, -46%) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          }
        }
        @keyframes drawGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(0, 255, 200, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(0, 255, 200, 0.8)); }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{ position: 'absolute', top: '10%', textAlign: 'center', pointerEvents: 'none' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.22em',
          color: completed ? '#4af0d0' : '#f59e0b',
          textTransform: 'uppercase',
          fontWeight: 600
        }}>
          {completed ? 'Calibration complete' : 'Alignment Calibration'}
        </span>
        <h4 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '1.3rem',
          margin: '4px 0 0',
          color: '#ffffff',
          letterSpacing: '0.08em',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          textTransform: 'uppercase'
        }}>
          TRACE {activeTarget} {isPlanet ? 'GLYPH' : 'SIGN'}
        </h4>
      </div>

      {/* Choice Selector Row */}
      {availablePool && availablePool.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '21%',
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
          maxWidth: '500px'
        }}>
          {availablePool.map(target => {
            const isCurrent = target === activeTarget;
            return (
              <button
                key={target}
                onClick={() => onChangeTarget(target)}
                style={{
                  background: isCurrent ? 'rgba(0, 255, 200, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isCurrent ? '1px solid #00FFCC' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isCurrent ? '#00FFCC' : 'rgba(255, 255, 255, 0.6)',
                  fontFamily: 'inherit',
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? '0 0 8px rgba(0, 255, 200, 0.3)' : 'none',
                  outline: 'none'
                }}
                title={target}
              >
                {isPlanet ? getPlanetGlyph(target) : getZodiacGlyph(target)}
              </button>
            );
          })}
        </div>
      )}

      {/* Drawing board box */}
      <div style={{
        position: 'relative',
        width: '480px',
        height: '480px',
        overflow: 'visible',
        pointerEvents: 'auto',
      }}>
        {/* SVG Outline Guide */}
        <svg 
          viewBox="0 0 200 200" 
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {/* Faint background template path */}
          <path
            d={activePath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="4"
            strokeDasharray="6,6"
            strokeLinecap="round"
            transform={`translate(${offsets.x}, ${offsets.y})`}
          />

          {/* Dotted guide path indicator */}
          <path
            d={activePath}
            fill="none"
            stroke="rgba(74, 240, 208, 0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`translate(${offsets.x}, ${offsets.y})`}
          />

          {/* Render checkpoint target stars floating on stardust */}
          {checkpoints.map(cp => (
            <path
              key={cp.id}
              d="M 0,-7 L 2,-2 L 7,0 L 2,2 L 0,7 L -2,2 L -7,0 L -2,-2 Z"
              transform={`translate(${cp.x}, ${cp.y})`}
              fill={cp.passed ? '#00FFCC' : 'rgba(255, 255, 255, 0.18)'}
              stroke={cp.passed ? '#ffffff' : 'rgba(74, 240, 208, 0.45)'}
              strokeWidth="0.8"
              style={{
                filter: cp.passed ? 'drop-shadow(0 0 8px #00FFCC)' : 'none',
                transition: 'all 0.4s ease'
              }}
            />
          ))}
        </svg>

        {/* User drawing canvas */}
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            cursor: completed ? 'default' : 'crosshair',
            touchAction: 'none',
            pointerEvents: 'auto'
          }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {completed ? (
        <div style={{
          position: 'absolute',
          bottom: '8%',
          textAlign: 'center',
          animation: 'scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            color: '#4af0d0',
            fontSize: '1rem',
            letterSpacing: '0.12em',
            animation: 'drawGlow 2s infinite',
            fontWeight: 700,
            textShadow: '0 0 10px rgba(74, 240, 208, 0.4)'
          }}>
            ✦ CONGOOOOOO! ✦
          </div>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            color: 'rgba(255,255,255,0.48)',
            display: 'block',
            marginTop: '4px'
          }}>
            Celestial alignment established
          </span>
        </div>
      ) : (
        <button 
          onClick={handleReset}
          style={{
            position: 'absolute',
            bottom: '8%',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            cursor: 'pointer',
            padding: '4px 12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'color 0.2s',
            outline: 'none',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          Reset Alignment
        </button>
      )}
    </div>
  );
}
