import React from 'react';
import ReactDOM from 'react-dom/client';
import ChartGenerator from './components/ChartGenerator';
import './index.css';

ReactDOM.createRoot(document.getElementById('chart-root')).render(
  <React.StrictMode>
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#050816',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(80, 20, 160, 0.25) 0%, rgba(20, 5, 50, 0.4) 40%, #03050f 75%)',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <ChartGenerator />
    </div>
  </React.StrictMode>
);
