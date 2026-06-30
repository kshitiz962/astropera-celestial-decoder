const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'visitors.json');

app.use(express.json());

// CORS - allow all origins (customize as needed)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Ensure data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      totalVisits: 0,
      uniqueVisitors: 0,
      visitorIds: [],
      history: []
    }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate a visitor ID from IP + User-Agent (hashed for privacy)
function getVisitorId(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(ip + ua).digest('hex');
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /stats/logs — returns recent access logs (last 20)
app.get('/stats/logs', (req, res) => {
  const data = readData();
  const recent = data.history.slice(-20);
  res.json(recent);
});

// GET / — serves the beautiful cosmic telemetry control panel
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASTROPERA // Telemetry Dashboard</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Outfit:wght@300;400;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background: #050816;
      color: #d6f0ff;
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      position: relative;
    }
    
    body::before {
      content: '';
      position: absolute;
      top: -10%;
      left: 10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(123, 111, 255, 0.15) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    body::after {
      content: '';
      position: absolute;
      bottom: -10%;
      right: 10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(74, 240, 208, 0.12) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    
    header {
      border-bottom: 1px solid rgba(74, 240, 208, 0.15);
      background: rgba(8, 28, 58, 0.4);
      backdrop-filter: blur(12px);
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      position: relative;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .pulse-dot {
      width: 10px;
      height: 10px;
      background: #4af0d0;
      border-radius: 50%;
      box-shadow: 0 0 10px #4af0d0;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    
    h1 {
      font-size: 18px;
      letter-spacing: 0.15em;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      color: #ffffff;
      text-shadow: 0 0 8px rgba(74, 240, 208, 0.3);
    }
    
    .status-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #4af0d0;
      border: 1px solid rgba(74, 240, 208, 0.3);
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(74, 240, 208, 0.05);
    }
    
    main {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 40px 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      z-index: 10;
      position: relative;
    }
    
    @media (max-width: 900px) {
      main {
        grid-template-columns: 1fr;
      }
    }
    
    .card {
      background: rgba(10, 8, 28, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(25px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .card-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
      color: #a0e9ff;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .stat-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.3s ease;
    }
    
    .stat-box:hover {
      border-color: rgba(74, 240, 208, 0.25);
      box-shadow: 0 0 15px rgba(74, 240, 208, 0.05);
    }
    
    .stat-val {
      font-size: 36px;
      font-weight: 700;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
    }
    
    .stat-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .console-logs {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 16px;
      height: 250px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: #d6f0ff;
    }
    
    .log-entry {
      display: flex;
      gap: 10px;
      line-height: 1.4;
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);
      padding-bottom: 6px;
    }
    
    .log-time {
      color: #7b6fff;
      flex-shrink: 0;
    }
    
    .log-page {
      color: #4af0d0;
      font-weight: bold;
    }
    
    .log-status-new {
      color: #c4f542;
      background: rgba(196, 245, 66, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 9px;
    }
    
    .log-status-return {
      color: #a0e9ff;
      background: rgba(160, 233, 255, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 9px;
    }
    
    .chart-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 180px;
      padding: 10px 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      gap: 12px;
    }
    
    .chart-bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .chart-bar-glow {
      width: 100%;
      border-radius: 4px 4px 0 0;
      background: linear-gradient(180deg, #4af0d0 0%, #7b6fff 100%);
      box-shadow: 0 0 10px rgba(74, 240, 208, 0.3);
      min-height: 2px;
      position: relative;
      transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .chart-bar-val {
      font-size: 9px;
      font-family: 'JetBrains Mono', monospace;
      color: #ffffff;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .chart-bar-wrapper:hover .chart-bar-glow {
      box-shadow: 0 0 15px rgba(74, 240, 208, 0.6);
    }
    
    .chart-bar-wrapper:hover .chart-bar-val {
      opacity: 1;
    }
    
    .chart-label {
      font-size: 9px;
      font-family: 'JetBrains Mono', monospace;
      color: #94a3b8;
    }
    
    footer {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding: 20px;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #5c7499;
      margin-top: auto;
      z-index: 10;
      position: relative;
    }
  </style>
</head>
<body>

  <header>
    <div class="logo-container">
      <div class="pulse-dot"></div>
      <h1>ASTROPERA // TELEMETRY GATEWAY</h1>
    </div>
    <div class="status-label">STATUS: SYSTEM_ONLINE</div>
  </header>

  <main>
    <div style="display: flex; flex-direction: column; gap: 30px;">
      <div class="card">
        <div class="card-title">
          <span>✦</span> Core Telemetry
        </div>
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-val" id="total-visits">0</span>
            <span class="stat-label">Total Visits</span>
          </div>
          <div class="stat-box">
            <span class="stat-val" id="unique-visitors">0</span>
            <span class="stat-label">Unique Visitors</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">
          <span>✦</span> Real-time Access Log
        </div>
        <div class="console-logs" id="console-logs">
          <div class="log-entry" style="color: #94a3b8;">Listening for incoming telemetry...</div>
        </div>
      </div>
    </div>

    <div class="card" style="height: 100%;">
      <div class="card-title">
        <span>✦</span> 7-Day Traffic Breakdown
      </div>
      <div class="chart-container" id="chart-container">
        <!-- Bars load here -->
      </div>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; padding-top: 10px;">
        <span>DAILY VISITOR COUNT BREAKDOWN</span>
        <span>SYS_GATEWAY_V1.0</span>
      </div>
    </div>
  </main>

  <footer>
    ASTROPERA TELEMETRY PORTAL v1.0.0 // COGNITIVE LABS
  </footer>

  <script>
    function updateStats() {
      fetch('/stats')
        .then(res => res.json())
        .then(data => {
          document.getElementById('total-visits').textContent = data.totalVisits.toLocaleString();
          document.getElementById('unique-visitors').textContent = data.uniqueVisitors.toLocaleString();
        })
        .catch(err => console.error("Error fetching stats:", err));
        
      fetch('/stats/logs')
        .then(res => res.json())
        .then(logs => {
          const container = document.getElementById('console-logs');
          container.innerHTML = '';
          if (logs.length === 0) {
            container.innerHTML = '<div class="log-entry" style="color: #94a3b8;">No incoming telemetry tracked yet.</div>';
            return;
          }
          logs.slice().reverse().forEach(log => {
            const date = new Date(log.timestamp);
            const timeStr = date.toTimeString().slice(0, 8);
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            
            const badge = log.isNew 
              ? '<span class="log-status-new">NEW</span>' 
              : '<span class="log-status-return">RTN</span>';
              
            entry.innerHTML = 
              '<span class="log-time">[' + timeStr + ']</span> ' +
              badge +
              ' <span>Page load on <span class="log-page">' + log.page + '</span></span>';
            container.appendChild(entry);
          });
        })
        .catch(err => {});
    }

    function buildChart() {
      fetch('/stats/history?days=7')
        .then(res => res.json())
        .then(data => {
          const container = document.getElementById('chart-container');
          container.innerHTML = '';
          
          const maxVisits = Math.max(...data.breakdown.map(d => d.visits), 1);
          
          data.breakdown.forEach(day => {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'chart-bar-wrapper';
            
            const heightPercent = (day.visits / maxVisits) * 100;
            
            const d = new Date(day.date);
            const labelStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            barWrapper.innerHTML = 
              '<span class="chart-bar-val">' + day.visits + '</span>' +
              '<div class="chart-bar-glow" style="height: ' + heightPercent + '%"></div>' +
              '<span class="chart-label">' + labelStr + '</span>';
            container.appendChild(barWrapper);
          });
        })
        .catch(err => {});
    }

    updateStats();
    buildChart();
    
    setInterval(updateStats, 3000);
    setInterval(buildChart, 8000);
  </script>
</body>
</html>`);
});

// POST /track — call this from your website on each page load
app.post('/track', (req, res) => {
  const data = readData();
  const visitorId = getVisitorId(req);
  const now = new Date().toISOString();

  data.totalVisits += 1;

  const isNew = !data.visitorIds.includes(visitorId);
  if (isNew) {
    data.uniqueVisitors += 1;
    data.visitorIds.push(visitorId);
  }

  data.history.push({
    timestamp: now,
    isNew,
    page: req.body.page || '/'
  });

  // Keep history to last 10,000 entries
  if (data.history.length > 10000) data.history = data.history.slice(-10000);

  writeData(data);

  res.json({
    success: true,
    totalVisits: data.totalVisits,
    uniqueVisitors: data.uniqueVisitors,
    isNewVisitor: isNew
  });
});

// GET /stats — returns visitor counts
app.get('/stats', (req, res) => {
  const data = readData();
  res.json({
    totalVisits: data.totalVisits,
    uniqueVisitors: data.uniqueVisitors,
    lastUpdated: data.history.at(-1)?.timestamp || null
  });
});

// GET /stats/history?days=7 — returns daily breakdown
app.get('/stats/history', (req, res) => {
  const data = readData();
  const days = Math.min(parseInt(req.query.days) || 7, 90);

  const buckets = {};
  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { visits: 0, newVisitors: 0 };
  }

  for (const entry of data.history) {
    const key = entry.timestamp.slice(0, 10);
    if (buckets[key]) {
      buckets[key].visits += 1;
      if (entry.isNew) buckets[key].newVisitors += 1;
    }
  }

  res.json({
    days,
    breakdown: Object.entries(buckets).map(([date, counts]) => ({ date, ...counts }))
  });
});

// GET /reset — resets all data (protect this in production!)
app.post('/reset', (req, res) => {
  const secret = process.env.RESET_SECRET;
  if (secret && req.headers['x-reset-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  writeData({ totalVisits: 0, uniqueVisitors: 0, visitorIds: [], history: [] });
  res.json({ success: true, message: 'All visitor data has been reset.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Visitor Counter API running at http://localhost:${PORT}`);
  console.log(`   POST /track        → record a visit`);
  console.log(`   GET  /stats        → get total counts`);
  console.log(`   GET  /stats/history?days=7 → daily breakdown`);
});
