import React, { useState, useEffect } from 'react';
import { Compass } from 'lucide-react';

export default function Header({ cosmicMode, onToggleCosmicMode }) {
  const [userCount, setUserCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page: window.location.pathname })
    })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.uniqueVisitors === 'number') {
          // Display raw unique visitors directly
          setUserCount(data.uniqueVisitors);
          localStorage.setItem('astropera_telemetry_counter', data.uniqueVisitors.toString());
        }
      })
      .catch(err => {
        console.warn("Local visitor tracking server offline, using local cache fallback.");
        const savedCount = localStorage.getItem('astropera_telemetry_counter') || '0';
        setUserCount(parseInt(savedCount, 10));
      });
  }, []);

  const scrollToTarget = (targetPercent) => {
    if (cosmicMode !== '3d') {
      onToggleCosmicMode('3d');
      setTimeout(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.dispatchEvent(new CustomEvent('lenis-scroll-to', {
          detail: { target: maxScroll * targetPercent, duration: 1.6 }
        }));
      }, 250);
    } else {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.dispatchEvent(new CustomEvent('lenis-scroll-to', {
        detail: { target: maxScroll * targetPercent, duration: 1.6 }
      }));
    }
  };

  const handleScrollToTop = (e) => {
    e.preventDefault();
    scrollToTarget(0.0);
  };

  return (
    <nav className="navbar">
      <a href="#" className="logo" onClick={handleScrollToTop}>
        <Compass size={20} />
        ASTRO<span>PERA</span>
      </a>

      <ul className="nav-links">
        <li><a href="#" className="nav-link" onClick={handleScrollToTop}>Observatory</a></li>
        <li>
          <a 
            href="#" 
            className="nav-link" 
            onClick={(e) => { 
              e.preventDefault(); 
              scrollToTarget(0.16);
            }}
          >
            Arcana
          </a>
        </li>
        <li>
          <a 
            href="#" 
            className="nav-link" 
            onClick={(e) => { 
              e.preventDefault(); 
              scrollToTarget(1.0);
            }}
          >
            Channel Us
          </a>
        </li>
        <li>
          <a 
            href="#" 
            className="nav-link" 
            onClick={(e) => { 
              e.preventDefault(); 
              window.dispatchEvent(new CustomEvent('open-feedback'));
            }}
          >
            Feedback
          </a>
        </li>
      </ul>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="live-telemetry-counter" style={{ margin: 0 }}>
          <span className="pulse-dot-green"></span>
          <span className="telemetry-label">GLOBAL_VISITORS:</span>
          <span className="telemetry-val">{userCount.toLocaleString()}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={onToggleCosmicMode}
            style={{
              background: 'rgba(8, 28, 58, 0.4)',
              border: '1px solid rgba(74, 240, 208, 0.25)',
              borderRadius: '6px',
              color: '#4af0d0',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '0.12em',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              setShowTooltip(true);
              e.currentTarget.style.boxShadow = '0 0 12px rgba(74, 240, 208, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(74, 240, 208, 0.8)';
              e.currentTarget.style.background = 'rgba(8, 28, 58, 0.6)';
            }}
            onMouseLeave={(e) => {
              setShowTooltip(false);
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(74, 240, 208, 0.25)';
              e.currentTarget.style.background = 'rgba(8, 28, 58, 0.4)';
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: cosmicMode === 'interactive' ? '#c4f542' : '#4af0d0',
              boxShadow: cosmicMode === 'interactive' ? '0 0 8px #c4f542' : '0 0 8px #4af0d0',
              display: 'inline-block'
            }}></span>
            Engine: {cosmicMode}
          </button>

          {showTooltip && (
            <div style={{
              position: 'absolute',
              top: '42px',
              right: '0',
              width: '250px',
              padding: '10px 14px',
              background: 'rgba(5, 8, 22, 0.96)',
              border: '1px solid rgba(74, 240, 208, 0.45)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              lineHeight: '1.45',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), 0 0 15px rgba(74, 240, 208, 0.15)',
              zIndex: 1000,
              pointerEvents: 'none',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ color: '#4af0d0', fontWeight: 'bold', marginBottom: '4px', fontSize: '9px', letterSpacing: '0.08em' }}>
                &gt;_ CELESTIAL_TELEMETRY
              </div>
              This will let you interact with the whole screen and play! Hover to mask the galaxy, click to trigger cosmic stardust shockwaves.
            </div>
          )}
        </div>

        <button className="connect-btn" onClick={() => alert("Establishing secure connection to ASTROPERA Cosmic Core...")}>
          <span className="connect-btn-body" />
          <span className="btn-prefix">&gt;_</span>
          Sync Orbit
          <span className="corner-dot dot-tl" />
          <span className="corner-dot dot-tr" />
          <span className="corner-dot dot-bl" />
          <span className="corner-dot dot-br" />
        </button>
      </div>
    </nav>
  );
}
