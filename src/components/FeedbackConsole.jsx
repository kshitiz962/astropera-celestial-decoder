import React, { useState, useEffect, useRef } from 'react';

export default function FeedbackConsole({ onClose }) {
  const [step, setStep] = useState('form'); // 'form' | 'transmitting' | 'success'
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    comments: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const transmissionLogs = [
    "SYS: Preparing telemetry feedback package...",
    "SYS: Establishing uplink connection to ASTROPERA core...",
    "SYS: Encrypting user ratings and comment arrays...",
    "LOG: Sending feedback payload (Size: 1.04 KB)...",
    "SUCCESS: Feedback stored. Cosmic database synced."
  ];

  const handleRatingClick = (val) => {
    setFormData(prev => ({ ...prev, rating: val }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.comments) return;

    setStep('transmitting');
    setLogs([]);
  };

  // Run mock transmission logs
  useEffect(() => {
    if (step !== 'transmitting') return;

    // Send actual email notification to creator in the background via Formsubmit.co
    fetch("https://formsubmit.co/ajax/kshitizranu6@gmail.com", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: formData.name,
        rating: `${formData.rating} Stars`,
        comments: formData.comments,
        _subject: `Astropera Feedback from ${formData.name}`
      })
    })
      .then(res => res.json())
      .catch(err => console.error("Error submitting feedback email:", err));

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < transmissionLogs.length) {
        setLogs(prev => [...prev, transmissionLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          // Save feedback to localStorage
          const existing = localStorage.getItem('astropera_saved_feedbacks');
          const feedbacks = existing ? JSON.parse(existing) : [];
          feedbacks.push({
            name: formData.name,
            rating: formData.rating,
            comments: formData.comments,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('astropera_saved_feedbacks', JSON.stringify(feedbacks));

          setStep('success');
        }, 800);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="chart-generator-overlay" style={{ zIndex: 600 }}>
      <div className="chart-generator-card" style={{ maxWidth: '520px', minHeight: 'auto' }}>
        
        {/* Notched corner brackets */}
        <div className="corner-bracket cb-tl"></div>
        <div className="corner-bracket cb-br"></div>

        {/* Close Button */}
        <button className="chart-close-btn" onClick={onClose}>✕</button>

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <div className="generator-step-form">
            <h2 className="generator-title">TRANSMIT FEEDBACK</h2>
            <p className="generator-subtitle">Beam your feedback and experiences into the cosmic database.</p>

            <form onSubmit={handleSubmit} className="generator-form" style={{ gap: '16px' }}>
              <div className="input-group">
                <label>01 // VISITOR NAME</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="ENTER YOUR NAME..." 
                  required
                />
              </div>

              <div className="input-group">
                <label>02 // COSMIC SATISFACTION (RATING)</label>
                <div style={{ display: 'flex', gap: '8px', margin: '8px 0', fontSize: '24px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star}
                      style={{
                        cursor: 'pointer',
                        color: star <= (hoverRating || formData.rating) ? '#ffd700' : 'rgba(255, 255, 255, 0.15)',
                        textShadow: star <= (hoverRating || formData.rating) ? '0 0 10px rgba(255, 215, 0, 0.6)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRatingClick(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>03 // SUBTITLE COMMENTS & OBSERVATIONS</label>
                <textarea 
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="TYPE YOUR OBSERVATIONS HERE..."
                  required
                  rows={4}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: 'none',
                    borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.05)';
                    e.target.style.borderColor = '#ffd700';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }}
                />
              </div>

              <button type="submit" className="decrypt-submit-btn" style={{ marginTop: '16px' }}>
                <span>&gt;_ Transmit Telemetry</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: TRANSMITTING */}
        {step === 'transmitting' && (
          <div className="generator-step-loading" style={{ padding: '20px 0' }}>
            <h2 className="generator-title">BEAMING FEEDBACK DATA...</h2>
            <div className="loader-scan-wrapper">
              <div className="loader-scan-bar"></div>
            </div>
            <div className="terminal-log-box" style={{ maxWidth: '100%', height: '120px' }}>
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

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="generator-step-result" style={{ textAlign: 'center', padding: '20px 0' }}>
            <h2 className="generator-title" style={{ color: '#00ffcc', textShadow: '0 0 15px rgba(0, 255, 204, 0.3)' }}>
              FEEDBACK SYNCED
            </h2>
            <p className="generator-subtitle" style={{ marginBottom: '24px' }}>
              Your transmission has been archived in the Astropera telemetry bank. Thank you!
            </p>
            
            <button 
              className="decrypt-submit-btn" 
              onClick={onClose} 
              style={{ margin: '0 auto', maxWidth: '200px' }}
            >
              <span>Close Terminal</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
