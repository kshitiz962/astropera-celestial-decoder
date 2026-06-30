import React, { useState, useEffect, useRef } from 'react';

export default function ChartGenerator({ onClose }) {
  const [step, setStep] = useState('form'); // 'form' | 'loading' | 'result'
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthLocation: ''
  });
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('placements'); // 'placements' | 'aspects' | 'summary'
  const [savedProfile, setSavedProfile] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('astropera_chart');
    if (saved) {
      setSavedProfile(JSON.parse(saved));
    }
  }, []);

  const handleLoadSaved = () => {
    if (!savedProfile) return;
    setFormData({
      name: savedProfile.name,
      birthDate: savedProfile.birthDate,
      birthTime: savedProfile.birthTime,
      birthLocation: savedProfile.birthLocation
    });
    setStep('result');
  };

  const mockLogsList = [
    "LOG: Initializing cosmic decryption engine...",
    "LOG: Calibrating planetary nodes for coordinate grid...",
    "SYS: Mapping coordinates to birth location...",
    "SYS: Querying solar system state database...",
    "DATA: Synthesizing Natal Sun position (Leo, House IX)...",
    "DATA: Synthesizing Natal Moon position (Scorpio, House XII)...",
    "DATA: Calculating Ascendant horizon angle (Sagittarius, 14.2°)...",
    "SYS: Computing trines, oppositions, and planetary aspects...",
    "LOG: AI Astrological synthesis compiling...",
    "SUCCESS: Chart compiled. Decryption complete."
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartDecryption = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) return;
    setStep('loading');
    setLogs([]);
  };

  // Run mock terminal decryption sequence
  useEffect(() => {
    if (step !== 'loading') return;

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < mockLogsList.length) {
        setLogs(prev => [...prev, mockLogsList[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          const chartDetails = getChartDetails();
          const profileData = {
            name: formData.name,
            birthDate: formData.birthDate,
            birthTime: formData.birthTime,
            birthLocation: formData.birthLocation,
            chartDetails
          };
          localStorage.setItem('astropera_chart', JSON.stringify(profileData));
          setSavedProfile(profileData);
          setStep('result');
        }, 800);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [step]);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Derived mock placements based on user name/date (simple deterministic hash)
  const getChartDetails = () => {
    const hash = formData.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + 
                 formData.birthDate.split('-').reduce((acc, num) => acc + parseInt(num || 0), 0);

    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const houses = ["1st House", "2nd House", "3rd House", "4th House", "5th House", "6th House", "7th House", "8th House", "9th House", "10th House", "11th House", "12th House"];
    
    const sunSign = signs[hash % 12];
    const moonSign = signs[(hash + 3) % 12];
    const ascSign = signs[(hash + 7) % 12];
    
    const sunHouse = houses[(hash + 1) % 12];
    const moonHouse = houses[(hash + 5) % 12];

    return {
      sun: { sign: sunSign, house: sunHouse, glyph: "☉" },
      moon: { sign: moonSign, house: moonHouse, glyph: "☽" },
      ascendant: { sign: ascSign, house: "1st House", glyph: "ASC" }
    };
  };

  const chart = getChartDetails();

  return (
    <div className="chart-generator-overlay">
      <div className="chart-generator-card">
        
        {/* Notched corner brackets */}
        <div className="corner-bracket cb-tl"></div>
        <div className="corner-bracket cb-br"></div>

        {/* Close Button */}
        <button className="chart-close-btn" onClick={onClose}>✕</button>

        {/* STEP 1: INPUT FORM */}
        {step === 'form' && (
          <div className="generator-step-form" style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Holographic background vector */}
            <div className="generator-holo-vector">
              <svg viewBox="0 0 200 200" width="100%" height="100%">
                <circle cx="100" cy="100" r="90" stroke="rgba(74, 240, 208, 0.08)" strokeWidth="0.5" fill="none" />
                <circle cx="100" cy="100" r="70" stroke="rgba(123, 111, 255, 0.05)" strokeWidth="0.5" strokeDasharray="2, 4" fill="none" />
                <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(74, 240, 208, 0.04)" strokeWidth="0.5" />
                <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(74, 240, 208, 0.04)" strokeWidth="0.5" />
                <polygon points="100,20 169,60 169,140 100,180 31,140 31,60" stroke="rgba(196, 245, 66, 0.03)" strokeWidth="0.5" fill="none" />
              </svg>
            </div>

            <h2 className="generator-title">DECRYPT YOUR NATAL CHART</h2>
            <p className="generator-subtitle">Input birth coordinates to sync planetary positions.</p>
            
            <form onSubmit={handleStartDecryption} className="generator-form">
              <div className="input-group">
                <label>01 // SUBJECT NAME</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    onFocus={() => setActiveInput('name')}
                    onBlur={() => setActiveInput(null)}
                    placeholder="ENTER NAME..." 
                    required
                  />
                  <div className={`input-focus-line ${activeInput === 'name' ? 'active' : ''}`} />
                </div>
              </div>

              <div className="input-group">
                <label>02 // DATE OF BIRTH</label>
                <div className="input-wrapper">
                  <input 
                    type="date" 
                    name="birthDate" 
                    value={formData.birthDate} 
                    onChange={handleInputChange} 
                    onFocus={() => setActiveInput('birthDate')}
                    onBlur={() => setActiveInput(null)}
                    required
                  />
                  <div className={`input-focus-line ${activeInput === 'birthDate' ? 'active' : ''}`} />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>03 // TIME OF BIRTH</label>
                  <div className="input-wrapper">
                    <input 
                      type="time" 
                      name="birthTime" 
                      value={formData.birthTime} 
                      onChange={handleInputChange} 
                      onFocus={() => setActiveInput('birthTime')}
                      onBlur={() => setActiveInput(null)}
                    />
                    <div className={`input-focus-line ${activeInput === 'birthTime' ? 'active' : ''}`} />
                  </div>
                </div>
                <div className="input-group">
                  <label>04 // LOCATION OF BIRTH</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      name="birthLocation" 
                      value={formData.birthLocation} 
                      onChange={handleInputChange} 
                      onFocus={() => setActiveInput('birthLocation')}
                      onBlur={() => setActiveInput(null)}
                      placeholder="CITY, COUNTRY..."
                    />
                    <div className={`input-focus-line ${activeInput === 'birthLocation' ? 'active' : ''}`} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', position: 'relative', zIndex: 5 }}>
                <button type="submit" className="decrypt-submit-btn">
                  <span className="btn-spark spark-tl"></span>
                  <span className="btn-spark spark-tr"></span>
                  <span className="btn-spark spark-bl"></span>
                  <span className="btn-spark spark-br"></span>
                  <span>&gt;_ Initiate Decryption</span>
                </button>
                
                {savedProfile && (
                  <button type="button" className="load-saved-profile-btn" onClick={handleLoadSaved}>
                    <span className="btn-spark spark-tl"></span>
                    <span className="btn-spark spark-tr"></span>
                    <span className="btn-spark spark-bl"></span>
                    <span className="btn-spark spark-br"></span>
                    <span>⚡ Load Saved Profile: {savedProfile.name.toUpperCase()}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: LOADING DECRYPTION PROCESS */}
        {step === 'loading' && (
          <div className="generator-step-loading">
            <h2 className="generator-title">DECRYPTING COSMIC SIGNATURE...</h2>
            
            {/* Holographic glowing scan bar */}
            <div className="loader-scan-wrapper">
              <div className="loader-scan-ring"></div>
              <div className="loader-scan-bar"></div>
            </div>

            {/* Terminal Outputs */}
            <div className="terminal-log-box">
              {logs.map((log, idx) => (
                <div key={idx} className="terminal-line">
                  <span className="terminal-prefix">&gt; </span>
                  <span className="terminal-text">{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* STEP 3: RESULT DASHBOARD */}
        {step === 'result' && (
          <div className="generator-step-result">
            <div className="result-header">
              <div>
                <span className="result-meta">TARGET: {formData.name.toUpperCase()}</span>
                <h2 className="generator-title" style={{ marginTop: '4px' }}>COSMIC PROFILE COMPILED</h2>
              </div>
              <button className="reset-btn" onClick={() => setStep('form')}>✕ Recalibrate</button>
            </div>

            <div className="result-body">
              {/* Left Column: Visual Astrolabe Zodiac Wheel */}
              <div className="result-visual-col">
                <svg viewBox="0 0 200 200" className="zodiac-wheel-svg">
                  <circle cx="100" cy="100" r="95" stroke="rgba(167, 139, 250, 0.15)" strokeWidth="0.8" fill="none" />
                  <circle cx="100" cy="100" r="75" stroke="rgba(255, 215, 0, 0.12)" strokeWidth="0.8" strokeDasharray="3,3" fill="none" />
                  <circle cx="100" cy="100" r="50" stroke="rgba(167, 139, 250, 0.08)" strokeWidth="0.5" fill="none" />
                  
                  {/* Outer coordinate divisions */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * Math.PI) / 6;
                    const x1 = 100 + Math.cos(angle) * 75;
                    const y1 = 100 + Math.sin(angle) * 75;
                    const x2 = 100 + Math.cos(angle) * 95;
                    const y2 = 100 + Math.sin(angle) * 95;
                    return (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(167, 139, 250, 0.2)" strokeWidth="0.5" />
                    );
                  })}

                  {/* Planet points & aspects lines (Mock dynamic alignments) */}
                  <polygon 
                    points="60,65 140,75 110,140 60,65" 
                    fill="rgba(139, 92, 246, 0.05)" 
                    stroke="rgba(139, 92, 246, 0.3)" 
                    strokeWidth="0.8" 
                  />
                  <line x1="140" y1="75" x2="60" y2="125" stroke="rgba(255, 215, 0, 0.25)" strokeWidth="0.5" strokeDasharray="2,2" />

                  {/* Planet nodes */}
                  <circle cx="60" cy="65" r="4" fill="#ffd700" className="pulse-dot" />
                  <text x="60" y="56" fill="#ffd700" fontSize="8" fontFamily="monospace" textAnchor="middle">☉</text>
                  
                  <circle cx="140" cy="75" r="3.5" fill="#a78bfa" />
                  <text x="140" y="67" fill="#a78bfa" fontSize="8" fontFamily="monospace" textAnchor="middle">☽</text>

                  <circle cx="110" cy="140" r="3.5" fill="#22d3ee" />
                  <text x="110" y="151" fill="#22d3ee" fontSize="8" fontFamily="monospace" textAnchor="middle">ASC</text>
                </svg>
              </div>

              {/* Right Column: Interactive Decoded Placement Tabs */}
              <div className="result-data-col">
                <div className="tab-buttons">
                  <button 
                    className={activeTab === 'placements' ? 'active' : ''} 
                    onClick={() => setActiveTab('placements')}
                  >
                    Placements
                  </button>
                  <button 
                    className={activeTab === 'aspects' ? 'active' : ''} 
                    onClick={() => setActiveTab('aspects')}
                  >
                    Aspects
                  </button>
                  <button 
                    className={activeTab === 'summary' ? 'active' : ''} 
                    onClick={() => setActiveTab('summary')}
                  >
                    AI Forecast
                  </button>
                </div>

                <div className="tab-pane">
                  {activeTab === 'placements' && (
                    <div className="placements-list">
                      <div className="placement-item">
                        <div className="placement-badge">☉ SUN</div>
                        <div className="placement-desc">
                          <strong>{chart.sun.sign} in {chart.sun.house}</strong>
                          <p>Your core life force. Expressed through the creative drives of {chart.sun.sign}, radiating purpose in your {chart.sun.house}.</p>
                        </div>
                      </div>
                      <div className="placement-item">
                        <div className="placement-badge">☽ MOON</div>
                        <div className="placement-desc">
                          <strong>{chart.moon.sign} in {chart.moon.house}</strong>
                          <p>Your emotional landscape. Governs your subconscious needs, responding with the depth of {chart.moon.sign} in the privacy of {chart.moon.house}.</p>
                        </div>
                      </div>
                      <div className="placement-item">
                        <div className="placement-badge">ASC ASCENDANT</div>
                        <div className="placement-desc">
                          <strong>{chart.ascendant.sign}</strong>
                          <p>Your lens on the world. The outer persona and physical shell, navigating first impressions with the traits of {chart.ascendant.sign}.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'aspects' && (
                    <div className="aspects-list">
                      <div className="aspect-item">
                        <span className="aspect-title">☉ Conjunction ☽ (0.5° Orb)</span>
                        <p>Sun and Moon are in close alignment. Your rational intent and emotional needs are fully synchronized, creating a highly driven, self-contained personality.</p>
                      </div>
                      <div className="aspect-item">
                        <span className="aspect-title">☉ Trine Ascendant (2.4° Orb)</span>
                        <p>Sun flowing harmoniously to the Ascendant. Self-expression is natural and effortless. Others perceive your inner character quickly and accurately.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'summary' && (
                    <div className="summary-pane">
                      <span className="summary-title">// NEURAL SYNTHESIS LOG</span>
                      <p className="summary-paragraph">
                        An active elemental emphasis on Air and Fire suggests high cognitive speed, social agency, and creative impulse. The current transit of Saturn oppositing your Natal Sun triggers a phase of structural refinement. Focus on boundary alignment and systemic discipline over the next three lunar cycles.
                      </p>
                      <div className="neural-integrity-bar">
                        <span>SYNTHESIS INTEGRITY</span>
                        <div className="bar-bg">
                          <div className="bar-fill" style={{ width: '94%' }}></div>
                        </div>
                        <span style={{ fontSize: '8px', color: 'var(--accent-gold)' }}>94.2% CONFIDENCE SCORE</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
